import { Inject, Injectable } from '@nestjs/common';
import { VENTAS_REPOSITORY } from '../domain/ventas.repository';
import type { VentasRepository } from '../domain/ventas.repository';
import type { NuevaVenta } from '../domain/venta.entity';

@Injectable()
export class RegistrarVentaUseCase {
  constructor(@Inject(VENTAS_REPOSITORY) private readonly ventasRepository: VentasRepository) {}

  ejecutar(venta: NuevaVenta) {
    return this.ventasRepository.registrar(venta);
  }
}
