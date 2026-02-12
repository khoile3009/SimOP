import type { RefObject } from 'react'

interface AttackArrowProps {
  sourceX: number
  sourceY: number
  lineRef: RefObject<SVGLineElement | null>
}

export default function AttackArrow({ sourceX, sourceY, lineRef }: AttackArrowProps) {
  return (
    <svg className="pointer-events-none fixed inset-0 z-40" style={{ width: '100vw', height: '100vh' }}>
      <defs>
        <marker id="attack-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
      </defs>
      <line
        ref={lineRef}
        x1={sourceX}
        y1={sourceY}
        x2={sourceX}
        y2={sourceY}
        stroke="#ef4444"
        strokeWidth="3"
        strokeDasharray="8 4"
        markerEnd="url(#attack-arrow)"
        opacity="0.8"
      />
    </svg>
  )
}
