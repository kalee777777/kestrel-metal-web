# Kestrel Metal 官网项目文档

> **项目**: Kestrel Metal 金属丝网制品企业官网（纯静态多页站点）
> **技术**: 原生 HTML / CSS / JavaScript + three.js 3D 展示
> **最后更新**: 2026-08-19

---

## 一、远程仓库配置与推送部署 ⭐

### 1.1 仓库概览（双远程仓库）

| 远程名 | 平台 | 地址 | 用途 |
|--------|------|------|------|
| `origin` | Gitee 码云 | `https://gitee.com/kestrelmetal_0/kestrel-static-site.git` | 国内备份仓库 |
| `github` | GitHub | `git@github.com:kalee777777/kestrel-metal-web.git` | **主部署仓库（SSH）**，Cloudflare 从此自动拉取部署 |

**认证方式说明**：
- GitHub 使用 **SSH 密钥认证**（本机 `~/.ssh/id_ed25519`，GitHub 上标题为 "kalee macbook"，Read/write 权限）
- Gitee 使用 **HTTPS** 认证

### 1.2 如何推送修改（日常工作流）

```bash
# 1. 修改文件后，暂存并提交
git add .
git commit -m "描述这次修改了什么"

# 2. 推送到 GitHub → 自动触发 Cloudflare 部署（约 1 分钟上线）
git push github main

# 3. （可选）同步推送到 Gitee 备份
git push origin main
```

**推送后**：Cloudflare 检测到 GitHub `main` 分支新提交 → 自动构建部署 → 线上更新。

**其他常用命令**：

```bash
git remote -v                  # 查看远程仓库配置
git status                     # 查看工作区状态
git log --oneline -5           # 查看最近提交
git push github main origin main  # 同时推送双仓库（简写）
```

### 1.3 Cloudflare 自动部署配置

在 Cloudflare Dashboard → Workers & Pages → 项目 → Settings → Build 中配置为：

| 配置项 | 值 |
|--------|-----|
| 仓库 | `kalee777777/kestrel-metal-web`（GitHub） |
| 分支 | `main` |
| Build command | 无（None） |
| **Deploy command** | `npx wrangler deploy` |
| Root directory | `/`（仓库根目录） |

### 1.4 域名与 DNS 配置

**访问地址**：
- `https://www.kestrelmetal.com`（主域名）
- `https://kestrelmetal.com`（apex 域名）
- `https://kestrel-metal-web.1411044767.workers.dev`（Workers 默认地址）

**Cloudflare DNS 记录**：

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|----------|
| A | @ | `192.0.2.1` | DNS only |
| CNAME | www | `kestrelmetal.com` | Proxied |

**Workers 域名路由配置**（Workers & Pages → kestrel-metal-web → Domains & Routes）：

| 名称 | 类型 | 环境 |
|------|------|------|
| `kestrelmetal.com` | Custom Domain | Production |
| `www.kestrelmetal.com/*` | Route | Production |

> ⚠️ www 域名需要**同时配置 DNS CNAME 记录和 Worker Route**，仅配置 DNS 会导致 522 错误。详见 [PROJECT_DOCUMENT.md](../PROJECT_DOCUMENT.md) 第六节。

### 1.5 SEO 与 GSC 配置

- **sitemap.xml**：包含 190 个 URL，已提交至 Google Search Console
- **robots.txt**：已配置 `Sitemap: https://www.kestrelmetal.com/sitemap.xml`
- **GSC 验证状态**：sitemap 提交成功，Google 已开始抓取

### 1.6 部署相关配置文件（仓库根目录）

| 文件 | 作用 |
|------|------|
| `wrangler.jsonc` | Cloudflare Workers 静态资源配置：声明 `assets.directory: "./"`，即整个根目录作为网站资源部署 |
| `.assetsignore` | wrangler 上传静态资源时的排除清单（node_modules、.git、配置文件等不部署） |
| `.gitignore` | git 忽略清单（node_modules、.DS_Store、.wrangler 等不入库） |

