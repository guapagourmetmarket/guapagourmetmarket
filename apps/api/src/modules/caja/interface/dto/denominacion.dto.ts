import { IsInt, Min } from 'class-validator';

export class DenominacionDto {
  @IsInt()
  @Min(1)
  denominacion!: number;

  @IsInt()
  @Min(0)
  cantidad!: number;
}
