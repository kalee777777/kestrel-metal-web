# KESTREL METAL 官网开发进度

> **最后更新**: 2026-08-10
> **项目状态**: 🔄 阶段二进行中（Products ✅ / Resources ✅ / Services ✅ / Industries ✅）
> **静态站路径**: `Desktop/kestrel metal web 1/kestrel-site/`

---

## 📊 总体进度

| 阶段 | 任务 | 状态 | 进度 |
|------|------|------|------|
| 1 | 基础框架 + 首页 | ✅ 已完成 | 100% |
| 2 | Products 产品总览页 | ✅ 已完成 | 100% |
| 2 | Resources 资源中心页 | ✅ 已完成 | 100% |
| 2 | Services 服务中心页 | ✅ 已完成 | 100% |
| 2 | Industries 行业应用页 | ✅ 已完成 | 100% |
| 3 | 产品详情页 | ⏳ 待开始 | 0% |
| 4 | SEO 优化 + 部署 | ⏳ 待开始 | 0% |

---

## ✅ 阶段一：基础框架 + 首页（已完成）

> **完成日期**: 2026-08-10
> **Git 提交**: `e427d97` (初始化) + `7a76b43` (首页完善)

### 1.1 项目架构

```
kestrel-site/
├── index.html                    # 首页（完整）
├── products.html                 # 产品总览页（已完成）
├── resources.html                # 资源中心页（已完成）
├── services.html                 # 服务中心页（已完成）
├── industries.html               # 行业应用页（已完成）
├── components/
│   ├── navbar.html               # 导航栏组件（fetch 注入）
│   └── footer.html               # 页脚组件（fetch 注入）
├── css/
│   ├── styles.css                # 全局样式（CSS 变量、通用组件）
│   ├── navbar.css                # 导航栏样式（桌面端 + 移动端）
│   ├── footer.css                # 页脚样式
│   ├── home.css                  # 首页所有区块样式 + 响应式
│   ├── products.css              # 产品总览页样式
│   ├── resources.css             # 资源中心页样式
│   ├── services.css              # 服务中心页样式
│   └── industries.css            # 行业应用页样式
├── js/
│   ├── includes.js               # 组件加载器（fetch navbar/footer）
│   ├── navbar.js                 # 导航栏交互（滚动、移动端菜单、Products 手风琴）
│   ├── home.js                   # 首页交互（Evidence/MetalProducts/地图/滚动动画）
│   ├── home-data.js              # 首页数据（项目列表、地图坐标）
│   ├── products.js               # 产品页交互（滚动动画/回到顶部）
│   ├── products-data.js          # 产品数据（14 款产品）
│   ├── resources.js              # 资源页交互（滚动动画/回到顶部）
│   ├── services.js               # 服务页交互（滚动动画/回到顶部）
│   └── industries.js             # 行业页交互（滚动动画/回到顶部）
├── products/                     # 产品图片资源
│   ├── fence/                    # 围栏类（产品图 + category 缩略图）
│   └── wire/                     # 线材类（产品图 + category 缩略图）
├── images/
│   ├── kestrelmetal.png          # Logo（Navbar + Footer 共用）
│   ├── logo.svg                  # SVG Logo
│   └── industry/                 # 行业卡片背景图（8 张旧项目迁移）
└── PROJECT_PROGRESS.md            # 开发进度文档
```

### 1.2 已完成的首页区块

| 区块 | 状态 | 说明 |
|------|------|------|
| Hero 英雄区 | ✅ | 深色背景 + 大标题 + 双 CTA 按钮 + 项目列表 |
| Global Map 全球地图 | ✅ | D3.js 世界地图 + 项目标记 + Tooltip |
| Evidence 数据展示 | ✅ | 5 张卡片（01 主卡 + 04 统计卡）+ hover 联动 |
| Metal Products 产品展示 | ✅ | 5 款产品交互切换（左右联动） |
| Project Management | ✅ | 项目管理流程展示 |
| Projects Showcase | ✅ | 精选项目展示 |
| Company Overview | ✅ | 公司概况 + ESG |
| Video Banner | ✅ | 视频播放区 |
| Footer | ✅ | 5 列布局 + 版权 + 社交链接 |

