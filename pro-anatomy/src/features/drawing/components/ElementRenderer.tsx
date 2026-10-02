import { memo } from 'react'
import type { DrawElement } from '../types'
import { freehandToSvgPath } from '../utils/freehand'

/**
 * Concrete font stack so text survives SVG → image serialisation during snapshot.
 * Keep in sync with `--font-sans` in src/styles/variables.css.
 */
const FONT_FAMILY = "'Inter Variable', ui-sans-serif, system-ui, sans-serif"

const dashArray = (dash: DrawElement['style']['dash'], width: number): string | undefined => {
  if (dash === 'dashed') return `${width * 3} ${width * 2}`
  if (dash === 'dotted') return `${width * 0.1} ${width * 2}`
  return undefined
}

const fillWithOpacity = (fill: string | null, soft: boolean): string | undefined => {
  if (!fill) return undefined
  if (!soft) return fill
  return `${fill}33` // 20% alpha
}

interface Props {
  element: DrawElement
  hitWidth?: number
}

export const ElementRenderer = memo(function ElementRenderer({ element, hitWidth }: Props) {
  const { style } = element
  const stroke = style.stroke
  const sw = style.strokeWidth
  const fill = fillWithOpacity(style.fill, style.fill === 'soft')
  const dashArrayValue = dashArray(style.dash, sw)

  const common = {
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: dashArrayValue,
    fill: fill ?? 'none',
    opacity: style.opacity,
  }

  const hitProps = hitWidth
    ? { stroke: 'transparent', strokeWidth: hitWidth, fill: 'none' }
    : null

  switch (element.type) {
    case 'freehand': {
      const d = freehandToSvgPath(element.points, sw)
      if (!d) return null
      return (
        <>
          {hitWidth && <path d={d} {...hitProps} pointerEvents="stroke" />}
          <path d={d} {...common} fill={stroke} />
        </>
      )
    }
    case 'line':
      return (
        <>
          {hitWidth && (
            <line
              x1={element.x1}
              y1={element.y1}
              x2={element.x2}
              y2={element.y2}
              {...hitProps}
              pointerEvents="stroke"
            />
          )}
          <line x1={element.x1} y1={element.y1} x2={element.x2} y2={element.y2} {...common} />
        </>
      )
    case 'arrow': {
      const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1)
      const headLen = 6 + sw * 2.5
      const headAngle = Math.PI / 6
      const x1 = element.x2 - headLen * Math.cos(angle - headAngle)
      const y1 = element.y2 - headLen * Math.sin(angle - headAngle)
      const x2 = element.x2 - headLen * Math.cos(angle + headAngle)
      const y2 = element.y2 - headLen * Math.sin(angle + headAngle)
      return (
        <>
          {hitWidth && (
            <line
              x1={element.x1}
              y1={element.y1}
              x2={element.x2}
              y2={element.y2}
              {...hitProps}
              pointerEvents="stroke"
            />
          )}
          <line
            x1={element.x1}
            y1={element.y1}
            x2={element.x2}
            y2={element.y2}
            {...common}
            fill="none"
          />
          <polygon
            points={`${element.x2},${element.y2} ${x1},${y1} ${x2},${y2}`}
            fill={stroke}
            opacity={style.opacity}
          />
        </>
      )
    }
    case 'rect':
      return (
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          {...common}
        />
      )
    case 'ellipse':
      return (
        <ellipse cx={element.cx} cy={element.cy} rx={element.rx} ry={element.ry} {...common} />
      )
    case 'text':
      return (
        <text
          x={element.x}
          y={element.y}
          fill={stroke}
          fontSize={element.fontSize}
          fontFamily={FONT_FAMILY}
          opacity={style.opacity}
          dominantBaseline="alphabetic"
          style={{ userSelect: 'none', whiteSpace: 'pre' }}
        >
          {element.text}
        </text>
      )
  }
})