### 1.7 ⚠️ 重要限制与注意事项

1. **单文件 25 MiB 上限**（Workers 静态资源限制）
   - 添加任何大文件前先检查体积：`ls -lh 文件名`
   - **3D 模型（.glb）超限时用顶点量化压缩**（兼容网页现有原生 GLTFLoader，无需改代码）：
     ```bash
     # 先 optimize 再 quantize，取 quantize 产物（约减半，视觉无损）
     npx @gltf-transform/cli optimize models/模型.glb /tmp/opt.glb
     npx @gltf-transform/cli quantize /tmp/opt.glb models/模型.glb
     ```
   - 历史案例：`models/welded-gabion-box.glb` 曾因 32.6 MiB 导致部署失败，量化压缩至 16 MB 后解决
2. **不要把 node_modules 提交进仓库**（已清理过一次，`.gitignore` 已配置防护）
3. **产品/博客/案例页内的产品链接应指向具体产品子页**（如 `chain-link.html`），不要指向 `products.html` 汇总页——全站已统一修正过（2026-08），新增页面时注意遵循
4. **不要创建 `_redirects` 文件**：Cloudflare Workers 静态资源不支持此文件格式，`/*` 通配符重定向会导致无限重定向循环，使整个网站无法访问
5. **不要创建 `_headers` 文件**：Cloudflare Workers 会自动处理 MIME 类型，无需手动设置。如需自定义响应头，请使用 Cloudflare Dashboard 中的 Redirect Rules 或 Transform Rules

---

## 二、项目内容

### 2.1 项目概述

Kestrel Metal（kestrelmetal.com）是一家金属丝网制品制造企业的英文外贸官网，共 **187 个 HTML 页面**、426 张图片、5 个 3D 交互模型。产品线覆盖围栏（Fence）、石笼网（Gabion）、焊接网（Welded Mesh）、编织网（Woven Mesh）、刺丝（Barbed Wire）、刀片刺网（Razor Wire）、立柱（Posts）与配件（Accessories）。

### 2.2 技术栈

- **前端**：原生 HTML5 / CSS3 / JavaScript（ES5+），无框架、无构建步骤
- **3D 展示**：three.js + GLTFLoader（原生加载，未使用 Draco/Meshopt 压缩格式）
- **公共组件**：导航栏 `components/navbar.html`、页脚 `components/footer.html`，通过 **fetch 注入**到各页面（修改导航/页脚只需改这两个文件）
- **样式与脚本**：按页面模块化组织在 `css/`（26 个）与 `js/`（36 个）目录

### 2.3 目录结构

```
kestrel-site/                       # 仓库根 = 网站根 = Cloudflare 部署目录
├── index.html                      # 首页
├── products.html                   # 产品总览页
├── *.html                          # 各产品详情页 / 博客 / 案例 / 行业等页面
├── components/                     # 公共组件（navbar / footer，fetch 注入）
├── css/                            # 按页面模块化的样式（26 个）
├── js/                             # 按页面模块化的脚本（36 个）
├── images/                         # 图片资源（426 张，webp 为主）
├── products/                       # 产品分类图片（149 张，fence/ 等子目录）
├── models/                         # 3D 模型（5 个 .glb，6~17 MB）
├── docs/                           # 项目问题记录（issue-log.md）
├── wrangler.jsonc                  # Cloudflare 部署配置
├── .assetsignore                   # wrangler 资源排除清单
└── .gitignore                      # git 忽略清单
```

### 2.4 页面清单（按类型）