### 1.3 已解决的技术问题

| 问题 | 解决方案 |
|------|----------|
| D3.js `geoNaturalEarth1 is not a function` | 改用完整 D3 v7 CDN + topojson-client v3 |
| 移动端 Hero 按钮颜色异常 | CSS `!important` 覆盖渐变色 |
| Evidence 01 主卡片重复内容 | CSS `display: none/block` 模拟 React 条件渲染 |
| Evidence 02-05 移动端格式不一致 | 隐藏 `card-vertical-text`，统一为 数字+标题+描述 |
| Evidence 标题文字溢出 | 添加 `word-wrap: break-word; hyphens: auto` |
| Navbar/Footer 注入方式 | `fetch()` + `innerHTML` 动态注入 |
| CSS 大括号不平衡检查 | Python 脚本验证 |

### 1.4 设计规范（已确立）

```css
:root {
  /* 背景 */
  --color-black: #0a0a0a;
  --color-dark: #1a1a1a;

  /* 文字 */
  --color-white: #ffffff;
  --color-gray: #666666;

  /* 品牌橙色系 */
  --color-orange-primary: #FF6B00;
  --color-orange-dark: #FF4500;
  --color-orange-gradient-end: #E53935;

  /* 字体 */
  --font-display: 'Bebas Neue', sans-serif;    /* 标题 */
  --font-body: 'Source Sans Pro', sans-serif;  /* 正文 */
}
```

**响应式断点**:
- Desktop: > 1200px
- Tablet: 768px - 1200px
- Mobile: < 768px
- Small: < 480px

---

## 🔄 阶段二：各子页面（即将开始）

> **目标**: 完成所有非产品详情的子页面
> **核心原则**: 内容来自旧项目，设计采用新项目深色主题
> **参考文档**: `PROJECT_DOCUMENT.md` 第三节"站点架构"

### 2.1 Products 产品总览页（已完成）

> **完成日期**: 2026-08-10
> **Git 提交**: `22145bf` (新增) + `2dc7ddb` (设计统一)

**页面结构**:
```
Products 页面
├── Hero Banner（深色背景图 + breadcrumb + "OUR PRODUCTS"）
├── Fence Products（6 款，3 列网格）
│   ├── 3D Wire Panel Fence（featured，橙色渐变背景）
│   ├── Chain Link Fence
│   ├── Security Fence
│   ├── Farm Fence
│   ├── Fence Posts
│   └── Fence Accessories
├── Wire Mesh Products（3 款，3 列网格）
├── Welded Wire Mesh Products（3 款，3 列网格）
├── Wire Products（2 款，2 列网格）
└── CTA（深色图片背景 + 两个白色边框按钮）
```

**新增文件**:
- `products.html` — 页面结构
- `css/products.css` — 页面样式（深色 hero + 浅色交替区块 + 产品卡片）
- `js/products.js` — 交互逻辑（滚动动画/回到顶部）
- `js/products-data.js` — 14 款产品数据
- `products/fence/*.webp` — 6 张围栏产品图
- `products/wire/*.webp` — 8 张线材产品图

**设计特点**:
- 对齐首页设计语言：深色 hero + 浅色交替内容区
- 产品卡片：白底 + 阴影 + hover 上浮，featured 卡片橙色渐变背景
- CTA 区：深色熔岩图片背景 + 暗色遮罩 + 白色边框按钮
- 7 种断点响应式适配（1200/1024/768/640/480/400）

### 2.2 Resources 资源中心页（已完成）

> **完成日期**: 2026-08-10
> **Git 提交**: 框架搭建 + category 图片迁移

