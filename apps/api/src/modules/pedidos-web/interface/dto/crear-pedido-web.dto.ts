import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PedidoWebItemDto {
  @IsUUID()
  productoId!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  cantidad!: number;
}

export class CrearPedidoWebDto {
  @IsString()
  @MinLength(2)
  clienteNombre!: string;

  @IsString()
  @MinLength(7)
  clienteTelefono!: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  cuponCodigo?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PedidoWebItemDto)
  items!: PedidoWebItemDto[];
}
