import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';
import type { CambiosUsuario } from '../domain/usuario.entity';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class ActualizarUsuarioUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(id: string, cambios: CambiosUsuario, usuarioActualId: string) {
    if (id === usuarioActualId && (cambios.activo === false || cambios.rol)) {
      throw new BadRequestException('No puedes cambiar tu propio rol ni desactivar tu propia cuenta.');
    }
    const usuario = await this.usuariosRepository.actualizar(id, cambios);
    if (cambios.rol || cambios.activo !== undefined) {
      await this.registrarAuditoriaUseCase.ejecutar({
        usuarioId: usuarioActualId,
        accion: cambios.rol ? 'cambiar_rol_usuario' : 'cambiar_estado_usuario',
        entidadTipo: 'usuario',
        entidadId: id,
        detalle: JSON.stringify(cambios),
      });
    }
    return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, activo: usuario.activo };
  }
}