**页面结构**:
```
Resources 页面
├── Hero Banner（深色背景图 + breadcrumb + "OUR RESOURCES"）
├── Product Categories Grid（14 个产品类别缩略图，7×2 网格）
│   ├── 3D Wire Panel → products/fence/3d-panel-category.webp
│   ├── Chain Link → products/fence/chain-link-category.webp
│   ├── Security Fence → products/fence/security-category.webp
│   ├── Farm Fence → products/fence/farm-category.webp
│   ├── Fence Posts → products/fence/fence-posts-category.webp
│   ├── Accessories → products/fence/accessories-category-product.webp
│   ├── Hexagonal Netting → products/wire/hexagonal-netting-category.webp
│   ├── Gabion Box → products/wire/gabion-box-category.webp
│   ├── Screen Mesh → products/wire/stainless-screen-mesh-category.webp
│   ├── Welded Panel → products/wire/welded-mesh-panel-category.webp
│   ├── Welded Roll → products/wire/welded-mesh-roll-category.webp
│   ├── Welded Gabion → products/wire/welded-gabion-box-category.webp
│   ├── Barbed Wire → products/wire/barbed-wire-category.webp
│   └── Razor Wire → products/wire/razor-wire-category.webp
├── Resources Cards（6 个资源入口卡片，3 列网格）
│   ├── Product Catalogs
│   ├── Technical Downloads
│   ├── Blog & News
│   ├── Case Studies
│   ├── FAQ
│   └── Glossary
└── CTA（深色图片背景 + 两个白色边框按钮）
```

**新增文件**:
- `resources.html` — 页面结构（复用 navbar/footer 组件）
- `css/resources.css` — 页面样式（对齐 products/home 设计语言）
- `js/resources.js` — 交互逻辑（data-reveal 动画/回到顶部/滚动进度条）

**设计特点**:
- Hero + breadcrumb + category-header 标题格式完全对齐 Products 页
- 14 张 category 缩略图从旧项目迁移（`*-category.webp`）
- 资源入口卡片：白底 + 边框 + hover 上浮 + 底部橙色条动画
- CTA 区：与 Products 页完全一致（深色背景 + 白色边框按钮）

**待完善**:
- [ ] Resources Cards 的 `href` 链接待替换为真实页面地址
- [ ] 各子页面（Catalogs/Downloads/Blog/Case Studies/FAQ/Glossary）待开发

### 2.3 Services 服务中心页（已完成）

> **完成日期**: 2026-08-10
> **设计参考**: 旧项目 `lenke-metal-web/services.html`

**页面结构**:
```
Services 页面
├── Hero Banner（深色背景图 + breadcrumb + "OUR SERVICES"）
├── Services Grid（3×2 网格 6 张服务卡片，浅灰底）
│   ├── Fabrication Services（精密制造，30+年经验）
│   ├── Metal Finishing（热镀锌、PVC、粉末喷涂）
│   ├── Custom Solutions（定制围栏系统）
│   ├── Designer Services（CAD/BIM 模型库）
│   ├── Takeoffs & Drawings（材料算量、车间图，98%准确率）
│   └── Packaging & Logistics（保护包装、全球运输，99.5%无损坏）
└── CTA（深色图片背景 + 两个白色边框按钮）
```

**新增文件**:
- `services.html` — 页面结构（复用 navbar/footer 组件）
- `css/services.css` — 页面样式（对齐 products/resources 设计语言）
- `js/services.js` — 交互逻辑（data-reveal 动画/回到顶部/滚动进度条）

**设计特点**:
- Hero + breadcrumb + category-header 标题格式对齐其他页面
- 服务卡片：白底 + 边框 + hover 上浮 + 底部橙色条动画（与 Resources 卡片一致）
- 卡片图标：橙色 SVG，hover 时图标背景变橙、图标变白
- CTA 区：与 Products/Resources 完全一致

**待完善**:
- [ ] 6 张服务卡片的 `href="#"` 待替换为真实子页面地址
- [ ] 6 个服务子页面（service-*.html）待开发

### 2.4 Industries 行业应用页（已完成）

> **完成日期**: 2026-08-10
> **设计参考**: 旧项目 `lenke-metal-web/industries.html`

