interface MarqueeProps {
  items: string[]
  className?: string
}

/** Letrero de texto que se desplaza sin fin. Si no hay nada que decir, no se renderiza. */
export function Marquee({ items, className }: MarqueeProps) {
  if (items.length === 0) return null

  return (
    <div className={'gg-marquee' + (className ? ` ${className}` : '')}>
      <div className="gg-marquee-track">
        {[...items, ...items].map((texto, i) => (
          <span key={i} className="gg-marquee-item">
            {texto}
          </span>
        ))}
      </div>
    </div>
  )
}
