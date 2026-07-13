import { useId, type InputHTMLAttributes } from 'react'
import './components.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={['gg-field', error ? 'gg-field--error' : '', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className="gg-input"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} className="gg-field-error">
          {error}
        </span>
      )}
    </div>
  )
}
