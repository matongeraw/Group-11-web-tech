import { useCallback, useState } from "react"
import type { AsyncState } from "../types"

export function useApiState<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" })

  const load = useCallback(async (request: () => Promise<T>, isEmpty?: (data: T) => boolean) => {
    setState({ status: "loading" })
    try {
      const data = await request()
      const empty = isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0
      setState(empty ? { status: "empty", data } : { status: "success", data })
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : "The request could not be completed."
      setState({ status: "error", message })
      return undefined
    }
  }, [])

  const reset = useCallback(() => setState({ status: "loading" }), [])
  return { state, load, reset }
}
