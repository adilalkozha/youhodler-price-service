import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AppError } from './errorHandler';

interface ValidationOptions {
  skipMissingProperties?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
}

export function validationMiddleware<T extends object>(
  type: new () => T,
  source: 'body' | 'query' | 'params' = 'body',
  options: ValidationOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const defaultOptions = {
        skipMissingProperties: false,
        whitelist: true,
        forbidNonWhitelisted: true,
        ...options
      };

      const dto = plainToClass(type, req[source]);
      const errors = await validate(dto, defaultOptions);

      if (errors.length > 0) {
        const errorMessages = formatValidationErrors(errors);
        throw new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400);
      }

      req[source] = dto;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function formatValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }

    if (error.children && error.children.length > 0) {
      messages.push(...formatValidationErrors(error.children));
    }
  }

  return messages;
}

export function validateBody<T extends object>(type: new () => T, options?: ValidationOptions) {
  return validationMiddleware(type, 'body', options);
}

export function validateQuery<T extends object>(type: new () => T, options?: ValidationOptions) {
  return validationMiddleware(type, 'query', options);
}

export function validateParams<T extends object>(type: new () => T, options?: ValidationOptions) {
  return validationMiddleware(type, 'params', options);
}