import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';

@Injectable()
export class BuscarProductosUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  ejecutar(termino: string) {
    const q = termino.trim();
    if (!q) return this.productosRepository.listar();
    return this.productosRepository.buscar(q);
  }
}
