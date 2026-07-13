import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';
import type { NuevoProducto } from '../domain/producto.entity';

@Injectable()
export class CrearProductoUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  ejecutar(nuevo: NuevoProducto) {
    return this.productosRepository.crear(nuevo);
  }
}
