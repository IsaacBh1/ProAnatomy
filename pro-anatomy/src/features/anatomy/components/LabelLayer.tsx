import { memo } from 'react'
import { LABELS } from '../constants/labels'
import { useLabelStore } from '../store/labelStore'
import type { LabelItem } from '../types/labels'
import { labelGeometry } from '../utils/labelLayout'

const LabelMark = memo(function LabelMark({ label }: { label: LabelItem }) {
  const { side, elbowX, tickX, textX } = labelGeometry(label)
  const { anchorX, anchorY, labelY } = label

  return (
    <g>
      <polyline
        points={`${anchorX},${anchorY} ${elbowX},${labelY} ${tickX},${labelY}`}
        fill="none"
        strokeWidth={label.pinned ? 1.4 : 1.1}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ stroke: 'var(--color-muted)' }}
      />
      {label.pinned && (
        // Ring around the dot, so the eye lands on it even in a busy frame.
        <circle
          cx={anchorX}
          cy={anchorY}
          r={6}
          fill="none"
          strokeWidth={1.4}
          style={{ stroke: 'var(--color-content)' }}
        />
      )}
      <circle
        cx={anchorX}
        cy={anchorY}
        r={label.pinned ? 3.2 : 2.6}
        strokeWidth={1.2}
        style={{ fill: 'var(--color-content)', stroke: 'var(--color-canvas)' }}
      />
      <text
        x={textX}
        y={labelY}
        textAnchor={side === 'left' ? 'end' : 'start'}
        dominantBaseline="central"
        fontSize={label.pinned ? 12 : 11}
        fontWeight={label.pinned ? 700 : 600}
        strokeLinejoin="round"
        style={{
          fill: 'var(--color-content)',
          stroke: 'var(--color-canvas)',
          strokeWidth: label.pinned ? 4 : 3.5,
          paintOrder: 'stroke',
        }}
      >
        {label.name}
      </text>
    </g>
  )
})

/** Screen-space leader lines and names. Decorative: the parts are also reachable by search. */
export function LabelLayer() {
  const items = useLabelStore((state) => state.items)

  return (
    <svg
      aria-hidden
      data-label-count={items.length}
      className="pointer-events-none absolute inset-0 z-[4] size-full overflow-visible"
      style={{ '--label-line-height': `${LABELS.lineHeight}px` } as React.CSSProperties}
    >
      {items.map((label) => (
        <LabelMark key={label.id} label={label} />
      ))}
    </svg>
  )
}
