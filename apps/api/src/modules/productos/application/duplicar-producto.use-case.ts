import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';

@Injectable()
export class DuplicarProductoUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  async ejecutar(id: string) {
    const original = await this.productosRepository.obtenerPorId(id);
    const codigoInterno = `${original.codigoInterno}-COPIA-${Date.now().toString(36).toUpperCase()}`;
    return this.productosRepository.duplicar(id, codigoInterno);
  }
}
