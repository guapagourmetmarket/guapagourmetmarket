import { useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, Loader2, TriangleAlert } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { ApiError, descargarPlantillaProductos, importarProductos, type ResultadoImportacion } from '../../lib/api'
import './importar.css'

interface ImportarModalProps {
  onClose: () => void
}

export function ImportarModal({ onClose }: ImportarModalProps) {
  const queryClient = useQueryClient()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)

  const mutacion = useMutation({
    mutationFn: importarProductos,
    onSuccess: (r) => {
      setResultado(r)
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
    },
  })

  function handleArchivo(e: ChangeEvent<HTMLInputElement>) {
    setArchivo(e.target.files?.[0] ?? null)
    setResultado(null)
  }

  function handleImportar() {
    if (archivo) mutacion.mutate(archivo)
  }

  return (
    <Modal title="Importar productos" onClose={onClose}>
      <div className="gg-importar">
        <p className="gg-importar-texto">
          Sube un archivo Excel (.xlsx) o CSV con tus productos. Si el código interno ya existe, ese
          producto se actualiza; si no, se crea uno nuevo.
        </p>

        <button type="button" className="gg-importar-plantilla" onClick={() => descargarPlantillaProductos()}>
          <Download size={16} />
          Descargar plantilla de ejemplo
        </button>

        <label className="gg-importar-archivo">
          {archivo ? archivo.name : 'Elegir archivo .xlsx o .csv'}
          <input type="file" accept=".xlsx,.csv" onChange={handleArchivo} hidden />
        </label>

        <Button type="button" onClick={handleImportar} disabled={!archivo || mutacion.isPending}>
          {mutacion.isPending ? (
            <>
              <Loader2 size={18} className="gg-spin" />
              Importando…
            </>
          ) : (
            'Importar'
          )}
        </Button>

        {mutacion.isError && (
          <p className="gg-field-error">
            {mutacion.error instanceof ApiError
              ? mutacion.error.message
              : 'No pudimos importar el archivo. Verifica el formato e intenta de nuevo.'}
          </p>
        )}

        {resultado && (
          <div className="gg-importar-resumen">
            <p className="gg-importar-resumen-ok">
              <CheckCircle2 size={16} />
              {resultado.creados} producto{resultado.creados === 1 ? '' : 's'} creado
              {resultado.creados === 1 ? '' : 's'}, {resultado.actualizados} actualizado
              {resultado.actualizados === 1 ? '' : 's'}.
            </p>
            {resultado.errores.length > 0 && (
              <div className="gg-importar-errores">
                <p className="gg-importar-resumen-error">
                  <TriangleAlert size={16} />
                  {resultado.errores.length} fila{resultado.errores.length === 1 ? '' : 's'} con problemas:
                </p>
                <ul>
                  {resultado.errores.map((e, i) => (
                    <li key={i}>
                      Fila {e.fila}: {e.mensaje}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
