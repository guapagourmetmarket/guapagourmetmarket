import { useState } from 'react'
import {
  Heart,
  History,
  Home,
  Package,
  Pencil,
  ScanBarcode,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { SkeletonFila } from '../../components/Skeleton'
import { brand, darkColors } from '../../theme/theme'
import { useThemeMode } from '../../lib/themeMode'
import './design-system.css'

interface DesignSystemScreenProps {
  onCerrarSesion: () => void
}

const GRUPOS_COLOR: { titulo: string; claves: (keyof typeof brand.colors)[] }[] = [
  { titulo: 'Marca — salvia', claves: ['sage', 'sageDeep', 'sageDark', 'sageSoft'] },
  { titulo: 'Marca — rosa empolvado', claves: ['rose', 'roseSoft', 'roseDeep'] },
  { titulo: 'Superficies', claves: ['cream', 'beige', 'sand', 'surface', 'line'] },
  { titulo: 'Texto', claves: ['ink', 'muted', 'faint', 'onAccent'] },
  {
    titulo: 'Semánticos',
    claves: ['success', 'warning', 'warningText', 'danger', 'dangerHover'],
  },
]

const SECCIONES = [
  { id: 'colores', label: 'Colores' },
  { id: 'tipografia', label: 'Tipografía' },
  { id: 'botones', label: 'Botones' },
  { id: 'tarjetas', label: 'Tarjetas' },
  { id: 'formularios', label: 'Formularios' },
  { id: 'interruptor', label: 'Interruptor' },
  { id: 'iconos', label: 'Íconos' },
  { id: 'estados', label: 'Estados de carga' },
  { id: 'menu', label: 'Menú' },
  { id: 'tema', label: 'Modo oscuro' },
]

const ICONOS_EJEMPLO = [
  { Icono: Home, nombre: 'Home' },
  { Icono: Package, nombre: 'Package' },
  { Icono: ShoppingCart, nombre: 'ShoppingCart' },
  { Icono: ScanBarcode, nombre: 'ScanBarcode' },
  { Icono: Users, nombre: 'Users' },
  { Icono: TrendingUp, nombre: 'TrendingUp' },
  { Icono: Heart, nombre: 'Heart' },
  { Icono: History, nombre: 'History' },
  { Icono: Pencil, nombre: 'Pencil' },
  { Icono: Trash2, nombre: 'Trash2' },
]

export function DesignSystemScreen({ onCerrarSesion }: DesignSystemScreenProps) {
  const { modo } = useThemeMode()
  const [switchDemo, setSwitchDemo] = useState(false)

  return (
    <div className="gg-ds-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-ds-main">
        <h1 className="font-display gg-ds-title">Manual de Design System</h1>
        <p className="gg-ds-subtitulo">
          Referencia visual de la identidad de {brand.name} — colores, tipografía y componentes
          reutilizables. Todo sale de una única fuente de verdad (<code>theme.ts</code>): si algo
          cambia ahí, cambia en toda la app automáticamente.
        </p>

        <nav className="gg-ds-indice" aria-label="Secciones del manual">
          {SECCIONES.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>

        <section id="colores" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Colores oficiales</h2>
          <p className="gg-ds-seccion-nota">
            Cada franja muestra el tono de modo claro y, debajo, su equivalente en modo oscuro.
            Estás viendo la app en modo <strong>{modo}</strong> ahora mismo.
          </p>
          {GRUPOS_COLOR.map((grupo) => (
            <div key={grupo.titulo} className="gg-ds-color-grupo">
              <h3 className="gg-ds-color-grupo-titulo">{grupo.titulo}</h3>
              <div className="gg-ds-swatches">
                {grupo.claves.map((clave) => (
                  <div key={clave} className="gg-ds-swatch">
                    <span className="gg-ds-swatch-muestra" style={{ background: `var(--c-${clave})` }} />
                    <span className="gg-ds-swatch-nombre">{clave}</span>
                    <span className="gg-ds-swatch-hex">{brand.colors[clave]}</span>
                    <span className="gg-ds-swatch-hex gg-ds-swatch-hex--oscuro">{darkColors[clave]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="tipografia" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Tipografía</h2>
          <p className="gg-ds-seccion-nota">
            Display: <strong>Poppins</strong> (marca y titulares) · UI: <strong>Inter</strong>{' '}
            (texto, formularios, tablas). Precios y cantidades usan cifras tabulares.
          </p>
          <Card className="gg-ds-tipografia-card">
            <p className="font-display" style={{ fontSize: 32, fontWeight: 600, margin: 0 }}>
              Guapa Gourmet Market
            </p>
            <p className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 0' }}>
              Título de sección (Poppins 600)
            </p>
            <p style={{ fontSize: 16, margin: '12px 0 0' }}>
              Texto de cuerpo normal (Inter 400) — así se ve una descripción o un párrafo largo en
              la aplicación.
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-muted)', margin: '8px 0 0' }}>
              Texto secundario (Inter 600, color muted)
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--c-sageDeep)',
                margin: '8px 0 0',
              }}
            >
              $ 24.900 · 3 unidades
            </p>
          </Card>
        </section>

        <section id="botones" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Botones</h2>
          <p className="gg-ds-seccion-nota">
            Variantes: primario (acción principal), secundario, fantasma (ghost) y peligro
            (acciones destructivas). Etiquetas siempre en forma de acción: "Cobrar", "Guardar
            producto".
          </p>
          <Card>
            <div className="gg-ds-fila-demo">
              <Button variant="primary">Cobrar</Button>
              <Button variant="secondary">Guardar producto</Button>
              <Button variant="ghost">Cancelar</Button>
              <Button variant="danger">Eliminar</Button>
            </div>
            <div className="gg-ds-fila-demo" style={{ marginTop: 12 }}>
              <Button variant="primary" size="lg">
                Botón grande
              </Button>
              <Button variant="primary" disabled>
                Deshabilitado
              </Button>
            </div>
          </Card>
        </section>

        <section id="tarjetas" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Tarjetas</h2>
          <p className="gg-ds-seccion-nota">
            Contenedor base para agrupar contenido: esquinas redondeadas suaves y sombra tenue.
          </p>
          <Card>
            <p style={{ margin: 0, fontWeight: 600 }}>Ejemplo de tarjeta</p>
            <p style={{ margin: '6px 0 0', color: 'var(--c-muted)', fontSize: 14 }}>
              Así se ve el componente <code>Card</code> con contenido adentro.
            </p>
          </Card>
        </section>

        <section id="formularios" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Formularios</h2>
          <p className="gg-ds-seccion-nota">
            Cada campo lleva su etiqueta visible arriba, y el foco de teclado siempre queda
            marcado (accesibilidad).
          </p>
          <Card>
            <div className="gg-ds-form-demo">
              <Input label="Nombre del producto" placeholder="Ej. Granola artesanal" />
              <Input label="Correo electrónico" type="email" placeholder="tu@correo.com" />
              <Input label="Con error" defaultValue="algo mal" error="Este campo es obligatorio." />
            </div>
          </Card>
        </section>

        <section id="interruptor" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Interruptor (switch)</h2>
          <p className="gg-ds-seccion-nota">Usado, por ejemplo, para activar el modo oscuro.</p>
          <Card>
            <div className="gg-switch-fila" style={{ maxWidth: 260 }}>
              <span className="gg-switch-etiqueta">Ejemplo de interruptor</span>
              <button
                type="button"
                role="switch"
                aria-checked={switchDemo}
                aria-label="Ejemplo de interruptor"
                className={`gg-switch ${switchDemo ? 'gg-switch--activo' : ''}`}
                onClick={() => setSwitchDemo((v) => !v)}
              >
                <span className="gg-switch-bola" />
              </button>
            </div>
          </Card>
        </section>

        <section id="iconos" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Íconos</h2>
          <p className="gg-ds-seccion-nota">
            Librería <strong>lucide-react</strong>, trazo fino y moderno, coherente con la marca.
          </p>
          <Card>
            <div className="gg-ds-iconos-grid">
              {ICONOS_EJEMPLO.map(({ Icono, nombre }) => (
                <div key={nombre} className="gg-ds-icono-item">
                  <Icono size={22} />
                  <span>{nombre}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section id="estados" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Estados de carga</h2>
          <p className="gg-ds-seccion-nota">
            Mientras se espera información del servidor, se muestran placeholders animados en vez
            de dejar la pantalla en blanco.
          </p>
          <Card>
            <SkeletonFila cantidad={3} />
          </Card>
        </section>

        <section id="menu" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Menú de navegación</h2>
          <p className="gg-ds-seccion-nota">
            Botones en relieve ("3D") sobre una franja rosada, con acento salvia para el enlace
            activo. Los enlaces que no aplican al rol de la persona conectada simplemente no se
            muestran.
          </p>
          <Card>
            <div className="gg-ds-fila-demo">
              <span className="gg-header-link gg-header-link--active">Productos</span>
              <span className="gg-header-link">Caja</span>
              <span className="gg-header-link">Reportes</span>
            </div>
          </Card>
        </section>

        <section id="tema" className="gg-ds-seccion">
          <h2 className="gg-ds-seccion-titulo">Modo oscuro</h2>
          <p className="gg-ds-seccion-nota">
            Toda la paleta tiene una variante oscura con los mismos matices de marca. Se activa
            desde <strong>Mi cuenta</strong> (menú superior) y queda guardado en el dispositivo.
          </p>
        </section>
      </main>
    </div>
  )
}
