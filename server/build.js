// esbuild 打包（对齐 flashnext server/build.js 思路）
// 注意：esbuild 不支持 emitDecoratorMetadata，因此项目统一使用
// 显式 @Inject(() => X) 属性注入 + shared/validate.ts 手动 DTO 校验，
// 保证 tsx dev 与 esbuild 产物行为一致。
const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['app.ts'],
    outfile: 'dist/app.js',
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    logLevel: 'info',
    // 原生模块与可选依赖不打进 bundle（cors 是 rc ExpressDriver 的懒加载依赖，Koa 驱动用不到）
    external: ['@prisma/client', '.prisma/client', 'argon2', 'cors', 'multer'],
  })
  .catch(() => process.exit(1));
