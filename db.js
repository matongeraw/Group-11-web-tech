/* =====================================================================
   DATABASE LAYER - Cloud Firestore sync for the static portal
   ---------------------------------------------------------------------
   How it works
   - The pages keep reading and writing localStorage exactly as before.
     localStorage is the fast local copy.
   - When firebase-config.js contains a Firebase config, this file mirrors
     the keys listed in COLLECTIONS / DOCS to Cloud Firestore and listens
     for changes, so every device sees the same data live.
   - With no config (or no internet) the site still works, browser-only.

   Firestore layout (one document per record, real fields):
     verifications/{id}            auVerificationQueue
     referenceLetters/{id}         auReferenceDrafts
     transcripts/{id}              auTranscriptQueue
     verifiers/{id}                auVerifiers
     logbooks/{studentId-wN}       auLogbooks
     auditTrail/{id}               auAuditTrail      (append-only)
     recommendationRequests/{id}   auRecommendationRequests
     portalState/assignmentStatus  auAssignmentStatus

   To sync another list: save it to localStorage as a JSON array of
   objects that each have an `id`, then add one line to COLLECTIONS and
   to firestore.rules.

   Other scripts can listen for:
     window 'au-db-change'  detail: { key }      remote data was applied
     window 'au-db-status'  detail: { state, message }
   ===================================================================== */
