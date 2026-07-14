import { Inject, Injectable } from '@nestjs/common';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';

@Injectable()
export class ListarUsuariosUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
  ) {}

  async ejecutar() {
    const usuarios = await this.usuariosRepository.listar();
    return usuarios.map((u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo }));
  }
}
