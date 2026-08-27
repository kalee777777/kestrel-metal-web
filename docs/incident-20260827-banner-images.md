# 全站 Banner 图片缺失事故复盘（2026-08-27）

## 事件概述

| 项目 | 内容 |
|------|------|
| 影响范围 | 生产环境 kestrelmetal.com：29+ 个产品页 hero banner 背景丢失，另有 6 处区块背景、1 处 CSS 分类页背景、1 处 ESG 社区图、2 处 admin logo 等零散缺失 |
| 持续时间 | 自提交 `11619c5` 引入，2026-08-27 晚间集中修复 |
| 最终结果 | ✅ 全站 571 个图片/模型引用 100% 指向存在的文件，线上抽样验证全部 200 |
| 修复提交 | `5013d20`（临时替代，后被覆盖）→ `405bbfa`（还原 33 张专属原图）→ `4cecc5a`（修正 3 处路径） |

## 根因

### 直接原因：本地化提交"只改引用、未存文件"

原始页面（`11619c5` 之前）的 hero banner 是**每页专属的 AI 生成图片**，以内联样式直接引用生成 API URL：

```html
<div class="article-hero-bg" style="background-image:url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=galvanized%203d%20wire%20panel%20fence%20V-profile...&image_size=landscape_16_9');"></div>
```

提交 `11619c5`（Admin CMS 数据联动 + 全站 Bug 修复）将外部 URL 批量改写为本地路径（如 `products/fence-3d-hero.webp`），**但对应的图片文件从未保存进仓库**，Git 历史中也从未存在。结果线上 404，banner 区域空白。

### 影响面统计（首轮扫描）

全站 126 个 hero 背景引用中 13 个文件缺失，波及 29 个页面：

- `images/btc-razor-wire.webp` — 一张图影响 16 个刺绳/刀片刺网系列页面（用户感觉"所有产品页都丢了"的直接原因）
- `products/fence-3d-hero.webp`、`images/fence-security-hero.webp`、`images/hexagonal-wire.webp` 等 12 个各影响 1–2 页

### 深度扫描追加发现

将扫描范围从 `article-hero-bg` 扩展到全类型资源引用（img/srcset/poster/CSS url/og:image，相对路径按文件目录解析）后，又发现：

| 位置 | 问题 |
|------|------|
| hexagonal-wire-galvanized.html | 6 处（hero + 4 个 info 区 + CTA 区）全部指向不存在的 `.webp` |
| welded-mesh-panel-galvanized.html | 2 处 info 区引用失效，原始引用应为 `images/welded-mesh-panel-overview.webp`（存在） |
| css/products.css `.products-hero-bg` | 引用 `../images/products/welded-mesh-panel-overview.webp`（路径多了一级 products/），影响 5 个产品分类页 |
| esg.html | `images/blog/blog-community.jpg` 从未存在（社区板块图 + `<img>` 双处引用） |
| admin/index.html、admin/login.html | logo 引用 `/kestrelmetal.png`，实际在 `/images/kestrelmetal.png` |
| industry-construction.html、dutch-weave-screen-mesh.html | 2 处 img 路径错位（文件在别处） |

## 修复方案与过程

### 第一轮（`5013d20`，临时方案 → 已被覆盖）

将 13 处失效引用重指向语义相近的现有图片（如产品图、卡片图）。
**用户反馈：需要原本的 banner 图片，而非随便找的产品图。** 此方案作废，由第二轮覆盖。

### 第二轮（`405bbfa`，最终方案：还原每页专属原图）

1. 从 Git 历史提取每个受影响页面在 `11619c5^` 版本中的**原始 AI 图 URL（含专属 prompt）**
2. 重新下载为本地 JPEG 文件（27 张 hero + hexagonal 页 6 张 = 33 张），如：
   - `products/fence-3d-hero.jpg` — "镀锌 3D V 型焊接围栏、橙色夕阳光"
   - `images/razor-wire-btc-hero.jpg` — "BTC 军用刀片刺网 concertina"
   - `images/barbed-wire-pvc-hero.jpg` — "绿色 PVC 涂层刺网、花园场景"
3. 每个页面的 hero 引用改为指向自己的专属原图文件
4. ESG 社区图按原始引用路径生成补齐（HTML 零改动）
5. galvanized 焊接网版页还原为 Git 历史中的原始引用 `images/welded-mesh-panel-overview.webp`
6. 修正 `css/products.css` 路径（去掉多余的 `products/` 一级）

### 第三轮（`4cecc5a`）

修正 admin 页 logo（`/kestrelmetal.png` → `/images/kestrelmetal.png`）及 2 处 img 路径错位。

### 保留不动的情况

- `chain-link-fittings.html`：首版即引用本地路径（原图从未生成过），保留现有的 `images/chain-link-fittings-banner.webp`（真实 banner 图）
- `blog-galvanized-chain-link-fence-maintenance.html`：指向 `images/blog/blog-chain-link-yard-1.webp`（原图重命名后的正确路径）

## 验证结果

```text
本地静态扫描：198 个 HTML + 26 个 CSS
检查唯一图片/模型引用（src/data-src/poster/srcset/href/背景url/og:image）：571 个
→ 100% 存在，0 缺失

线上抽样：随机抽取 40 个引用 URL 逐一请求
→ 40 个全部 200

抽查页面 hero 引用：
fence-3d → products/fence-3d-hero.jpg (200, 218KB)
razor-wire-btc → images/razor-wire-btc-hero.jpg (200, 189KB)
hexagonal-wire → images/hexagonal-wire.jpg (200)
welded-mesh-panel-galvanized → images/welded-mesh-panel-overview.webp (200)
```

说明：AI 生成图与当年同 prompt 渲染的图在细节上可能有微小差异，但主题、构图一致；且从此为本地文件，不再依赖外部 API，加载更快更稳定。

## 经验教训

1. **外部资源本地化必须"引用 + 文件"成对提交**：批量改写 HTML 引用的同时，务必确认目标文件已入库（可用 `git status` / 引用扫描验证）
2. **引用完整性应进 CI**：本次编写的扫描逻辑（全类型资源引用 × 按目录解析相对路径 × 校验存在性）适合作为部署前置检查，可在图片缺失时直接阻断发布
3. **诊断先分级定位再动手**：`curl -I` 确认图片 404 → 区分"文件从未存在"与"路径错位"两类，前者从 Git 历史找原始引用，后者直接修正路径
4. **边缘缓存会掩盖问题**：验证必须带随机 query 参数绕过缓存
5. **替代方案要确认验收标准**：第一轮"语义相近替代图"技术上可行，但不符合"还原原图"的业务预期，应先确认再实施

---

*文档创建时间：2026-08-27*
*关联文档：[线上路由连环故障复盘](incident-20260827-routing.md)（同日另一事故）*
