import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastName' = 'createdAt';

  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}