import { useEffect, useRef, useState } from 'react'

/**
 * Windowed rendering for big card grids: render the first `chunk` items and
 * grow the window whenever the sentinel scrolls into view. Combined with
 * native lazy image loading this keeps a 1,800-card pool from mounting (and
 * fetching) everything at once.
 */
export function useIncrementalList<T>(items: T[], chunk = 60) {
  const [limit, setLimit] = useState(chunk)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // New filter results restart the window (adjust-during-render, not an effect:
  // React re-renders immediately with the reset limit, before painting)
  const [prevItems, setPrevItems] = useState(items)
  if (prevItems !== items) {
    setPrevItems(items)
    setLimit(chunk)
  }

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || limit >= items.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLimit((n) => Math.min(items.length, n + chunk))
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [items, limit, chunk])

  return {
    visible: items.slice(0, limit),
    hasMore: limit < items.length,
    sentinelRef,
  }
}
