import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CUENTAS_REPOSITORY } from '../domain/cuentas.repository';
import type { CuentasRepository } from '../domain/cuentas.repository';
import { RegistrarVentaUseCase } from '../../ventas/application/registrar-venta.use-case';
import { MetodoPago } from '../../ventas/domain/venta.entity';

export interface DatosCierreCuenta {
  metodoPago: MetodoPago;
  descuento?: number;
  clienteId?: string;
}

@Injectable()
export class CerrarCuentaUseCase {
  constructor(
    @Inject(CUENTAS_REPOSITORY) private readonly cuentasRepository: CuentasRepository,
    private readonly registrarVentaUseCase: RegistrarVentaUseCase,
  ) {}

  async ejecutar(cuentaId: string, datos: DatosCierreCuenta, registradoPor: string) {
    const cuenta = await this.cuentasRepository.obtener(cuentaId);
    if (cuenta.estado !== 'abierta') {
      throw new BadRequestException('Esa cuenta ya está cerrada.');
    }
    if (cuenta.items.length === 0) {
      throw new BadRequestException('La cuenta no tiene nada para cobrar todavía.');
    }

    const itemsProducto = cuenta.items.filter((i) => i.productoId);
    const itemsLibres = cuenta.items.filter((i) => !i.productoId);

    // El precio de los items de producto se vuelve a resolver dentro de
    // registrarVentaUseCase (siempre con el precio/oferta más reciente);
    // los items libres no tienen catálogo de dónde tomar precio, así que
    // se cobran con el precio que quedó guardado al agregarlos.
    const descripcionLibre =
      itemsLibres.length > 0 ? itemsLibres.map((i) => `${i.nombre} x${i.cantidad}`).join(', ') : undefined;
    const valorLibre =
      itemsLibres.length > 0 ? itemsLibres.reduce((acc, i) => acc + i.subtotal, 0) : undefined;

    const venta = await this.registrarVentaUseCase.ejecutar({
      clienteId: datos.clienteId,
      clienteNombre: cuenta.nombre,
      descripcion: descripcionLibre,
      valorLibre,
      descuento: datos.descuento,
      metodoPago: datos.metodoPago,
      registradoPor,
      items: itemsProducto.map((i) => ({ productoId: i.productoId as string, cantidad: i.cantidad })),
    });

    await this.cuentasRepository.marcarCerrada(cuentaId, venta.id);

    return venta;
  }
}
