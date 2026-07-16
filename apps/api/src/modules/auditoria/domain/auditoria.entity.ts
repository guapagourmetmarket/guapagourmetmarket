export interface EntradaAuditoria {
  usuarioId: string | null;
  accion: string;
  entidadTipo: string;
  entidadId?: string;
  detalle?: string;
}

export interface RegistroAuditoria {
  id: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  accion: string;
  entidadTipo: string;
  entidadId: string | null;
  detalle: string | null;
  createdAt: string;
}
