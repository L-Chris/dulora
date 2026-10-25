import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestError } from 'routing-controllers';

/**
 * 手动 DTO 校验：tsx(esbuild) 不支持 emitDecoratorMetadata，
 * routing-controllers 无法从反射拿到 @Body 的类型，因此统一走本 helper，
 * 保证 dev 与打包产物行为一致。
 */
export async function validateDto<T extends object>(cls: new () => T, raw: unknown): Promise<T> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestError('request body must be a JSON object');
  }
  const instance = plainToInstance(cls, raw) as T;
  const errors = await validate(instance as object, { whitelist: true });
  if (errors.length > 0) {
    const message = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new BadRequestError(message);
  }
  return instance;
}
