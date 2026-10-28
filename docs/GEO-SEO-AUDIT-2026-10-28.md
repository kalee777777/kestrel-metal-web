# 全站 GEO + SEO 审计与修复 — 2026-10-28

> 范围：地理位置定向（geo-targeting）+ SEO 核心配置 + 生成式 GEO（AI 引用）五层复核
> 方法：本地 204 页全量扫描脚本 + 线上 API 实测（GSC/keywords/cron/sitemap）+ geo-playbook 审计脚本
> 状态：✅ 修复已完成并验证（tsc 通过、18/18 冒烟测试、复扫清零），**待 commit + push 部署**

---

## 一、结论总览

| 维度 | 判定 | 说明 |
|------|------|------|
| 生成式 GEO（AI 引用） | ✅ 健康 | 五层全绿：AI 爬虫 8/8 放行、llms.txt 81 行、抽样 30 页 JSON-LD 100% 有效 |
| 地理位置定向 | ✅ 架构正确 | 单语言全球定位，无需 hreflang；Organization schema 带 areaServed 6 国 + CN 地址；Product USD 报价；contact 页 NAP/WhatsApp 齐全 |
| SEO 技术面 | ⚠️ 1 个 P0 已修 | og/twitter 标签对社媒与 AI 爬虫完全不可见（详见二.1） |
| SEO 内容面 | ⚠️ 存量问题 | 9 个薄内容页、85 页 description 超长、1 组重复 description |
| 搜索表现 | ❌ 压制未解除 | spam update 后展示量仍未恢复（10/18~10/25 每天 0-1 次），管线暂停中，索引 218（10-12 快照） |

---

## 二、本次修复（已完成，待部署）

### 1. 【P0】og/twitter 标签服务端注入修复

**问题**：全站 204 页 + 8 篇 KV 文章，og/twitter 标签数为 **0**（线上 curl 实证）。原因链：
- 静态 HTML 无 og 标签；
- Worker 端 `seo-inject.ts` 见页面已有 canonical 即整体跳过注入（旧 L386）；
- `js/seo-enhance.js` 的客户端注入只对执行 JS 的浏览器可见——**LinkedIn/Facebook/WhatsApp 爬虫不执行 JS**，分享出去的链接全部没有标题/图片预览；AI 爬虫同样拿不到。

**影响**：LinkedIn 获客（LINKEDIN_CONTENT_PLAN 正在推进）分享链接无卡片；whatsapp 报价链接无预览。

**修复**：
- `src/lib/seo-inject.ts`：改为「只补缺失项」——og 七件套、twitter 四件套、keywords、robots（max-image-preview:large），已有 canonical/title/description 一律不动；og:url 优先复用页面自身 canonical（.html 规范形态）；Article schema 自动识别 og:type=article；移除 /blog.html 的注入豁免
- `src/index.ts`：KV 动态文章响应也过一遍 injectSeoTags（原先完全绕过）
- 新增 `images/og-default.jpg`（1200×630，默认分享图，原先 DEFAULT_IMAGE 指向的文件不存在）

**验证**：`npx tsc --noEmit` 通过；编译后 18/18 冒烟测试（注入/不覆盖/幂等/admin 排除/KV 文章/blog.html）。

### 2. 【P1】内容与规范性修复

| 项 | 数量 | 内容 |
|----|------|------|
| 双 h1 | 12 页清零 | 6 篇合并指南删除 article-content 内残留重复 h1；3 立柱页 + 3 表面处理页产品区 h1→h2，CSS 选择器扩展为 `h1, h2`（视觉零变化） |
| 中文泄漏 | 3 页清零 | blog-materials-welded-wire-mesh 可见标题中的中文括注（普通钢丝网/耐候钢/预镀锌钢丝网）移除；index/products 注释改英文 |
| 超长 title（≥100 字符） | 7 页缩短至 62-85 | 保留主关键词，删除冗余后缀；solar-farm 指南 119→62 |
| _redirects | +7 条 | 9-30 内容合并后保留的指南页补无扩展名 301（412→419 条），符合「新增静态页必须补规则」约定 |
| sitemap lastmod | 203 条刷新 | 184 条停留在 2026-08-17 → 按各文件最近 git 提交日刷新（9 月 196 条 / 10 月 8 条），利于重抓 |

### 3. 修改文件清单