(function () {
  'use strict';

  var SDK_VERSION = '12.11.0';
  var SDK_BASE = window.AU_FIREBASE_SDK_BASE || ('https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/');
  var PENDING_KEY = 'auDbPending';

  var COLLECTIONS = {
    auVerificationQueue: { name: 'verifications' },
    auReferenceDrafts: { name: 'referenceLetters' },
    auTranscriptQueue: { name: 'transcripts' },
    auVerifiers: { name: 'verifiers' },
    auLogbooks: { name: 'logbooks', id: function (r) { return r.sid + '-w' + r.week; } },
    auAuditTrail: { name: 'auditTrail', appendOnly: true },
    auRecommendationRequests: { name: 'recommendationRequests' }
  };
  var DOCS = {
    auAssignmentStatus: { collection: 'portalState', id: 'assignmentStatus' }
  };

  var store = window.localStorage;
  var rawSet = Storage.prototype.setItem;
  var rawRemove = Storage.prototype.removeItem;
  var status = { state: 'local', message: 'Saved in this browser only (no cloud database configured).' };
  var fs = null;            // Firestore SDK module
  var db = null;            // Firestore instance
  var armed = false;        // true once the page has finished its own start-up writes
  var synced = {};          // key -> true after the first server snapshot was merged
  var known = {};           // key -> { id: json } last state known to be in (or on its way to) Firestore
  var applying = false;     // true while we copy remote data into localStorage

  /* ---------- small helpers ---------- */
  function setStatus(state, message) {
    status = { state: state, message: message };
    try { window.dispatchEvent(new CustomEvent('au-db-status', { detail: status })); } catch (e) {}
    renderPill();
  }
  function readJSON(key, fallback) {
    try { var v = JSON.parse(store.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function safeId(v) { return String(v).replace(/[\/\s#?\[\]*]/g, '_').slice(0, 200); }
  function recordId(key, rec) {
    var c = COLLECTIONS[key];
    var id = c.id ? c.id(rec) : rec && rec.id;
    return id == null || id === '' ? null : safeId(id);
  }
  function clean(rec) { return JSON.parse(JSON.stringify(rec)); }   // drops undefined, clones
  // Stable text form (sorted keys) so the same record compares equal whatever order its fields arrive in.
  function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }
  function toMap(key, list) {
    var map = {}, order = [];
    (Array.isArray(list) ? list : []).forEach(function (rec) {
      if (!rec || typeof rec !== 'object') return;
      var id = recordId(key, rec);
      if (id == null || map[id]) return;
      map[id] = canon(clean(rec)); order.push(id);
    });
    return { map: map, order: order };
  }
  function pendingAll() { return readJSON(PENDING_KEY, {}) || {}; }
  function pendingAdd(key, ids) {
    if (!ids.length) return;
    var p = pendingAll(); var cur = p[key] || [];
    ids.forEach(function (id) { if (cur.indexOf(id) < 0) cur.push(id); });
    p[key] = cur;
    try { rawSet.call(store, PENDING_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function pendingClear(key, ids) {
    var p = pendingAll(); if (!p[key]) return;
    p[key] = p[key].filter(function (id) { return ids.indexOf(id) < 0; });
    if (!p[key].length) delete p[key];
    try { rawSet.call(store, PENDING_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function writeLocal(key, value) {
    applying = true;
    try { rawSet.call(store, key, JSON.stringify(value)); } catch (e) {}
    applying = false;
    try { window.dispatchEvent(new CustomEvent('au-db-change', { detail: { key: key } })); } catch (e) {}
  }
  function fail(where, err) {
    var denied = err && (err.code === 'permission-denied' || /permission/i.test(err.message || ''));
    console.warn('[db] ' + where + ' failed:', err);
    setStatus('error', denied
      ? 'Cloud database refused the request. Publish the rules from firestore.rules in the Firebase console. Changes are kept in this browser.'
      : 'Cloud database error. Changes are kept in this browser and will be retried.');
  }

  /* ---------- pushing local changes to Firestore ---------- */
  function pushCollection(key, forceIds) {
    if (!db || !synced[key]) return;
    var c = COLLECTIONS[key];
    var local = toMap(key, readJSON(key, []));
    var prev = known[key] || {};
    var batch = fs.writeBatch(db), touched = [], n = 0;
    local.order.forEach(function (id, i) {
      var json = local.map[id];
      var entry = json + '#' + i;
      var isNew = !(id in prev);
      if (c.appendOnly && !isNew) return;                       // never rewrite history
      if (prev[id] === entry && !(forceIds && forceIds.indexOf(id) >= 0)) return;
      var data = JSON.parse(json);
      data._order = i;
      data._updatedAt = fs.serverTimestamp();
      batch.set(fs.doc(db, c.name, id), data);
      prev[id] = entry; touched.push(id); n++;
    });
    if (!c.appendOnly) {
      Object.keys(prev).forEach(function (id) {
        if (id in local.map) return;
        batch.delete(fs.doc(db, c.name, id));
        delete prev[id]; touched.push(id); n++;
      });
    }
    known[key] = prev;
    if (!n) return;
    pendingAdd(key, touched);
    batch.commit().then(function () {
      pendingClear(key, touched);
      if (status.state !== 'cloud') setStatus('cloud', 'Connected to the cloud database. Changes are shared live.');
    }).catch(function (err) { fail('Saving ' + c.name, err); });
  }
  function pushDoc(key) {
    if (!db || !synced[key]) return;
    var d = DOCS[key], raw = store.getItem(key);
    if (raw == null || known[key] === raw) return;
    var value; try { value = JSON.parse(raw); } catch (e) { return; }
    known[key] = raw;
    pendingAdd(key, ['doc']);
    fs.setDoc(fs.doc(db, d.collection, d.id), { data: clean(value), _updatedAt: fs.serverTimestamp() })
      .then(function () { pendingClear(key, ['doc']); })
      .catch(function (err) { fail('Saving ' + d.id, err); });
  }

  /* ---------- applying Firestore changes locally ---------- */
  function onCollectionSnapshot(key, snap) {
    var c = COLLECTIONS[key];
    if (snap.metadata && snap.metadata.fromCache && !synced[key]) return;   // wait for the server's answer
    var rows = [];
    snap.docs.forEach(function (d) {
      var data = d.data() || {};
      var order = typeof data._order === 'number' ? data._order : 1e9;
      delete data._order; delete data._updatedAt;
      rows.push({ id: d.id, order: order, rec: data });
    });
    rows.sort(function (a, b) { return a.order - b.order || (a.id < b.id ? -1 : 1); });

    if (!synced[key]) {
      // First answer from the server: merge it with anything this browser changed while offline.
      var local = toMap(key, readJSON(key, []));
      var pend = (pendingAll()[key] || []);
      var remoteIds = rows.map(function (r) { return r.id; });
      var merged, k = {};
      if (!rows.length) {
        merged = readJSON(key, []);                       // empty database: this browser's data seeds it
      } else {
        merged = rows.filter(function (r) { return !(pend.indexOf(r.id) >= 0 && !(r.id in local.map) && !c.appendOnly); })
          .map(function (r) { return pend.indexOf(r.id) >= 0 && r.id in local.map && !c.appendOnly ? JSON.parse(local.map[r.id]) : r.rec; });
        local.order.forEach(function (id) {               // unsent new records made offline
          if (pend.indexOf(id) >= 0 && remoteIds.indexOf(id) < 0) merged.push(JSON.parse(local.map[id]));
        });
        rows.forEach(function (r, i) { k[r.id] = canon(clean(r.rec)) + '#' + (r.order === 1e9 ? i : r.order); });
      }
      known[key] = k;
      synced[key] = true;
      if (JSON.stringify(toMap(key, merged)) !== JSON.stringify(toMap(key, readJSON(key, [])))) writeLocal(key, merged);
      pendingClear(key, pend);                            // pushCollection re-marks whatever still needs sending
      pushCollection(key);
      return;
    }

    var k2 = {};
    rows.forEach(function (r, i) { k2[r.id] = canon(clean(r.rec)) + '#' + (r.order === 1e9 ? i : r.order); });
    known[key] = k2;
    var list = rows.map(function (r) { return r.rec; });
    if (JSON.stringify(toMap(key, list)) !== JSON.stringify(toMap(key, readJSON(key, [])))) writeLocal(key, list);
  }
  function onDocSnapshot(key, snap) {
    if (snap.metadata && snap.metadata.fromCache && !synced[key]) return;
    var first = !synced[key];
    synced[key] = true;
    var exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
    var pend = (pendingAll()[key] || []).length > 0;
    if (!exists || (first && pend)) { if (first) pushDoc(key); return; }
    var value = (snap.data() || {}).data;
    if (value === undefined) return;
    var raw = JSON.stringify(value), cur = store.getItem(key), same = false;
    try { same = cur != null && canon(JSON.parse(cur)) === canon(value); } catch (e) {}
    known[key] = same ? cur : raw;
    if (!same) {
      applying = true; try { rawSet.call(store, key, raw); } catch (e) {} applying = false;
      try { window.dispatchEvent(new CustomEvent('au-db-change', { detail: { key: key } })); } catch (e) {}
    }
  }

  /* ---------- intercept the site's own saves ---------- */
  function afterLocalWrite(key) {
    if (applying || !armed) return;
    if (COLLECTIONS[key]) {
      if (db && synced[key]) pushCollection(key);
      else if (window.AU_FIREBASE_CONFIG) {                // not connected yet: remember what changed
        var before = known['_base_' + key] || {}, now = toMap(key, readJSON(key, [])), ids = [];
        now.order.forEach(function (id) { if (before[id] !== now.map[id]) ids.push(id); });
        Object.keys(before).forEach(function (id) { if (!(id in now.map)) ids.push(id); });
        pendingAdd(key, ids);
      }
    } else if (DOCS[key]) {
      if (db && synced[key]) pushDoc(key);
      else if (window.AU_FIREBASE_CONFIG) pendingAdd(key, ['doc']);
    }
  }
  Storage.prototype.setItem = function (key, value) {
    rawSet.call(this, key, value);
    if (this === store && (COLLECTIONS[key] || DOCS[key])) { try { afterLocalWrite(key); } catch (e) { console.warn('[db]', e); } }
  };
  Storage.prototype.removeItem = function (key) {
    rawRemove.call(this, key);
    if (this === store && COLLECTIONS[key]) { try { afterLocalWrite(key); } catch (e) { console.warn('[db]', e); } }
  };

  /* ---------- status pill ---------- */
  var pill;
  function renderPill() {
    if (!document.body) return;
    var host = document.getElementById('topbar-role-badge');
    if (!pill) {
      pill = document.createElement('span');
      pill.id = 'db-status-pill';
      pill.setAttribute('role', 'status');
      pill.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap;border:1px solid #e3e3e7;background:#fff;color:#5b5b63;cursor:help';
      if (host && host.parentNode) host.parentNode.insertBefore(pill, host);
      else { pill.style.position = 'fixed'; pill.style.left = '12px'; pill.style.bottom = '12px'; pill.style.zIndex = '60'; document.body.appendChild(pill); }
    }
    var look = { local: ['#9a9aa0', 'Local only'], connecting: ['#d97706', 'Connecting…'], cloud: ['#16794c', 'Cloud database'], error: ['#c5162e', 'Database offline'] }[status.state];
    pill.innerHTML = '<i style="width:7px;height:7px;border-radius:50%;background:' + look[0] + ';display:inline-block"></i>' + look[1];
    pill.title = status.message;
    pill.setAttribute('aria-label', look[1] + '. ' + status.message);
  }

  /* ---------- connect ---------- */
  function connect() {
    var cfg = window.AU_FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || !cfg.apiKey) { setStatus('local', status.message); return; }
    setStatus('connecting', 'Connecting to the cloud database…');
    Object.keys(COLLECTIONS).forEach(function (key) { known['_base_' + key] = toMap(key, readJSON(key, [])).map; });
    Promise.all([import(SDK_BASE + 'firebase-app.js'), import(SDK_BASE + 'firebase-firestore.js')]).then(function (m) {
      fs = m[1];
      db = fs.getFirestore(m[0].initializeApp(cfg));
      var firstSeen = 0, total = Object.keys(COLLECTIONS).length;
      Object.keys(COLLECTIONS).forEach(function (key) {
        var seen = false;
        fs.onSnapshot(fs.collection(db, COLLECTIONS[key].name), { includeMetadataChanges: true }, function (snap) {
          try { onCollectionSnapshot(key, snap); } catch (e) { console.warn('[db]', key, e); }
          if (!seen && synced[key]) { seen = true; if (++firstSeen === total && status.state === 'connecting') setStatus('cloud', 'Connected to the cloud database. Changes are shared live.'); }
        }, function (err) { fail('Reading ' + COLLECTIONS[key].name, err); });
      });
      Object.keys(DOCS).forEach(function (key) {
        fs.onSnapshot(fs.doc(db, DOCS[key].collection, DOCS[key].id), { includeMetadataChanges: true }, function (snap) {
          try { onDocSnapshot(key, snap); } catch (e) { console.warn('[db]', key, e); }
        }, function (err) { fail('Reading ' + DOCS[key].id, err); });
      });
      setTimeout(function () {
        if (status.state === 'connecting') setStatus('error', 'Could not reach the cloud database yet (offline, or Firestore not created). Changes are kept in this browser and sent when it connects.');
      }, 12000);
    }).catch(function (err) {
      console.warn('[db] Could not load the Firebase SDK:', err);
      setStatus('error', 'Could not load the cloud database (offline?). Changes are kept in this browser.');
    });
  }

  window.auDB = {
    status: function () { return status; },
    isCloud: function () { return !!db; },
    collections: COLLECTIONS
  };

  function start() { armed = true; renderPill(); connect(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
  else setTimeout(start, 0);
})();
