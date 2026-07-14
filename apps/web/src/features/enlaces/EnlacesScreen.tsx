import { Download, FileText, MapPin, Phone } from 'lucide-react'
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from '../../components/SocialIcons'
import { brand } from '../../theme/theme'
import { API_URL } from '../../lib/api'
import './enlaces.css'

const ENLACES = [
  {
    href: `${API_URL}/productos/catalogo-pdf`,
    icono: <FileText size={20} />,
    etiqueta: 'Ver catálogo de productos',
    clase: 'gg-enlaces-boton--catalogo',
  },
  {
    href: brand.contacto.whatsappHref,
    icono: <WhatsAppIcon size={20} />,
    etiqueta: 'Escríbenos por WhatsApp',
    clase: 'gg-enlaces-boton--whatsapp',
  },
  {
    href: brand.contacto.telefonoHref,
    icono: <Phone size={20} />,
    etiqueta: `Llamar · ${brand.contacto.telefono}`,
    clase: 'gg-enlaces-boton--tel',
  },
  {
    href: brand.contacto.instagramHref,
    icono: <InstagramIcon size={20} />,
    etiqueta: `Instagram · ${brand.contacto.instagram}`,
    clase: 'gg-enlaces-boton--ig',
  },
  {
    href: brand.contacto.tiktokHref,
    icono: <TikTokIcon size={20} />,
    etiqueta: `TikTok · ${brand.contacto.tiktok}`,
    clase: 'gg-enlaces-boton--tt',
  },
  {
    href: brand.contacto.mapsHref,
    icono: <MapPin size={20} />,
    etiqueta: 'Cómo llegar',
    clase: 'gg-enlaces-boton--mapa',
  },
]

export function EnlacesScreen() {
  return (
    <div className="gg-enlaces-page">
      <div className="gg-enlaces-tarjeta">
        <img src={brand.logo.hi} alt={brand.name} width={96} height={96} className="gg-enlaces-logo" />
        <h1 className="font-display gg-enlaces-nombre">{brand.name}</h1>
        <p className="gg-enlaces-autora">by {brand.creator}</p>
        <p className="gg-enlaces-direccion">{brand.contacto.direccion}</p>

        <nav className="gg-enlaces-lista">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.etiqueta}
              href={enlace.href}
              target={enlace.href.startsWith('http') ? '_blank' : undefined}
              rel={enlace.href.startsWith('http') ? 'noreferrer' : undefined}
              className={`gg-enlaces-boton ${enlace.clase}`}
            >
              {enlace.icono}
              {enlace.etiqueta}
              {enlace.clase === 'gg-enlaces-boton--catalogo' && <Download size={16} className="gg-enlaces-descarga" />}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
