import type { HTMLAttributes } from 'react'
import './components.css'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const classes = ['gg-card', className].filter(Boolean).join(' ')
  return <div className={classes} {...rest} />
}
