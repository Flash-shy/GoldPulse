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

### 0. GHCR 镜像与 GitHub Pages 静态站

**容器镜像（GHCR）**

- 在仓库主页右侧 **Packages**，或打开 `https://github.com/<你的用户名>?tab=packages`，可看到 `goldpulse-api`、`goldpulse-web` 等包。  
- 拉取示例：`docker pull ghcr.io/<owner 小写>/goldpulse-web:latest`（私有包需先 `docker login ghcr.io`）。

**GitHub Pages（无 VPS 时托管前端）**

- Workflow： [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)，在 `push` 到 `main` 时构建 **Next 静态导出**（`output: "export"`）并部署。  
- **私有仓库（免费账号）**：GitHub Pages **不会**显示「Build and deployment」，只会提示升级或改为公开。免费个人账号需将仓库 **设为 Public**（**Settings → General → Danger zone → Change visibility**）后，再到 **Settings → Pages** 才会出现 **Source** 选项。若必须保持私有，需 **GitHub Enterprise** 等付费方案才能启用 Pages。  
- **首次启用**：仓库 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**（不要选 Deploy from a branch）。  
- 站点地址：`https://<owner>.github.io/<仓库名>/`（项目页路径含仓库名，与构建时的 `basePath` 一致）。  
- 在 **Actions → Variables** 中配置 **`NEXT_PUBLIC_API_BASE`** 为公网 API 根 URL；未配置时打包结果仍指向默认本机地址，页面上无法连到真实后端。  
- 自定义域名（如 `gold.sunhaoyang.net`）可在 **Settings → Pages → Custom domain** 里添加，再在 DNS 商处按 GitHub 提示配置 **CNAME**；可与腾讯云解析配合。  
  - **不要**把博客用的 `blog.sunhaoyang.net` 绑在 GoldPulse 上（会与博客/Vercel 冲突）；应新建子域（如 `gold` → `gold.sunhaoyang.net`），解析类型 **CNAME**、记录值 **`flash-shy.github.io`**（用户名小写）。  
  - 使用「仅子域、根路径」托管时：在仓库 **Actions → Variables** 增加 **`GITHUB_PAGES_BASE_PATH`**，值为 **`root`**，再重新跑一次 **Deploy to GitHub Pages**（否则仍会按 `/GoldPulse` 打资源路径，自定义域下会白屏或 404）。继续用默认 `https://<你的用户名>.github.io/GoldPulse/` 时不要设置该变量。

### 1. CI：构建与校验（推荐先做）

在仓库中配置 Workflow（示例见 `.github/workflows/ci.yml`）：

- `on: push` / `pull_request` 到 `main`
- 步骤：检出代码 → `docker compose build`（或分别 `docker build` API / Web）→ 可选运行 `./stats.sh` 做记录

这样每次 PR 都能验证 **Dockerfile 与 compose 可构建**。

### 2. CD：镜像发布（本仓库已配置 GHCR）

Workflow： [`.github/workflows/publish-docker.yml`](../.github/workflows/publish-docker.yml)

- **触发**：`push` 到 `main`、推送 `v*` 标签（如 `v1.0.0`）、或 **Actions** 里手动 **Run workflow**。  
- **镜像**（`owner` 为小写）：  
  - `ghcr.io/<owner>/goldpulse-api`（`latest`、`sha-<短 SHA>`；打 `v*` 标签时还有语义化版本标签）  
  - `ghcr.io/<owner>/goldpulse-web`（同上）  
- **认证**：使用仓库自带的 `GITHUB_TOKEN` 推送到 GHCR，**一般无需**再配 `GHCR_TOKEN` / Docker Hub 凭据（除非你要推到别的仓库）。  
- **仓库变量**（**Settings → Secrets and variables → Actions → Variables**）：  
  - **`NEXT_PUBLIC_API_BASE`**：浏览器访问的生产环境 API 根 URL（如 `https://api.example.com`）。未设置时 Workflow 里 Web 镜像仍用 `http://localhost:8000` 构建，并会在日志里提示；面向真实用户部署前请务必配置并重新跑一遍发布。  
- **可见性**：首次推送后，在 GitHub 仓库 **Packages** 里把镜像设为 **Public**（若希望服务器匿名 `docker pull`），或保持 Private 并在服务器上 `docker login ghcr.io`。

其他镜像仓库（Docker Hub 等）仍可自行增加 `docker login` / `docker push` 步骤，与上述并存。

### 2.1 与 Vercel、国内外 CDN 的配合（后续）

- **Vercel**：前端用 Vercel 托管时，在 Vercel 项目环境变量中设置 **`NEXT_PUBLIC_API_BASE`** 为公网 API 地址（与后端一致）；API / 数据库继续用 Docker 或云主机即可，不必强依赖本仓库的 Web 镜像。  
- **海外加速**：Vercel 自带全球边缘；自定义域名解析到 Vercel 即可。  
- **国内 CDN**：可在自有域名上接阿里云 / 腾讯云等 CDN，源站仍指向 Vercel 或国内静态托管；注意 **WebSocket**（如 `/ws/quotes`）需按 CDN 文档开启回源长连接或绕过 CDN 直连 API 域名。同一套 API 地址应保持 **`NEXT_PUBLIC_API_BASE` 与证书、CORS 配置一致**。

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