| 页面类型 | 数量 | 代表文件 |
|----------|------|----------|
| 核心总览页 | 6 | `index` `products` `resources` `services` `industries` `insight` |
| **产品详情页** | ~110 | `chain-link` `welded-wire-mesh-panel` `woven-gabion-box` `razor-wire-btc` `358-security-fence` `fence-farm` `hexagonal-wire` `barbed-wire-galvanized` `round-post` `acc-c-rings` … |
| 产品系列编号页 | 12 | `welded-mesh-711` ~ `welded-mesh-722` |
| 博客文章页 | 41 | `blog.html`（列表）+ `blog-*.html`（40 篇技术/资讯文章） |
| 案例研究页 | 9 | `case-studies.html` + 8 个案例（公路/石化/光伏/废水处理/防洪等） |
| 行业应用页 | 9 | `industries.html` + 8 个行业（住宅/油气/矿业/基建/能源/建筑/水产/农业） |
| 服务详情页 | 7 | `services.html` + 6 个（定制加工/金属表面处理/包装物流/深化设计等） |
| 下载资源页 | 14 | `downloads.html` + 13 个（CAD 图库/安装手册/测试报告/证书等） |
| 公司与支持页 | ~12 | `about` `contact` `support` `faq` `glossary` `esg` `terms-conditions` `privacy-policy` `catalogs` `custom` … |

**产品详情页主要分类**：
- **围栏 Fence**：勾花网围栏、3D 围栏板、358 防攀爬网、V 型安全围栏、农场围栏、庭院围栏等
- **石笼网 Gabion**：机编石笼箱、焊接石笼箱、雷诺护垫、石笼网垫等
- **丝网 Mesh**：焊接网（卷/板）、编织筛网（平纹/斜纹/荷兰编）、不锈钢网、环氧涂层网等
- **刺丝 Barbed Wire**：单股/双股拧刺、传统刺丝、PVC 涂塑刺丝等
- **刀片刺网 Razor Wire**：BTC 蛇腹式、交叉式、焊接刀片网、平铺式等
- **立柱与配件**：圆管/方管/矩形立柱、卡扣、螺旋绑丝、连接钩等

### 2.5 3D 交互模型（`models/`）

| 模型 | 体积 | 应用页面 |
|------|------|----------|
| `welded-gabion-box.glb` | 16 MB | 焊接石笼箱产品页（已从 33MB 量化压缩） |
| `razor-wire-model.glb` | 17 MB | 刀片刺网产品页 |
| `modular-chain-link-fence.glb` | 14 MB | 勾花网围栏产品页 |
| `barbed-wire-model.glb` | 9.6 MB | 刺丝产品页 |
| `3d-fence-panel-model.glb` | 6.3 MB | 3D 围栏板产品页 |

均使用 three.js 原生 GLTFLoader 加载，带加载进度显示与自动居中缩放。

### 2.6 公共组件机制

导航栏与页脚通过 fetch 注入：

```html
<!-- 页面中的引用方式 -->
<div id="navbar-container"></div>
<script>
  fetch('components/navbar.html')
    .then(r => r.text())
    .then(html => document.getElementById('navbar-container').innerHTML = html);
</script>
```

**修改全站导航/页脚时只改 `components/navbar.html` / `components/footer.html` 即可**，无需逐页修改。
注意：fetch 注入在 `file://` 协议下受浏览器跨域限制，本地预览请用本地服务器。

### 2.7 本地开发与预览

纯静态站点，无需构建。任选一种方式本地预览：

```bash
# 方式一：Python 内置服务器
cd kestrel-site && python3 -m http.server 8810
# 访问 http://localhost:8810

# 方式二：Node（如安装了 npx）
npx serve .
```

修改 HTML/CSS/JS/图片后刷新即可生效；确认无误后按【一、推送方法】提交推送。

---

## 三、相关文档

| 文档 | 内容 |
|------|------|
| `PROJECT_PROGRESS.md` | 早期开发进度记录（历史存档，进度信息已过时） |
| `docs/issue-log.md` | 待修复问题记录（待替换图片、交互问题等） |
| [PROJECT_DOCUMENT.md](../PROJECT_DOCUMENT.md) | 项目完整规划文档（设计规范、站点架构、SEO 规范、**域名配置与 GSC 提交**） |
| 本文档 `README.md` | 仓库配置 / 部署方法 / 域名DNS / SEO / 项目内容总览 |
