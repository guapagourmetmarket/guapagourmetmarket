import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, type Rol } from './roles.decorator';

interface RequestConUsuario {
  user?: { id: string; email: string; rol: string };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const rol = request.user?.rol;
    if (!rol || !rolesPermitidos.includes(rol as Rol)) {
      throw new ForbiddenException('Tu rol no tiene permiso para realizar esta acción.');
    }
    return true;
  }
}
