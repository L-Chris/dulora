import { useContainer, useKoaServer } from 'routing-controllers';
import { Container } from 'typedi';
import Koa from 'koa';
import { setupKoaMiddlewares } from './koa.middlewares';
import { ResponseInterceptor } from './interceptors';
import { controllers } from '../app/controllers';

export function createApp(): Koa {
  useContainer(Container);
  const app = new Koa();
  setupKoaMiddlewares(app);
  useKoaServer(app, {
    routePrefix: '/api',
    controllers,
    interceptors: [ResponseInterceptor],
    // 注意：validation 关闭反射校验（esbuild/tsx 无 emitDecoratorMetadata），
    // DTO 校验统一走 shared/validate.ts 的 validateDto()
    validation: false,
    // 关闭 rc 默认错误处理（会泄漏堆栈/格式不一致），统一走 koa.middlewares.ts 的错误中间件
    defaultErrorHandler: false,
    development: false,
    defaults: {
      nullResultCode: 404,
      undefinedResultCode: 204,
    },
  });
  return app;
}
