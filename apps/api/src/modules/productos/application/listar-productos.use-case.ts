import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';

@Injectable()
export class ListarProductosUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  ejecutar(incluirInactivos = false) {
    return this.productosRepository.listar(incluirInactivos);
  }
}
