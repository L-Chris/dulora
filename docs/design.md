# Dulora — 现代日记软件设计方案

> 版本 v0.1 · 2026-10-24
> 技术栈对齐 [flashnext](https://github.com/L-Chris/flashnext)：Koa + React + Tailwind + Prisma(SQLite) + Docker

## 1. 目标与范围

一个**单用户、现代体验**的私人日记应用，后端 + Web 先行。

第一版（v1）范围：

| 能力 | 说明 |
| --- | --- |
| 密码登录 | 单用户，JWT（httpOnly Cookie），无注册体系 |
| 块编辑器 | Notion 风格 block 编辑体验（BlockNote），支持标题/列表/待办/引用/代码/高亮等 |
| 日记管理 | 按日期写日记（一天可多篇）、编辑、删除 |
| 标签 | 多标签，标签管理（重命名/删除/颜色） |
| 日历视图 | 月历上显示每天日记数与心情 |
| 全文搜索 | 中文友好的 SQLite FTS5（trigram）全文检索 |
| 心情 / 天气 | 每篇日记可选记录 mood（5 档）与 weather（枚举） |
| 设置 | 时区、修改密码 |

明确不做（v1）：多用户、图片附件、AI 摘要、移动端 App。数据模型为它们预留扩展位。

## 2. 技术栈

| 层 | 技术 | 备注 |
| --- | --- | --- |
| 后端 | Koa + routing-controllers + typedi + TypeScript | 与 flashnext 相同的装饰器路由 + DI 架构 |
| ORM / 存储 | Prisma + SQLite | 数据文件持久化在 `server/data/` |
| 全文搜索 | SQLite FTS5（trigram tokenizer） | CJK 子串匹配，无需分词服务 |
| 认证 | JWT（`jsonwebtoken`）+ argon2 密码哈希 | httpOnly Cookie 承载 |
| 打包 | esbuild | 同 flashnext `build.js` |
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 | |
| 编辑器 | BlockNote（`@blocknote/react`，基于 Tiptap/ProseMirror） | 输出结构化 block JSON |
| 路由 / 数据层 | React Router v7 + TanStack Query | 日历/列表/编辑器多视图共享缓存 |
| 容器 | node:25-alpine 多阶段构建（web → server → runtime） | 单容器同时提供 API 与前端静态产物 |

## 3. 目录结构

```
dulora/
├── Dockerfile                  # 多阶段构建
├── docker-compose.yml
├── .dockerignore / .gitignore
├── docs/
│   ├── README.md
│   └── design.md               # 本文档
├── server/
│   ├── package.json
│   ├── app.ts                  # 入口
│   ├── build.js                # esbuild 打包
│   ├── configs/
│   │   ├── application.ts      # Koa + routing-controllers 装配
│   │   ├── constants.ts        # 端口 / DATABASE_URL / JWT_SECRET / 静态目录
│   │   ├── koa.middlewares.ts  # trace-id、logger、bodyparser、cookie、静态文件
│   │   ├── routing.options.ts  # /api 前缀、validation
│   │   ├── routing.middlewares.ts  # CORS、错误中间件、auth 守卫
│   │   └── interceptors.ts     # 统一 { message, data } 响应
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   └── seed.js             # 可选：示例数据
│   └── app/
│       ├── controllers/        # auth / entry / tag / search / calendar / settings
│       ├── shared/
│       │   ├── prisma.ts
│       │   ├── day.ts          # 时区感知的「日记日」计算（参考 flashnext day-boundary.js）
│       │   ├── password.ts     # argon2 hash/verify
│       │   ├── jwt.ts          # 签发/校验
│       │   └── fts.ts          # FTS5 虚拟表 + 触发器的幂等初始化
│       └── modules/
│           ├── auth/           # application: auth.service
│           ├── entries/        # application: entry.service / block-text.ts(JSON→纯文本投影)
│           │                   # infrastructure: entry.repository
│           ├── tags/           # tag.service + tag.repository
│           ├── search/         # search.service（FTS5 原生 SQL）
│           └── settings/       # settings.service（时区/密码）
└── web/
    ├── vite.config.ts          # dev 时 /api 代理到 :3000
    └── src/
        ├── main.tsx
        ├── App.tsx             # Router 定义 + 登录态守卫
        ├── api/client.ts       # REST 客户端（统一解包 { message, data }，401 → 跳登录）
        ├── hooks/              # useAuth / useEntries / useCalendar / useSearch（TanStack Query）
        ├── components/
        │   ├── editor/         # BlockNote 封装（中文 UI 文案、暗色主题）
        │   ├── calendar/       # MonthCalendar（月历格子：数量徽标 + mood 色点）
        │   ├── entry/          # EntryCard（列表摘要）/ MoodPicker / WeatherPicker / TagInput
        │   └── layout/         # Sidebar / TopBar / ThemeToggle
        └── pages/
            ├── LoginPage.tsx
            ├── CalendarPage.tsx    # 日历视图（默认首页）
            ├── TimelinePage.tsx    # 时间线/列表 + 标签筛选
            ├── EntryEditPage.tsx   # 新建/编辑（块编辑器）
            ├── TagsPage.tsx        # 标签管理
            ├── SearchPage.tsx      # 全文搜索
            └── SettingsPage.tsx    # 时区 / 修改密码
```

分层约定与 flashnext 一致：**controllers（HTTP 边界）→ modules/application（业务）→ modules/infrastructure（数据访问）**，typedi 注入。

## 4. 数据模型

### 4.1 Prisma schema（核心）

```prisma
model User {                          // 单用户，固定 id = 1
  id           Int      @id @default(1)
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  settings     Settings?
}

model Settings {
  id       Int    @id @default(1)
  timezone String @default("Asia/Shanghai")
}

model Entry {
  id         String   @id @default(cuid())
  date       String                       // 日记归属日 yyyy-MM-dd（按 settings.timezone 计算，可手动改）
  title      String   @default("")
  content    String                       // BlockNote block JSON（序列化字符串）
  searchText String   @default("")        // 纯文本投影（title + 所有 text block），FTS 数据源
  mood       String?                      // great / good / ok / bad / terrible
  weather    String?                      // sunny / cloudy / rainy / snowy / windy / foggy
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  tags       EntryTag[]

  @@index([date])
  @@index([mood])
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?                      // 可选 hex
  createdAt DateTime @default(now())
  entries   EntryTag[]
}

model EntryTag {
  entryId String
  tagId   String
  entry   Entry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  tag     Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([entryId, tagId])
}
```

### 4.2 设计决策

- **块内容整体存 JSON（方案 A），而不是每 block 一行（方案 B）。**
  BlockNote 文档是一棵浅层 JSON 树；日记以「篇」为单位读写，没有跨篇 block 查询需求。
  整体存 `Entry.content` 最简单、事务天然原子、导出方便。
  需要被检索/统计的信息（纯文本、mood、tag）通过**投影列**（`searchText`）和关系表获得，
  这与 flashnext「FSRS 内部数据 vs 语义投影」的分层思路一致。
  未来若做「每日一句/回忆块」级别的引用，可再引入 Block 表渐进迁移。
- **一天多篇**：`date` 不做 unique，仅索引；日历视图聚合 count 与 mood 列表。
- **mood/weather 用字符串枚举**而非 Int，代码可读、API 自描述；新增枚举值无需迁移。
- **`onDelete: Cascade`**：删日记/标签自动清理关联，避免孤儿行。

### 4.3 FTS5 全文搜索

Prisma 不管理虚拟表，由 `shared/fts.ts` 在服务启动时幂等执行原生 SQL：

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts
  USING fts5(entry_id UNINDEXED, text, tokenize = 'trigram');

-- 与 entries 表保持同步的触发器（INSERT/UPDATE/DELETE 各一）
```

- `trigram` tokenizer 支持 CJK 子串匹配（要求 SQLite ≥ 3.34；node:25 内置版本满足）。
- 搜索走 `search.service` 的原生查询：
  `SELECT entry_id, snippet(entries_fts, 1, '<mark>', '</mark>', '…', 24) FROM entries_fts WHERE entries_fts MATCH ? ORDER BY rank LIMIT ?`
- 查询词做 trigram 安全化（去掉 <3 字符时退化为 `LIKE '%q%'`）。
- 同步策略用**触发器**而非服务层双写：脚本/未来导入工具直接写 entries 表也不会漏同步。

## 5. 认证与安全

单用户 + 密码登录：

1. **初始化**：首次启动时若 `User` 不存在，读取环境变量 `DULORA_INITIAL_PASSWORD` 创建（未设置则生成随机密码打印到日志一次）。之后可在设置页修改。
2. **登录**：`POST /api/auth/login { password }` → argon2 校验 → 签发 JWT（7 天有效）→ `Set-Cookie: dulora_token=...; HttpOnly; SameSite=Lax; Path=/`。
3. **守卫**：`routing.middlewares.ts` 中的 auth 中间件对 `/api/**` 统一校验，仅放行 `/api/auth/login` 与 `/api/health`。
4. **限流**：登录接口内存级简单限流（同 IP 5 次/分钟），防暴力尝试。

环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `DULORA_PORT` | 3000 | 宿主端口 |
| `DULORA_JWT_SECRET` | 启动时随机生成 | **生产必须显式设置**，否则重启后会话失效 |
| `DULORA_INITIAL_PASSWORD` | 随机生成 | 仅首次初始化用 |
| `DULORA_TZ` | Asia/Shanghai | 默认时区（可被 Settings 覆盖） |

## 6. API 设计

统一响应 `{ message: 'ok', data: ... }`（同 flashnext interceptors）；错误用 HTTP 状态码 + `{ message }`。

### 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ password }` → 设置 Cookie |
| POST | `/api/auth/logout` | 清除 Cookie |
| GET | `/api/auth/me` | 当前登录态（前端启动探测） |
| POST | `/api/auth/password` | `{ oldPassword, newPassword }` 修改密码 |

### 日记

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/entries` | 列表：`?from&to&tagId&mood&q&page&pageSize`，返回摘要（不含 content，含 title/date/mood/weather/tags/excerpt） |
| GET | `/api/entries/:id` | 详情（含完整 block JSON） |
| POST | `/api/entries` | 创建 `{ date?, title, content, mood?, weather?, tagIds? }`；date 缺省为「今天」（按 Settings 时区） |
| PUT | `/api/entries/:id` | 全量更新（服务端重算 searchText 投影） |
| DELETE | `/api/entries/:id` | 删除 |
| GET | `/api/calendar?year&month` | `[{ date, count, moods: [...], ids: [...] }]` 月历聚合 |

### 标签

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tags` | 列表（含 entryCount） |
| POST | `/api/tags` | `{ name, color? }` |
| PUT | `/api/tags/:id` | 重命名/改色 |
| DELETE | `/api/tags/:id` | 删除（级联解除关联） |

### 搜索 / 设置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/search?q=` | FTS5 全文搜索，返回 `{ items: [{ entry 摘要, snippet }] }` |
| GET | `/api/settings` | `{ timezone }` |
| POST | `/api/settings` | 更新时区 |
| GET | `/api/health` | 存活探针（免认证） |

### 时间语义

参考 flashnext `day-boundary.js` 的思路做简化版 `shared/day.ts`：

- 「今天」= `Settings.timezone` 下的自然日（日记无日切点需求，跨午夜写作归属实际日期即可）。
- `date` 始终存 `yyyy-MM-dd` 字符串，服务端用 `Intl.DateTimeFormat('en-CA', { timeZone })` 计算，杜绝容器 UTC 漂移。
- 日历/范围查询按 `date` 字符串比较（字典序 = 时间序），无时区二次换算。

## 7. 前端设计

### 7.1 路由与页面状态

```
/login                未登录唯一可达页
/                     日历视图（默认首页）
/timeline             时间线（无限滚动列表 + 标签/mood 筛选）
/entries/new?date=    新建（从日历某天点击「+」带入日期）
/entries/:id          编辑
/tags                 标签管理
/search?q=            搜索结果（snippet 高亮）
/settings             设置
```

- `App.tsx` 只做 Router + 登录守卫（启动时 `GET /api/auth/me`，401 → `/login`）。
- 数据层用 TanStack Query：`useEntries / useEntry / useCalendar / useTags / useSearch`，
  写操作后 `invalidateQueries(['calendar'], ['entries'])`，日历/列表/编辑器天然一致。
- 主题：Tailwind v4 `dark:` + `prefers-color-scheme`，手动切换存 localStorage。

### 7.2 块编辑器（BlockNote）

- 选型理由：React 生态最成熟的开箱即用 Notion 风格编辑器，
  自带 slash 菜单、拖拽块手柄、Markdown 快捷输入；文档即 JSON，与存储方案 A 直接对应。
- 封装 `components/editor/DiaryEditor.tsx`：
  - 中文 UI 文案（BlockNote 支持 locale dict）；
  - 暗色主题适配（`@blocknote/mantine` 样式 + Tailwind 变量）；
  - 受控 `initialContent` + `onChange` 防抖 800ms 自动保存（编辑页显示「已保存」状态）；
  - 工具函数 `blockToPlainText(blocks)`：服务端同款投影逻辑在前端用于生成列表 excerpt，
    保存时以**服务端重算的 searchText 为准**（前端投影仅展示用）。
- 键盘体验：`Cmd/Ctrl+S` 立即保存，`Cmd/Ctrl+Enter` 保存并返回。

### 7.3 关键交互

- **日历页**：月历格子显示篇数徽标 + mood 色点（多篇取最好/众数）；点格子 → 该日列表抽屉；双击/点「+」→ 带日期新建。
- **时间线**：按 date 倒序分组（今天/昨天/具体日期），EntryCard 显示 title、excerpt、mood/weather 图标、标签 chips。
- **标签输入**：编辑器内 TagInput 支持「选已有 / 输入即创建」（创建走 POST /api/tags，幂等按 name）。
- **搜索页**：300ms 防抖，snippet `<mark>` 高亮，点击直达编辑页。

## 8. 部署

与 flashnext 相同形态：

```dockerfile
# stage 1: web  → npm ci && vite build
# stage 2: server → npm ci && prisma generate && esbuild
# stage 3: runtime → node:25-alpine，拷贝 server dist + web dist + prisma
#   启动脚本：npx prisma db push --skip-generate && node dist/app.js
```

```yaml
# docker-compose.yml
services:
  dulora:
    build: .
    ports: ["${DULORA_PORT:-3000}:3000"]
    volumes: ["./server/data:/app/data"]
    environment: [DULORA_JWT_SECRET, DULORA_INITIAL_PASSWORD, DULORA_TZ]
    restart: unless-stopped
```

- 单容器同时提供 API（`/api`）与前端静态产物（SPA fallback 到 index.html）。
- SQLite 文件在宿主 `server/data/`，备份 = 拷目录。
- v1.x 可选：`POST /api/export` 打包导出（JSON + 每篇 Markdown，BlockNote 自带 blocks→markdown 转换），列入路线图而非首版。

## 9. 里程碑

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| M1 脚手架 | server/web/Docker 骨架、Koa 装配、Prisma schema、auth 全流程、健康检查 | 登录后 `GET /api/auth/me` 通；未登录 API 全部 401 |
| M2 日记闭环 | Entry CRUD、BlockNote 编辑器集成、mood/weather、自动保存、时间线页 | 能写、能改、能删、能按天浏览 |
| M3 组织能力 | 标签 CRUD + 筛选、日历视图、FTS5 搜索（含中文验证） | 月历聚合正确；「日记」能搜出含该词的篇目及高亮 snippet |
| M4 打磨部署 | 设置页（时区/改密码）、暗色主题、Dockerfile/compose、导出 | `docker compose up` 一键可用；数据落宿主卷 |

## 10. 未来扩展（预留，不在 v1）

- **图片附件**：新增 `Attachment` 表 + 本地磁盘/对象存储，BlockNote 原生支持 image block，接入成本低。
- **AI 功能**：`searchText` 投影即现成的 LLM 输入；可做自动摘要、情绪趋势、每周回顾。
- **统计与回顾**：连续打卡、mood 趋势图、「那年今日」；数据模型无需变更。
- **移动端**：API 已 RESTful + JWT，可直接接 Flutter/React Native 客户端（同 flashnext-app 模式）。
- **多用户**：Entry/Tag/User 加 `userId` 外键即可演进，单用户期所有查询隐含 `user id=1`。
