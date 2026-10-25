import Koa from 'koa';
import { Body, Ctx, Get, JsonController, Post } from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { AuthService } from '../modules/auth/application/auth.service';
import { validateDto } from '../shared/validate';
import { ChangePasswordDto, LoginDto } from './dtos';
import { TOKEN_COOKIE } from '../../configs/constants';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 3600 * 1000,
  overwrite: true,
};

@Service()
@JsonController('/auth')
export class AuthController {
  @Inject(() => AuthService)
  private auth!: AuthService;

  @Post('/login')
  async login(@Body() body: unknown, @Ctx() ctx: Koa.Context) {
    const dto = await validateDto(LoginDto, body);
    const token = await this.auth.login(dto.password, ctx.ip);
    ctx.cookies.set(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    return { loggedIn: true };
  }

  @Post('/logout')
  async logout(@Ctx() ctx: Koa.Context) {
    ctx.cookies.set(TOKEN_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
    return { loggedOut: true };
  }

  @Get('/me')
  async me(@Ctx() ctx: Koa.Context) {
    return { id: ctx.state.userId ?? 1 };
  }

  @Post('/password')
  async changePassword(@Body() body: unknown, @Ctx() ctx: Koa.Context) {
    const dto = await validateDto(ChangePasswordDto, body);
    const token = await this.auth.changePassword(dto.oldPassword, dto.newPassword);
    ctx.cookies.set(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    return { changed: true };
  }
}
