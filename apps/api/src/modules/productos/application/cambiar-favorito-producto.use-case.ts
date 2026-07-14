import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';

@Injectable()
export class CambiarFavoritoProductoUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  ejecutar(id: string, favoritoPos: boolean) {
    return this.productosRepository.cambiarFavorito(id, favoritoPos);
  }
}
