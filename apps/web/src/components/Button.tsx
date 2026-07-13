import type { ButtonHTMLAttributes } from 'react'
import './components.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  const classes = [
    'gg-button',
    `gg-button--${variant}`,
    size === 'lg' ? 'gg-button--lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} {...rest} />
}
