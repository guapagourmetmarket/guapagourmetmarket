import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';
import type { CambiosUsuario } from '../domain/usuario.entity';

@Injectable()
export class ActualizarUsuarioUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
  ) {}

  async ejecutar(id: string, cambios: CambiosUsuario, usuarioActualId: string) {
    if (id === usuarioActualId && (cambios.activo === false || cambios.rol)) {
      throw new BadRequestException('No puedes cambiar tu propio rol ni desactivar tu propia cuenta.');
    }
    const usuario = await this.usuariosRepository.actualizar(id, cambios);
    return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, activo: usuario.activo };
  }
}
