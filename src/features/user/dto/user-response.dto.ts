import { Expose, Type } from 'class-transformer';

export class UserDataDto {
  @Expose()
  id!: number;

  @Expose()
  email!: string;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @Expose()
  @Type(() => Date)
  updatedAt!: Date;
}

export class UserMetaDto {
  @Expose()
  count?: number;

  @Expose()
  total?: number;

  @Expose()
  page?: number;

  @Expose()
  limit?: number;

  @Expose()
  totalPages?: number;
}

export class UserResponseDto {
  @Expose()
  success!: boolean;

  @Expose()
  @Type(() => UserDataDto)
  data!: UserDataDto | UserDataDto[];

  @Expose()
  @Type(() => UserMetaDto)
  meta?: UserMetaDto;

  @Expose()
  message?: string;
}

export class DeleteUserResponseDto {
  @Expose()
  success!: boolean;

  @Expose()
  message!: string;
}