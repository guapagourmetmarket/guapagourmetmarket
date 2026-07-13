import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';
import type { CambiosProducto } from '../domain/producto.entity';

@Injectable()
export class ActualizarProductoUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  ejecutar(id: string, cambios: CambiosProducto) {
    return this.productosRepository.actualizar(id, cambios);
  }
}
