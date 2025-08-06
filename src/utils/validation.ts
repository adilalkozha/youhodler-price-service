import { plainToClass, ClassConstructor } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

export async function validateAndTransform<T extends object>(
  cls: ClassConstructor<T>,
  input: any
): Promise<ValidationResult<T>> {
  try {
    const instance = plainToClass(cls, input);
    const errors = await validate(instance);

    if (errors.length === 0) {
      return {
        isValid: true,
        data: instance,
      };
    }

    return {
      isValid: false,
      errors: formatValidationErrors(errors),
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid input data'],
    };
  }
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

export function transformToResponse<T extends object>(
  cls: ClassConstructor<T>,
  input: any
): T {
  return plainToClass(cls, input, {
    excludeExtraneousValues: true,
  });
}