import { Action, Interceptor, InterceptorInterface } from 'routing-controllers';
import { Service } from 'typedi';

/** 统一响应格式 { message: 'ok', data: ... }（对齐 flashnext） */
@Service()
@Interceptor()
export class ResponseInterceptor implements InterceptorInterface {
  intercept(_action: Action, content: unknown): unknown {
    return { message: 'ok', data: content ?? null };
  }
}
