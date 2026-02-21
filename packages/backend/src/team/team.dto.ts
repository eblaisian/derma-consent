import { IsEmail, IsEnum, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class InviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

export class ChangeRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
