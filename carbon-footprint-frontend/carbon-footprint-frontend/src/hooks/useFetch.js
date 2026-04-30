import { useState, useEffect, useCallback, useRef } from 'react'

export function useFetch(fetchFn, deps = [], options = {}) {
  const { enabled = true, refreshIntervalMs = null } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const isMounted = useRef(true)

  const execute = useCallback(async () => {
    if (!enabled) {
      if (isMounted.current) setLoading(false)
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetchFn()
      if (isMounted.current) setData(res.data)
      return res
    } catch (err) {
      if (isMounted.current) setError(err?.response?.data || err.message || 'Unknown error')
      return null
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [enabled, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMounted.current = true
    if (!enabled) {
      setLoading(false)
      setError(null)
      return () => { isMounted.current = false }
    }

    execute()
    let intervalId = null
    if (refreshIntervalMs && refreshIntervalMs > 0) {
      intervalId = setInterval(() => {
        execute()
      }, refreshIntervalMs)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
      isMounted.current = false
    }
  }, [enabled, execute, refreshIntervalMs])

  return { data, loading, error, refetch: execute }
}
