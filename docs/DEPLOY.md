# GoldPulse 部署与 GitHub Actions

## 本地一键启动（Docker Compose）

在项目根目录：

```bash
docker compose up --build
```

- **PostgreSQL**：`localhost:5432`（用户/库：`postgres` / `goldpulse`）
- **Redis**：`localhost:6379`
- **FastAPI**：`http://localhost:8000`（Swagger：`/docs`）
- **Next.js**：`http://localhost:3000`

### 推荐：数据库 + API 用 Docker，前端用本地开发（热更新）

若 Web 镜像构建较慢或需 Turbopack 热更新，可只起后端依赖与 API，Next 在本机跑：

```bash
docker compose up -d postgres redis api
npm run dev -w web
```

浏览器打开 **http://localhost:3000** ，API 仍为 **http://localhost:8000**（与 `NEXT_PUBLIC_API_BASE` 默认一致）。

前端在构建阶段会把 `NEXT_PUBLIC_API_BASE` 打进静态资源（浏览器里请求 API 与 WebSocket）。默认 Compose 里为 `http://localhost:8000`，若你把站点挂在域名或 HTTPS 后，请在 `docker-compose.yml` 的 `web.build.args` 中改成公网可访问的 API 地址并重新构建 Web 镜像。

## 统计脚本

```bash
./stats.sh
```

按 **后端 / Web / 移动端 / 共享包** 输出行数；若本机安装了 [cloc](https://github.com/AlDanial/cloc)，可再按语言细分（见脚本末尾提示）。

## GitHub Actions 自动化部署思路

### 1. CI：构建与校验（推荐先做）

在仓库中配置 Workflow（示例见 `.github/workflows/ci.yml`）：

- `on: push` / `pull_request` 到 `main`
- 步骤：检出代码 → `docker compose build`（或分别 `docker build` API / Web）→ 可选运行 `./stats.sh` 做记录

这样每次 PR 都能验证 **Dockerfile 与 compose 可构建**。

### 2. CD：镜像发布

常见做法：

1. **登录镜像仓库**（二选一或同时）  
   - [GitHub Container Registry (ghcr.io)](https://docs.github.com/packages/container-registry)  
   - Docker Hub  

2. **在 Workflow 中**（`on: push` 到 `main` 或打 `tag`）：  
   - `docker build` API、Web  
   - `docker tag` / `docker push` 到 `ghcr.io/<org>/goldpulse-api:latest` 等  

3. **Secrets**（在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置）：  
   - `GHCR_TOKEN` 或 `DOCKER_USERNAME` / `DOCKER_PASSWORD`（推送镜像用）

### 3. CD：服务器拉取并运行

在 **VPS / 云主机** 上：

- 安装 Docker 与 Docker Compose  
- 放置生产用 `docker-compose.prod.yml`（内容可与根目录 `docker-compose.yml` 类似，但把 `build` 改为 `image: ghcr.io/your-org/goldpulse-api:tag`）  
- 配置环境变量：`DATABASE_URL`、生产用 `NEXT_PUBLIC_API_BASE`（需与浏览器访问的 API 域名一致）  
- 使用 **Caddy / Nginx** 做 HTTPS 反向代理，并放行 WebSocket（`/ws/quotes`）

或使用 **GitHub Actions SSH 部署**：在 Workflow 中 `ssh` 到服务器执行 `docker compose pull && docker compose up -d`（需配置 `SSH_PRIVATE_KEY`、`HOST` 等 Secrets）。

### 4. 前端托管替代方案

若不想自托管 Next.js：

- 将 **Next.js** 部署到 [Vercel](https://vercel.com/)，在 Vercel 环境变量中设置 `NEXT_PUBLIC_API_BASE` 为公网 API 地址。  
- **FastAPI + Postgres + Redis** 仍可用 Docker 跑在另一台机器或托管平台（如 AWS ECS、Fly.io、Railway 等）。

### 5. 移动端（Expo）

- **Expo EAS Build** 打 iOS/Android 包；在 `app.json` / EAS 环境变量中配置 `EXPO_PUBLIC_API_BASE` 指向生产 API。  
- 真机需能访问该 API 地址（公网或内网穿透）。

### 6. 安全提示

- 生产环境务必修改默认数据库密码；**不要将** `.env`、私钥提交到仓库。  
- 在 GitHub 使用 **Environment** 保护分支与审批（生产部署 Job）。
