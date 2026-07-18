import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NuevoPedidoWeb, PedidoWeb } from '../domain/pedido-web.entity';
import { PEDIDOS_WEB_REPOSITORY } from '../domain/pedidos-web.repository';
import type { PedidosWebRepository } from '../domain/pedidos-web.repository';
import { CUPONES_REPOSITORY } from '../../cupones/domain/cupones.repository';
import type { CuponesRepository } from '../../cupones/domain/cupones.repository';

@Injectable()
export class CrearPedidoWebUseCase {
  constructor(
    @Inject(PEDIDOS_WEB_REPOSITORY) private readonly repo: PedidosWebRepository,
    @Inject(CUPONES_REPOSITORY) private readonly cuponesRepo: CuponesRepository,
  ) {}

  async ejecutar(nuevo: NuevoPedidoWeb): Promise<PedidoWeb> {
    // El cliente en la tienda pública no está autenticado: a diferencia del
    // POS interno (donde se confía en el % que ya escribió el cajero), aquí
    // se vuelve a validar el código contra la tabla de cupones y se resuelve
    // el porcentaje real en el servidor — nunca se acepta uno enviado desde
    // el navegador.
    let descuentoPorcentaje = 0;
    let cuponCodigo: string | undefined;
    if (nuevo.cuponCodigo?.trim()) {
      const resultado = await this.cuponesRepo.validar(nuevo.cuponCodigo.trim());
      if (!resultado.valido || !resultado.porcentaje) {
        throw new BadRequestException(resultado.mensaje ?? 'Ese cupón no es válido.');
      }
      descuentoPorcentaje = resultado.porcentaje;
      cuponCodigo = nuevo.cuponCodigo.trim().toUpperCase();
    }

    return this.repo.crear({ ...nuevo, descuentoPorcentaje, cuponCodigo });
  }
}
