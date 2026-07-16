import { IsBoolean } from 'class-validator';

export class CambiarEstadoCuponDto {
  @IsBoolean()
  activo!: boolean;
}