```
src/lib/seo-inject.ts · src/index.ts · images/og-default.jpg(新增)
_redirects · sitemap.xml · css/post-detail.css · css/finish-detail.css
index.html · products.html · blog-materials-welded-wire-mesh.html
round/square/rectangular-post.html · hot-dip-galvanized/pvc/powder-coated.html
6 篇 *-guide.html（删重复 h1）· 7 篇 blog-*.html（缩 title）
```

### 4. 部署与验收

```bash
cd kestrel-site && git diff   # 复核
git add -A && git commit && git push github main
# 部署完成后验收：
curl -s https://www.kestrelmetal.com/ | grep -c 'property="og:'        # 期望 7
curl -s https://www.kestrelmetal.com/cost-of-metal-fence-posts-pricing-guide-2025.html | grep -c 'property="og:'  # KV 文章，期望 7
# LinkedIn Post Inspector / 微信文件传输助手 发一条链接看卡片
```

---

## 三、地理位置定向（GEO-targeting）专项结论

**判定：架构正确，无需 hreflang，不建议加 geo.region meta。**

| 检查项 | 状态 |
|--------|------|
| html lang | 204/204 页 `en` ✅ |
| hreflang | 正确地没有：单语言站无区域变体，加了反而给 Google 制造信号噪音 ✅ |
| geo.region/ICBM meta | 正确地没有：会把全球站过度本地化到中国，Google 本就忽略 ✅ |
| Organization schema | 地址 CN 河北 Anping + `areaServed`（AU/US/UK/DE/CA/NZ）+ sameAs LinkedIn ✅ |
| LocalBusiness schema | 首页 + factory-audit 页，含 GeoCoordinates、营业时间 ✅ |
| Product 报价 | USD priceCurrency + FOB Tianjin/Shanghai + 15-25 天交期 ✅ |
| shipping/return schema（JS 注入） | US/AU/GB/DE/CA/NZ 目的地 + 30 天退换——Google 渲染后可见 |
| 联系/本地适配 | contact 页 NAP + WhatsApp(wa.me/8617832383339) + tel ✅ |
| GSC 国际定位 | sc-domain 域名级资源（2022 年后 Google 已下线国家定向工具，无需设置）✅ |
| CDN 分发 | Cloudflare anycast（实测 NRT 节点 HIT）✅ |

**可做的增量（P2，未做）**：核心市场落地内容（如 US/AU 合规、CE/UKCA 已有文章但无按市场聚合的入口页）；GBP（Google Business Profile）建档——`docs/gbp-wikidata-fill-pack.html` 已备料未执行。

---

## 四、SEO 排名与收录现状（线上 API 实测 10-28）

- **展示量未恢复**：10/16 基线「绝对零」之后，10/18~10/25 每天仅 0-1 次展示（gabion mattress 96 位、replace chain link fence 73 位等）；10/23 出现 1 个 position 1 词（how to keep deer out of your yard）
- **内容管线**：仍处暂停（9-30 起），cron 全部健康留痕
- **索引**：218（10-12 快照），守住 200 线；「已发现-尚未编入索引 8」是新信号
- **恢复主线不变**：等下一轮刷新 + 按 incident-20260924 §5.3 改造后恢复发文（周 1-2 篇、人工审核、选题双过滤）+ 站外权威建设（LinkedIn 启动包已备、made-in-china 已建档）

## 五、遗留 backlog（按优先级）

1. **P1** 8 篇 KV 文章 og:image 用各自 banner（`/images/banner/{slug}-hero.webp`）替代默认图——可在 seo-inject 里解析文章内首图，或 Admin SEO 后台逐页配 og_image
2. **P1** 恢复发文前置改造（incident §5.3：降频/人工门禁/双过滤/证据层/内链 98 页未互链）
3. **P2** 薄内容页加厚：woven-wire-mesh(238 词，money page 优先)、downloads(138)、case-studies(183)、三立柱页(~240)、glossary(259)、services(272)、industries(286)
4. **P2** 85 页 description 171-303 字符 → 批量压到 ≤160（CTR 优化，非排名因素，低风险可后置）
5. **P2** custom.html 与 service-custom-solutions.html description 前 90 字符重复
6. **P3** title 66-95 字符 55 页（含本次缩短后仍 >65 的）——SERP 会截断但主关键词在前，建议恢复期后再统一处理
7. **P3** GEO 基线复测（GEO_BASELINE_2026-09 为 0/10，原定双周复测，已过期）

---

*审计工具：本地扫描脚本（204 页 11 项检查 + sitemap/_redirects 交叉核对）· geo-playbook audit.js（线上五层）· 线上 API（gsc-status/keywords/rankings/cron/sitemap）*
