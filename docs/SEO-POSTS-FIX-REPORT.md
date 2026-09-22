# SEO 文章页修复报告

> 范围：SITE-03 挂入的 16 篇 SEO 流水线文章（无 `blog-` 前缀文件名）及其相关页面
> 状态：以下问题均已修复并经浏览器验证通过

---

## 问题总览

| # | 问题 | 根因 | 状态 |
|---|------|------|------|
| 1 | Blog 列表页分类分组混乱（混入 "Global" 等自由文本小分组） | 内联脚本按自由文本 category 分组，覆盖静态 4 版块结构 | ✅ 已修复 |
| 2 | 3 篇帖子内容过短 | 生成内容缺失 | ✅ 已修复 |
| 3 | 16 篇 SEO 文章在列表页"消失" | 分类修复时被误排除 | ✅ 已恢复 |
| 4 | 文章页缺少右侧边栏（Category / Related Posts / Related Products）及询盘钩子 | SEO 模板未生成侧边栏组件 | ✅ 已补全 |
| 5 | 文章页 banner 纯黑不显示图片 | HTML 引号嵌套错误 + 图片路径不存在 | ✅ 已修复 |
| 6 | 侧边栏补全后仍不渲染 | `article-main` 未闭合导致 DOM 嵌套错误，grid 布局失效 | ✅ 已修复 |
| 7 | 卡片与 banner 图片下半部分纯黑 | 图片文件本身下半部为黑色像素（生成中断） | ✅ 已修复 |

---

## 修复详情

### 1. Blog 列表页分类混乱

- **症状**：`blog-news.html` 出现 "Global" 等大量临时分组小标题，固定 4 版块结构被冲掉。
- **根因**：页面内联脚本读取每篇文章的自由文本 `category` 字段动态分组，SEO 文章的分类值五花八门，覆盖了静态结构。
- **修复**：按方案 A 恢复固定的 4 版块结构，SEO 文章归入对应版块。

### 2. 帖子内容过短（3 篇）

- **涉及文件**：
  - `blog-border-razor-wire-deployment.html`
  - `blog-barb-wire-gates-tips.html`
  - （第三篇同批修复）
- **修复**：批量补全正文内容。

### 3. 16 篇 SEO 文章丢失

- **背景**：SITE-03 批量挂入的 SEO 流水线文章（文件名无 `blog-` 前缀），在分类修复后一度从列表页消失。
- **修复**：恢复挂载，归入固定版块。

### 4. 文章页缺少侧边栏与询盘钩子

- **症状**：SEO 文章页与标准 blog 文章页（参考样板 `blog-razor-coils-7-things.html`）结构不一致，缺少：
  - 右侧边栏 `.article-sidebar`：Category 标签、Related Posts、Related Products 产品卡片
  - 询盘钩子 `.article-inquiry-cta`
  - 分享按钮 `.share-section`
  - 上下篇导航 `.article-post-nav`
- **修复**：为 16 篇文章按主题补全上述组件（Category 按文章主题标注，Related Products 挂对应产品卡）。

### 5. Banner 纯黑不显示

- **根因一（引号嵌套）**：SEO 模板生成的属性写法
  ```html
  <div class="article-hero-bg" style="background-image: url("images/banner/xxx.webp")">
  ```
  双引号嵌套导致属性值截断，背景图失效，露出 `.article-hero` 的黑色底色。
  **修复**：7 个文件改为单引号 `url('...')`。
- **根因二（图片缺失）**：3 个文件 banner 指向不存在的图片。
  **修复**：改用 `images/blog/` 下已有图片（`galvanized-wire-mesh.webp`、`blog-chain-link-2.webp`）。

### 6. 侧边栏补全后仍不渲染

- **根因一（article-main 未闭合）**：`<div class="article-main">` 从未关闭，`<aside class="article-sidebar">` 被嵌进主栏内部，`.article-grid` 的两列 grid 布局失效。
  **修复**：16 个文件统一在 `<!-- Sidebar -->` 前补 `</div>` 闭合。
- **根因二（模板残留结构）**：SEO 模板遗留的未闭合 `<p>`、提前出现的 `</article>`、内联样式灰底 `related-guides` 区块，打乱 DOM 层级。
  **修复**：逐一清理残留结构；`gabion-boxes-supplier-your-b2b-sourcing-guide.html` 因损坏严重整体重写为标准结构。
- **验证**：侧边栏四个区块（Category / Related Posts / Related Products）与询盘钩子均正常显示。

### 7. 卡片与 Banner 图片半黑（最后一轮）

- **症状**：blog 列表卡片缩略图与文章 banner 的图片下半部分为纯黑。
- **根因**：卡片与 banner 引用同一批 `images/banner/*-hero.webp`，其中 **5 张图片文件本身**下半部分就是纯黑像素（无 alpha 通道，非 CSS 遮罩问题）。SEO 流水线生成图片时中断，仅渲染了画面上部 25%~47% 的内容：

  | 图片 | 实际内容占比 |
  |------|------------|
  | razor-wire-guide-high-security-perimeter-fencing-hero.webp | 47% |
  | 358-fence-complete-guide-high-security-mesh-fencing-hero.webp | 45% |
  | cattle-fence-roll-durable-livestock-fencing-guide-hero.webp | 37% |
  | top-10-welded-wire-mesh-manufacturers-china-2024-updated-hero.webp | 34% |
  | install-3d-panel-fence-expert-guide-for-b2b-hero.webp | 25% |

  另 2 张（`galvanized-wire-the-ultimate-b2b-buying-guide-hero.webp`、`top-10-wire-mesh-manufacturers-china-comprehensive-guide-hero.webp`）检测正常，未改动。
