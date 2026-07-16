import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class EliminarProductoUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(id: string, usuarioId: string) {
    const resultado = await this.productosRepository.eliminar(id);
    await this.registrarAuditoriaUseCase.ejecutar({
      usuarioId,
      accion: 'eliminar_producto',
      entidadTipo: 'producto',
      entidadId: id,
    });
    return resultado;
  }
}
