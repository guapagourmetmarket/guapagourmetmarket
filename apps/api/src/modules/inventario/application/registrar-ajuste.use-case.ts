import { Inject, Injectable } from '@nestjs/common';
import { INVENTARIO_REPOSITORY } from '../domain/inventario.repository';
import type { InventarioRepository, NuevoAjuste } from '../domain/inventario.repository';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class RegistrarAjusteUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY) private readonly inventarioRepository: InventarioRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(ajuste: NuevoAjuste) {
    const resultado = await this.inventarioRepository.registrarAjuste(ajuste);
    await this.registrarAuditoriaUseCase.ejecutar({
      usuarioId: ajuste.registradoPor,
      accion: 'ajuste_inventario',
      entidadTipo: 'producto',
      entidadId: ajuste.productoId,
      detalle: `${ajuste.motivo} → cantidad nueva: ${ajuste.cantidadNueva}`,
    });
    return resultado;
  }
}