**页面结构**:
```
Industries 页面
├── Hero Banner（深色背景图 + breadcrumb + "INDUSTRIES WE SERVE"）
├── Industries Grid（2 列网格 8 张背景图行业卡片，白底）
│   ├── Construction → images/industry/industry-construction.jpg
│   ├── Agriculture → images/industry/industry-agriculture.jpg
│   ├── Mining & Quarry → images/industry/industry-mining.jpg
│   ├── Oil & Gas → images/industry/industry-oilgas.jpg
│   ├── Infrastructure → images/industry/industry-infrastructure.jpg
│   ├── Energy & Power → images/industry/industry-energy.jpg
│   ├── Residential → images/industry/industry-residential.jpg
│   └── Aquaculture → images/industry/industry-aquaculture.jpg
└── CTA（深色图片背景 + GET A QUOTE 按钮）
```

**新增文件**:
- `industries.html` — 页面结构（复用 navbar/footer 组件）
- `css/industries.css` — 页面样式（背景图卡片 hover 动画）
- `js/industries.js` — 交互逻辑（data-reveal 动画/回到顶部/滚动进度条）
- `images/industry/*.jpg` — 8 张行业背景图（旧项目迁移）

**设计特点**:
- 行业卡片为背景图卡片，复刻旧项目 hover 交互：
  - 默认：底部标题 + 渐变遮罩压暗
  - Hover：背景图放大、遮罩加深、标题变橙色、描述展开、Learn More 浮现
- 桌面 2 列网格，移动端 1 列
- Hero/CTA 背景图重新生成（金属围栏丝网主题 + 熔岩金属主题）

**待完善**:
- [ ] 8 张卡片的 `href="#"` 待替换为真实子页面地址
- [ ] 8 个行业子页面（industry-*.html）待开发

### 2.5 其他子页面（按优先级排序）

| 优先级 | 页面 | 内容来源 | 说明 |
|--------|------|----------|------|
| P1 | About Us 关于我们 | 旧项目 about.html | 公司简介 + 发展历程 |
| P1 | Contact 联系我们 | 旧项目 contact.html | 联系方式 + 表单 |
| P1 | Request Quote 报价 | 旧项目 request-quote.html | 报价表单 |
| P3 | FAQ 常见问题 | 旧项目 faq.html | 可折叠问答 |
| P3 | Glossary 术语表 | 旧项目 glossary.html | 产品术语 |
| P3 | Privacy Policy | 旧项目 privacy-policy.html | 法律条款 |
| P3 | Terms & Conditions | 旧项目 terms-conditions.html | 服务条款 |
| P3 | 404 页面 | — | 自定义错误页 |

### 2.6 每个子页面的通用模板

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{页面标题} | KESTREL METAL</title>
    <meta name="description" content="{SEO 描述}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/navbar.css">
    <link rel="stylesheet" href="css/footer.css">
    <link rel="stylesheet" href="css/{页面名}.css">
</head>
<body>
    <div id="navbar-placeholder"></div>

    <main>
        <section class="page-hero">
            <div class="container">
                <nav class="breadcrumb">...</nav>
                <h1>{页面标题}</h1>
                <p>{页面描述}</p>
            </div>
        </section>

        <section class="page-content">
            <div class="container">
                <!-- 页面主体内容 -->
            </div>
        </section>
    </main>

    <div id="footer-placeholder"></div>

    <script src="js/includes.js"></script>
    <script src="js/{页面名}.js"></script>
