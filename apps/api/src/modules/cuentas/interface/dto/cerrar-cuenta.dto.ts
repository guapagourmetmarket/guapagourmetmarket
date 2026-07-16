import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'nequi', 'daviplata', 'mixto'] as const;

export class CerrarCuentaDto {
  @IsIn(METODOS_PAGO)
  metodoPago!: (typeof METODOS_PAGO)[number];

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @IsOptional()
  @IsUUID()
  clienteId?: string;
}
