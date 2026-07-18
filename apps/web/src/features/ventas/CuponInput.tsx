import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Tag, X } from 'lucide-react'
import { validarCupon } from '../../lib/api'

interface CuponInputProps {
  onAplicar: (porcentaje: number, codigo: string) => void
  onQuitar: () => void
}

/** Input de "¿tienes un cupón?": al validarse, autocompleta el % de
 * descuento normal de la venta — no es un mecanismo aparte, solo una
 * forma más fácil de llenar ese mismo campo. */
export function CuponInput({ onAplicar, onQuitar }: CuponInputProps) {
  const [codigo, setCodigo] = useState('')
  const [aplicado, setAplicado] = useState<{ codigo: string; porcentaje: number } | null>(null)

  const mutacion = useMutation({ mutationFn: validarCupon })

  function handleAplicar() {
    if (!codigo.trim()) return
    mutacion.mutate(codigo.trim(), {
      onSuccess: (resultado) => {
        if (resultado.valido && resultado.porcentaje) {
          const codigoNormalizado = codigo.trim().toUpperCase()
          setAplicado({ codigo: codigoNormalizado, porcentaje: resultado.porcentaje })
          onAplicar(resultado.porcentaje, codigoNormalizado)
        }
      },
    })
  }

  function handleQuitar() {
    setAplicado(null)
    setCodigo('')
    mutacion.reset()
    onQuitar()
  }

  if (aplicado) {
    return (
      <div className="gg-cupon-aplicado">
        <Check size={14} />
        Cupón {aplicado.codigo} aplicado (-{aplicado.porcentaje}%)
        <button type="button" onClick={handleQuitar} aria-label="Quitar cupón">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="gg-cupon-input-wrap">
      <div className="gg-cupon-input">
        <input
          className="gg-input"
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="¿Tienes un cupón? Escribe el código"
        />
        <button
          type="button"
          className="gg-cupon-boton"
          onClick={handleAplicar}
          disabled={mutacion.isPending || !codigo.trim()}
        >
          <Tag size={14} />
          Aplicar
        </button>
      </div>
      {mutacion.isSuccess && !mutacion.data.valido && (
        <p className="gg-field-error">{mutacion.data.mensaje}</p>
      )}
      {mutacion.isError && <p className="gg-field-error">No pudimos validar el cupón.</p>}
    </div>
  )
}