- **修复方式**：镜像拼接——裁出有内容的上半部分，垂直翻转拼接在下方（接缝天然无缝，呈倒影效果），再以 Lanczos 缩放回 1280×720。放大倍数仅 1.06x~2.0x，避免拉伸变形，清晰度损失极小。已逐张验证上下半区亮度一致、无黑色区域。
- **备份**：原图备份于 `/tmp/banner-backup/`（临时目录，重启会丢失；如需长期保留请转移）。
- **已知瑕疵**：`install-3d` 原图内容仅 25%，放大 2 倍后清晰度略低于其他几张，如不满意可后续重新生成。

---

## 遗留事项（待处理）

1. ~~可疑隐藏链接注入~~：**已定性并处理**（2026-09-23）——确认为 Cloudflare 响应注入的正常行为（非恶意），13 个 HTML 文件中的残留已清理，详见下文"生成器侧根本修复"。
2. **`install-3d` banner 清晰度**：可选优化项，重新生成高质量 hero 图替换。

---

## 根因归因：SEO 流水线缺陷清单

本轮所有问题均源自 SEO 工作流自动生成的文章/图片质量缺陷，建议在流水线侧修复：

1. **分类字段**：使用自由文本而非受控词表 → 列表页分组混乱。
2. **HTML 模板**：属性引号嵌套错误、标签未闭合（`<p>` / `<div class="article-main">` / `<article>`）、残留 `related-guides` 旧结构。
3. **组件缺失**：未生成侧边栏、询盘钩子、分享、上下篇导航等标准组件。
4. **图片生成中断**：hero 图仅渲染上半部分，下半部分纯黑。
5. **疑似注入**：隐藏外链写入正文头部。

**建议**：流水线产出后增加校验步骤（HTML 结构校验 + 图片完整性检测 + 暗链扫描）再上线。

---

## 生成器侧根本修复（2026-09-23 第二轮）

> 发布链路代码位于本仓库 `src/`（Cloudflare Worker）：
> `cron/generate.ts`(DeepSeek 内容) → `lib/banner-gen.ts`(wanx-v1 图片) → `cron/score.ts`(评分+发布)

### 调查结论

- 线上 14 篇坏文章产自**旧版生成链路**；仓库当前模板的 hero 引号/闭合写法本身正确。
- 之前会话已提交的生成器修复：`c7e7446`（banner prompt 去暗色调）、`e953ecb`（banner 文件名内容哈希防 CDN 旧缓存）。
- 遗留缺口：AI 输出 HTML 无校验直接嵌入、banner 无完整性校验、模板缺侧边栏组件、管理台生成器分组无白名单、Cloudflare 注入残留入库。
- **"暗链"定性更正**：`cdn-cgi/content?id=...` 隐藏链接是 **Cloudflare 响应注入的正常行为**（SITE-04 记录"仅 Cloudflare 注入"），非恶意代码；但回收线上 HTML 时未过滤，把带过期 token 的死链存进了仓库。

### 本轮修复内容

| 文件 | 修复 |
|------|------|
| `src/lib/deepseek.ts` | ① 新增 `sanitizeArticleHtml()`：剥离 `<script>`、隐藏 `<a>`（display:none/visibility:hidden）、文档级标签（html/head/body/article/main/aside），自动补齐未闭合的常见容器标签并告警——未闭合 `<p>`/提前 `</article>` 类事故不再进生产；② 模板补齐 `share-section`（LinkedIn/Twitter/Email）、`article-post-nav`（上下篇导航）；③ 新增 `KEYWORD_SIDEBARS` 映射 + `buildSidebarHtml()`：按关键词（razor/gabion/chain-link/barbed/农场/高安全/六角网 + 兜底）生成 article-sidebar（Category / Related Posts / Related Products 产品卡），模板产出与标准 blog 页一致的 article-grid 两列结构；④ `data-page-title` 经 `escAttr()` 转义防引号破坏属性 |
| `src/lib/banner-gen.ts` | 新增 `validateBannerImage()`：校验文件大小（>30KB）、RIFF/WEBP 容器头、声明尺寸（解析 VP8X/VP8L/VP8 三种格式，要求 ≥1000×500）；坏图直接判失败 → 上层 catch 返回 null → 文章回退静态 hero 图。半黑图（文件头完整）无法在 Worker 内做像素检测，需回收入库时本地校验兜底 |
| `admin/js/blog-generator.js` | 分组白名单归一：未知/脏 `section` 一律归入 `product-info`，按固定 `SECTION_ORDER` 输出——管理台重新生成 blog-news.html 时不再出现 "Global" 类自由文本分组 |
| 13 个文章 HTML | 清理 `<body>` 后的 Cloudflare 注入隐藏链接（`cdn-cgi/content?id=...`），`<body>` 标签完好，全站 HTML 中该模式已清零 |

### 验证

- `npx tsc --noEmit` 零错误；`node --check admin/js/blog-generator.js` 通过。
- 侧边栏映射引用的产品页/图片/文章均已确认存在于仓库静态资产。

### 部署提醒（需人工执行）

1. Worker 侧修复需 `npx wrangler deploy` 后才对生产生效（含此前 c7e7446/e953ecb 是否已部署也需在 Cloudflare Dashboard 确认）。
2. 建议 commit 时将本轮改动与文档一起入库。
3. 可选后续：回收入库环节增加本地校验脚本（HTML 结构 + 图片像素级半黑检测 + 暗链扫描），作为 Worker 校验之外的第二道闸。
