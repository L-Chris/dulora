# Dulora — 现代日记软件

单用户、密码登录的私人日记应用：块编辑器（Notion 风格）、标签、日历视图、中文全文搜索、心情/天气记录。

技术栈对齐 [flashnext](https://github.com/L-Chris/flashnext)：

| 层 | 技术 |
| --- | --- |
| 后端 | Koa + routing-controllers + typedi + Prisma (SQLite) + TypeScript |
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 + BlockNote + TanStack Query |
| 搜索 | SQLite FTS5（trigram，CJK 友好）|
| 认证 | argon2 + JWT（httpOnly Cookie），单用户 |
| 容器 | node:24-alpine 多阶段构建，单容器提供 API + 前端产物 |

设计方案详见 [docs/design.md](docs/design.md)。

## 目录结构

```
dulora/
├── Dockerfile / docker-compose.yml
├── docs/            # 设计文档
├── server/          # Koa 后端（controllers → modules → prisma 分层）
└── web/             # React 前端（vite dev 代理 /api → :3000）
```

## 本地开发

```bash
# 后端
cd server
npm install
npx prisma db push        # 初始化 SQLite（server/data/dulora.db）
DULORA_INITIAL_PASSWORD=你的密码 npm run dev   # http://localhost:3000

# 前端（另开终端）
cd web
npm install
npm run dev               # http://localhost:5173
```

首次启动会用 `DULORA_INITIAL_PASSWORD` 创建单用户；未设置则生成随机密码打印到服务端日志一次。之后可在设置页修改密码。

> 注意：若 `prisma db push` 报 `Schema engine error`（SQLite 文件不存在时的偶发问题），先 `mkdir -p data && touch data/dulora.db` 再重试。

## 容器化部署

```bash
cp .env.example .env      # 按需填写 DULORA_JWT_SECRET（生产必填）
docker compose up --build --detach
# 访问 http://localhost:3000（宿主端口可用 .env 的 DULORA_PORT 覆盖）
```

环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `DULORA_PORT` | 3000 | 宿主端口（容器内固定 3000） |
| `DULORA_JWT_SECRET` | 随机生成 | **生产必须显式设置**，否则重启后会话失效 |
| `DULORA_INITIAL_PASSWORD` | 随机生成 | 仅首次初始化用户时生效 |
| `DULORA_TZ` | Asia/Shanghai | 默认时区（决定「今天」归属日，可在设置页改） |

SQLite 数据持久化在宿主 `server/data/`（挂载到容器 `/app/data`），备份即拷贝该目录。启动时自动执行 `prisma db push` 同步表结构。

## API 概览

统一响应 `{ message: 'ok', data: ... }`；除 `/api/health` 与 `/api/auth/login` 外均需登录 Cookie。

| 分组 | 端点 |
| --- | --- |
| 认证 | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/password` |
| 日记 | `GET/POST /api/entries` · `GET/PUT/DELETE /api/entries/:id`（列表支持 `from/to/tagId/mood/page/pageSize`） |
| 日历 | `GET /api/calendar?year&month` |
| 标签 | `GET/POST /api/tags` · `PUT/DELETE /api/tags/:id` |
| 搜索 | `GET /api/search?q=`（FTS5，返回 `<mark>` 高亮 snippet） |
| 设置 | `GET/POST /api/settings`（timezone） |