</body>
</html>
```

---

## 📦 阶段三：产品详情页（待开始）

> **目标**: 完成所有 14 个产品详情页
> **内容来源**: 旧项目 `lenke-metal-web/fence-3d.html` 等

### 3.1 产品详情页列表（14 个）

**Fence Products（6 个）**:
- [ ] fence-3d.html — 3D Wire Panel Fence（含 3D 模型 + 色卡）
- [ ] fence-chain-link.html — Chain Link Fence（含规格模拟器）
- [ ] fence-security.html — Security Fence
- [ ] fence-farm.html — Farm Fence
- [ ] fence-posts.html — Fence Posts
- [ ] fence-accessories.html — Fence Accessories

**Woven Wire Mesh（3 个）**:
- [ ] wire-hexagonal.html — Hexagonal Wire Netting
- [ ] wire-stainless.html — Stainless Screen Mesh
- [ ] gabion-boxes.html — Woven Gabion Mesh

**Welded Wire Mesh（3 个）**:
- [ ] welded-mesh-roll.html — Welded Wire Mesh Roll
- [ ] welded-mesh-panel.html — Welded Wire Mesh Panel
- [ ] welded-gabion-box.html — Welded Gabion Box

**Wire Products（2 个）**:
- [ ] wire-barbed.html — Barbed Wire
- [ ] wire-razor.html — Razor Wire

### 3.2 产品详情页通用结构

```
产品详情页
├── 面包屑导航（Home / {分类} / {产品名}）
├── Page Intro（产品图 + 标题 + 简述）
├── Specifications 规格参数表
├── Features 特点与优势
├── Applications 应用场景
├── Gallery 产品图集（可选）
├── Related Products 相关产品推荐
└── CTA 请求报价
```

---

## 🎯 实施策略（经验总结）

### 策略一：逐页推进，每页一个提交

每个子页面完成后立即提交推送到 Gitee，避免大量修改堆积。

**每个页面的标准流程**：
1. 读取旧项目对应页面，提取内容（文字、图片、结构）
2. 创建 `{页面名}.css` 深色主题样式
3. 创建 `{页面名}.html` 页面结构
4. 创建 `{页面名}.js` 交互逻辑（如需要）
5. 响应式验证（390px / 480px / 768px / 1200px）
6. `git add` + `git commit` + `git push`

### 策略二：复用组件，保持一致

所有页面复用：
- `components/navbar.html` — 导航栏
- `components/footer.html` — 页脚
- `css/styles.css` — 全局样式和 CSS 变量
- `js/includes.js` — 组件加载器

### 策略三：内容先行，设计跟随

1. 先从旧项目复制内容（文字、图片、数据）
2. 再用新项目的深色主题样式包装
3. 最后添加交互和动画

### 策略四：移动端优先验证

每次修改后，优先在 390px / 480px 移动端 viewport 下验证，确保：
- 卡片不溢出
- 文字不截断
- 间距合理
- 触摸友好

### 策略五：图片资源管理

- 产品图片从旧项目 `products/` 目录复制（webp 格式）
- 页面装饰图继续使用 Unsplash 外部 URL
- 本地 Logo 使用 `images/kestrelmetal.png`

---

## 📝 关键文件参考

### 旧项目（内容源）

| 文件 | 用途 |
|------|------|
| `lenke-metal-web/products.html` | 产品总览页内容 |
| `lenke-metal-web/fence.html` | 围栏分类页内容 |
| `lenke-metal-web/fence-3d.html` | 产品详情页模板 |
| `lenke-metal-web/about.html` | 关于我们内容 |
| `lenke-metal-web/contact.html` | 联系页面内容 |
| `lenke-metal-web/industries.html` | 行业应用内容 |
| `lenke-metal-web/services.html` | 服务页面内容 |
| `lenke-metal-web/products/` | 产品图片资源 |
| `lenke-metal-web/components/navbar.html` | 导航结构参考 |
| `lenke-metal-web/components/footer.html` | 页脚结构参考 |

### 新项目（设计参考）

| 文件 | 用途 |
|------|------|
| `lenke-kestrel-web/src/index.css` | CSS 变量定义 |
| `lenke-kestrel-web/src/components/*.jsx` | 组件结构参考 |
| `lenke-kestrel-web/src/components/*.css` | 样式参考 |
| `lenke-kestrel-web/src/pages/ProductsPage.jsx` | 产品页 React 实现 |
| `lenke-kestrel-web/src/pages/ProductsPage.css` | 产品页样式参考 |

### 静态站（当前项目）

| 文件 | 用途 |
|------|------|
| `kestrel-site/index.html` | 首页（已完成） |
| `kestrel-site/css/styles.css` | 全局样式 |
| `kestrel-site/css/home.css` | 首页样式 |
| `kestrel-site/js/includes.js` | 组件加载器 |
| `kestrel-site/components/navbar.html` | 导航栏组件 |
| `kestrel-site/components/footer.html` | 页脚组件 |

---

*文档版本: v2.0 | 创建者: AI Assistant | 最后更新: 2026-08-10*
