import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';

@Injectable()
export class ObtenerPerfilUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
  ) {}

  async ejecutar(usuarioId: string) {
    const usuario = await this.usuariosRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
  }
}
