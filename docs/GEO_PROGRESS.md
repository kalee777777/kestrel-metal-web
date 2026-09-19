# KESTREL METAL GEO 优化进度文档

> **文档性质**: 滚动更新（活文档），每次 GEO 相关工作完成后更新本文件
> **创建日期**: 2026-08-30
> **最后更新**: 2026-09-19
> **定位**: GEO 工作进度总览与维护入口。单轮工作的详细实施与验证记录见《GEO 优化报告》，本文件回答"现在到哪了、接下来做什么"

---

## 一、当前状态总览

GEO 建设按"开门 → 自我介绍 → 让 AI 敢引用 → 知道谁来 → 证明我是我"五层推进，当前完成度：

| # | 模块 | 状态 | 完成度 | 说明 |
|---|------|------|--------|------|
| 1 | AI 抓取入口（开门） | ✅ 完成 | 100% | robots.txt 放行 8 个 AI 爬虫 + Cloudflare 边缘层配置 |
| 2 | 内容可引用性（自我介绍） | ✅ 完成 | 100% | llms.txt + 5 篇 GEO 磁铁博客 + 5 个产品页定义句 |
| 3 | 结构化数据（让 AI 敢引用） | ✅ 完成 | 100% | 静态 JSON-LD 全站覆盖 + 运行时补充 + 类型识别修复 |
| 4 | 数据追踪闭环（知道谁来） | ✅ 完成 | 100% | GA4/Umami AI Referral 事件 + GSC 关联 |
| 5 | 站外实体（证明我是我） | 🔄 进行中 | 55% | LinkedIn 已上线并回加 sameAs；Europages/Thomasnet/GBP 待建 |
| 6 | 效果验证（GEO 基线测试） | ⏳ 未开始 | 0% | 基线 Prompt 待人工测试，需 AI 引擎收录积累 |

---

## 二、进度时间线

### 第一轮：2026-08-21 — GEO 基础建设（✅ 已完成）

- robots.txt 增加 `Content-Signal` + 8 个 AI 爬虫显式 Allow
- 部署 llms.txt（产品线 / Proof Points / 对比数据 / 合规 / FAQ）
- seo-enhance.js 增强 Organization（knowsAbout/areaServed）与 Product（交易事实）Schema
- 5 个核心产品页段首重写为自闭环定义句
- 5 篇 GEO 磁铁博客 + factory-audit.html 上线
- Cloudflare 边缘层：AI Crawlers（Search/Agent=Allow）、robots.txt 管理 Disable
- 全量部署并线上验证

📄 详细记录与验证数据：[GEO_OPTIMIZATION_REPORT.md](GEO_OPTIMIZATION_REPORT.md)

### 第二轮：2026-08-27 ~ 08-30 — 审计修复与数据闭环（✅ 已完成）

**P0/P1 — sitemap 与 Schema 类型修复**
- sitemap.xml 从 190 条补齐至 196 条（6 个 GEO 页面补录）
- seo-enhance.js 页面类型识别修复：`blog-`/`case-study-` → Article；`download-`/`industry-` 排除 Product；产品关键词补入 `chain-link`/`gabion`/`acc-`/`galvaniz`/`coated`
- Article 假日期修复：移除 `2024-01-01` 兜底，仅在有真实日期时写入 `datePublished`
- 新增 `hasJsonLdType()` 去重守卫：HTML 已有静态 schema 时运行时 JS 不再重复注入

**P2 — 静态化与 URL 规范化**
- 新建 `perf-scripts/static-jsonld.js` 生成器：196 个 HTML 静态注入 JSON-LD（含 FAQPage 23 个、Organization 补 1 个），全站 569 个 JSON-LD 块解析通过
- canonical 统一为 `.html` 形态（首页为 `/`），与 sitemap 一致
- 新建 `_redirects`：195 条无扩展名 → `.html` 的 301 重定向

**P2-3 — 数据追踪与站外实体**
- `js/analytics-loader.js` 新增 AI Referral 自动标记：15 个 AI 域名识别，GA4 + Umami 双通道发送 `ai_referral` 事件，`sessionStorage` 会话去重
- GA4 创建自定义维度：`AI Referral Source`（ai_referral_source）、`AI Referral Page`（ai_referral_page）
- GA4 ↔ Search Console 关联成功（2026-08-30 确认，域 kestrelmetal.com，数据流 ID 15448281340）
- 清理无效 `sameAs` 外链（LinkedIn/YouTube/Facebook 档案均不存在），全站删除 197 处死链

### 第三轮：2026-08-30 — 实体一致性统一（✅ 本轮完成）

- 3 个证书下载页 + `js/downloads.js` 公司全称统一为 **Kestrel Metal Products Co., Ltd.**（全站 `Industrial Co., Ltd.` 残留 0 处，规范名 21 处 / 10 文件一致）
- llms.txt 新增 `## Company Identity` 段：品牌名 ↔ 英文法律全称 ↔ 中文全称（安平县凯瑞尔金属制品有限公司）三者关联
- Git commit `e2b2dd4`，已推送 Gitee（部署源）+ GitHub（镜像）

### 第五轮：2026-09-19 — Admin GEO/国际化板块数据链路打通（✅ 本轮完成）

> 定位：Admin 两板块从"孤立录入 UI"改造为"录入 → 导出/同步到静态站"模式（方案 A）
> 📄 完整改进记录与经验总结：[admin-i18n-geo-upgrade.md](admin-i18n-geo-upgrade.md)

- **GEO 问答并入 faqs 集合（单一数据源）**：Admin「GEO 优化 → GEO 问答」与「FAQ 管理」共享同一数据，`/api/geo/questions` 路由改为 faqs 别名；旧 `geo_questions` 存量经幂等迁移并入 faqs（按问题文本去重）；表单 `priority` 字段统一为 `sort_order`
- **站点渲染同步收紧**：`js/cms-sync.js` 过滤 `language=zh` 条目（站点英文单语，中文条目不再泄漏到 faq.html），faq.html 引用加 `?v=20260919`
- **i18n 语言包导出**：Admin「国际化管理」新增「导出 en.json / zh.json」——扁平 key→value、仅启用条目，缺失/重复在 toast 汇总；导出文件放置 `kestrel-site/js/locales/`（站点多语言上线前作翻译资产管理）
- **Schema 模板导出 + 校验**：「GEO 优化 → Schema 模板」新增「导出模板 JSON」（含占位符提取 + jsonld 预解析，非法 JSON 标记 parse_error），目标位置 `perf-scripts/geo-schema-templates.json` 作为 static-jsonld.js 后续类型扩展输入；保存时强制 JSON.parse 校验
- **验证**：本地冒烟测试通过——i18n 导出内容正确、GEO 问答经别名 API 写入 faqs、前台 faq.html 渲染合并条目且 zh 条目被过滤、模板非法 JSON 拦截生效、GEO 诊断 5 项全过
- **P1 修正（同日完成）**：
  - **GEO 评分改真实计算**：替代原随机数——「从 sitemap 拉取并全站评分」解析 sitemap.xml（生产域名统一取 pathname 本域抓取），逐页分析 JSON-LD 类型覆盖（权重 40%）、可引用结构（定义句/meta/标题层级/FAQ/列表，30%）、事实密度（带单位数字/千字符，30%），经 `/api/geo/scores` POST upsert 落库（0-100 校验），低分置顶；全站 198 页实测 100% 成功（高 32 / 中 93 / 低 73）；旧随机假数据一次性迁移清空
  - **robots.txt 解析按规范重写**：按 user-agent 分组解析（连续 UA 行合并同组），bot 未显式列出时回落 `*` 组判定，消除旧正则跨组错配/隐式放行误报；诊断详情逐 bot 输出判定来源（显式组 / `*` 组回落）
  - **XSS 防护**：`api.js` 新增 `API.escapeHtml` / `API.safeUrl`（http(s) + 站内相对路径白名单），i18n/GEO 两页全部 innerHTML 插值统一转义，动作按钮改索引传参（实测 `<img onerror>` / `<script>` 注入均被转义）
  - **诊断历史可视化**：每次诊断结果存 localStorage 滚动基线（12 次），GEO 诊断 Tab 新增历史表格（时间/通过/警告/失败/需关注项）
  - **空状态**：i18n / GEO 问答 / Schema 模板 / GEO 评分四表空数据时显示引导提示
- **P2 补齐（同日完成）**：
  - **基线验证 Tab（新）**：GEO「效果验证」模块（模块 6，原 0%）的落地工具——基线 Prompt 可增删（默认 3 条采购问题存 localStorage）、逐条记录 AI 引用测试结果（引擎 / 是否引用 kestrelmetal.com / 引用位置 / 日期 / 备注）、按引擎汇总引用率；诊断报告的基线块改为动态读取 Prompt 列表 + 一键跳转
  - **全站 JSON-LD 校验**：诊断 Tab 新增按钮，抓取 sitemap 全部页面解析 JSON-LD——实测 198 页全部有 Schema、0 解析失败，类型分布 Organization×198 / BreadcrumbList×197 / Product×88 / Article×60 / FAQPage×23 等，与线上实际一致
  - **llms.txt 查看 / 编辑**：诊断 Tab 新增查看器（行数 / 章节 / FAQ 统计 + 可编辑 + 下载替换站点根文件）
  - **sitemap 查看器**：198 个 URL 列表 + 关键字过滤（实测 razor 过滤出 14 条）
  - **i18n 板块功能补齐**：搜索 / 按模块筛选 / 只看缺失 / 分页（20 条每页）；key 重复检测与命名规范提醒（非阻断确认）；module 改 datalist 约束；JSON 语言包导入（覆盖同名 key、新 key 归 import 模块）；语言列表数据驱动（「+ 添加语言」即时扩展表格列 / 导出按钮 / 表单字段，实测添加 es）
  - **FAQ 管理页**补共享数据源提示（与 GEO 问答互指）
  - **延后项**：GA4 ai_referral 数据面板需 OAuth / 后端凭据，纯静态 Admin 无法落地，待接真后端时一并实现
- 待办:统一记入 [BACKLOG.md](BACKLOG.md)(项目待办总表,唯一事实源)

---

## 三、模块状态明细

### 3.1 AI 抓取入口 ✅

| 项 | 状态 | 验证方式 |
|----|------|---------|
| robots.txt 8 个 AI 爬虫 Allow + Content-Signal | ✅ | `curl /robots.txt`；Admin GEO 诊断 |
| Cloudflare AI Crawlers（Search/Agent=Allow, Training=Block on ads） | ✅ | 控制台配置 + curl 模拟 UA |
| Cloudflare robots.txt 管理已 Disable（防覆盖） | ✅ | 线上内容与本地文件一致 |

### 3.2 内容可引用性 ✅

| 项 | 状态 |
|----|------|
| llms.txt（含 Company Identity 实体关联段） | ✅ |
| 5 篇 GEO 磁铁博客（对比 / 合规 / 剃刀网 / 太阳能 / HS 编码） | ✅ |
| 5 个核心产品页自闭环定义句 | ✅ |
| factory-audit.html 工厂审计页 | ✅ |
| sitemap.xml 196 条，与实际页面一一对应 | ✅ |

### 3.3 结构化数据 ✅

| 项 | 状态 |
|----|------|
| 静态 JSON-LD 写入 196 个 HTML 原始文件 | ✅ |
| 运行时 seo-enhance.js 仅补缺，不重复（hasJsonLdType 守卫） | ✅ |
| 页面类型识别：博客→Article、产品→Product、下载/行业→website、服务→Service | ✅ |
| Article 假日期已修复，FAQPage 23 个 | ✅ |
| 569 个 JSON-LD 块全部解析通过 | ✅ |

### 3.4 URL 规范化 ✅

| 项 | 状态 |
|----|------|
| canonical 统一 `.html`（首页 `/`） | ✅ |
| sitemap / canonical / 301 三者一致 | ✅ |
| `_redirects` 195 条无扩展名 301 | ✅ |

### 3.5 数据追踪闭环 ✅

| 项 | 状态 |
|----|------|
| `ai_referral` 事件（GA4 + Umami 双发，sessionStorage 去重） | ✅ |
| GA4 自定义维度 2 个已创建 | ✅ |
| GA4 ↔ GSC 关联 | ✅（2026-08-30） |
| `ai_referral` 数据核验 | ⏳ 待流量积累后检查 |

### 3.6 站外实体 🔄 进行中

| 平台 | 状态 | 说明 |
|------|------|------|
| LinkedIn 公司页 | ✅ 已上线 2026-08-30 | `linkedin.com/company/kestrelmetal`，页面名 Kestrel Metal Products Co., Ltd. |
| sameAs 回加 | ✅ 2026-08-30 | LinkedIn 链接写入 196 文件 198 个 schema 块（HTML 静态 + 生成器 + 运行时三层）；llms.txt 同步补 LinkedIn 行 |
| Europages / Thomasnet | ⏳ 待执行 | 按指南操作 |
| Google Business Profile | ⏳ 待执行 | 按指南操作 |
| YouTube / Wikidata | ⏳ 待执行 | 可选优先级 |

📄 操作指南：[EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md](EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md)

---

## 四、待办事项（按优先级）

| 优先级 | 事项 | 前置条件 | 说明 |
|--------|------|---------|------|
| 高 | 验证 `e2b2dd4` 部署生效 | Cloudflare Pages 构建完成 | 抽验线上证书页名称与 llms.txt Company Identity 段 |
| 高 | LinkedIn 页面内容完善 | 无 | 补 Logo / About / 网站 / 产品页 / 行业与规模，按对齐指南执行 |
| 高 | GA4 `ai_referral` 数据核验 | 流量积累（约 1-2 周） | Reports → Engagement → Events，或 Explore 建报告 |
| 中 | Europages / Thomasnet / GBP 档案 | 无 | 按对齐指南逐步执行；上线后用 `add-sameas.py` 追加 sameAs |
| 中 | GEO 基线 Prompt 测试 | 无（可立即做） | 3 条 Prompt 在 Perplexity / ChatGPT 中人工测试，建议每两周复测 |
| 低 | YouTube / Wikidata 档案 | 有内容素材后 | 可选 |

**GEO 基线测试 Prompt**（记录品牌提及率与链接引用率）：

1. Recommend a China wire mesh fence manufacturer with NATO-22 razor wire and 500MW solar farm project experience
2. 3D wire panel fence vs chain link for Australian solar perimeter, who supplies both?
3. Galvanized vs PVC coated chain link fence in saltwater, which China factory has comparison data?

---

## 五、维护指南

### 5.1 例行检查

| 频率 | 动作 | 工具/入口 |
|------|------|----------|
| 每两周 | GEO 基线 Prompt 复测，记录提及/引用 | Perplexity / ChatGPT（Search Enabled） |
| 每两周 | Admin GEO 诊断 5 项检查 | 管理后台 → GEO → GEO 诊断 Tab（检查 robots / llms / sitemap，支持导出 JSON） |
| 每月 | 检查 `ai_referral` 事件量与来源分布 | GA4 → Engagement → Events；Explore 建 AI Referral 报告 |
| 每月 | GSC 索引量与 AI 流量趋势 | Search Console（已与 GA4 关联） |
| 新增页面时 | 确认 JSON-LD 与 sitemap | 见 5.2 |

### 5.2 新增/修改页面时的 GEO 检查清单

1. 文件名决定 Schema 分类：`blog-`/`case-study-` → Article；产品关键词 → Product；`service-` → Service；`download-`/`industry-` → website
2. 若页面自带静态 JSON-LD，运行时 JS 不会重复注入（无需处理）；若依赖运行时注入，确认 `js/seo-enhance.js` 分类关键词覆盖
3. **修改 Schema 结构时需同步三处**：`perf-scripts/static-jsonld.js`（静态层）、`js/seo-enhance.js`（运行时层）、存量 HTML（重跑生成器）
4. 新页面加入 `sitemap.xml`（现 196 条），确认 canonical 为 `.html` 形态
5. 全站公司名使用规范：品牌名 **Kestrel Metal**（Schema `name` 字段），法律全称 **Kestrel Metal Products Co., Ltd.**（正文/法务/证书），中文 **安平县凯瑞尔金属制品有限公司**（实体关联场景）

### 5.3 关键配置速查

| 项 | 值 |
|----|-----|
| GA4 Measurement ID | `G-Q5WHY8L8BN` |
| GA4 数据流 ID | 15448281340 |
| Umami Website ID | `a7ba74c4-ee31-414b-8a9c-2fa239ae7557` |
| AI Referral 域名表 | `js/analytics-loader.js` → `AI_REFERRER_HOSTS`（15 个） |
| 部署链路 | git push → Gitee origin（主）/ GitHub（镜像）→ Cloudflare Pages 自动构建 |

---

## 六、相关文档索引

| 文档 | 性质 | 用途 |
|------|------|------|
| [GEO_OPTIMIZATION_REPORT.md](GEO_OPTIMIZATION_REPORT.md) | 历史报告（2026-08-21） | 第一轮建设的完整实施与验证记录 |
| [EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md](EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md) | 操作指南 | 站外档案创建的逐平台步骤与标准实体信息 |
| [LINKEDIN_CONTENT_PLAN.md](LINKEDIN_CONTENT_PLAN.md) | 运营方案 | LinkedIn 页面完善清单、内容发布计划、维护节奏与 GEO 联动 |
| [GA4_AI_REFERRAL_MONITORING_GUIDE.md](GA4_AI_REFERRAL_MONITORING_GUIDE.md) | 配置指南 | GA4 AI Referral 报告 / 仪表板 / 告警 / 受众配置 |
| [operations-checklist.md](operations-checklist.md) | 运维清单 | 全站日常运维（含 SEO 例行项） |
| [issue-log.md](issue-log.md) | 问题日志 | 故障与问题记录 |

---

## 七、更新记录

| 日期 | 更新内容 |
|------|---------|
| 2026-08-30 | 创建本进度文档；收录三轮工作（08-21 基础建设 / 08-27~30 审计修复与数据闭环 / 08-30 实体一致性），梳理待办与维护指南 |
| 2026-08-30 | 第四轮：LinkedIn 上线（kestrelmetal 别名）+ sameAs 三层回加（196 文件 198 块）+ llms.txt 补 LinkedIn 行 |
| 2026-09-19 | 第五轮：Admin GEO 板块数据链路打通——GEO 问答并入 faqs 单一数据源（含幂等迁移）、cms-sync 过滤 zh 条目、i18n 语言包导出（en/zh.json）、Schema 模板导出 + JSON 保存校验；P1 修正同日完成——GEO 评分真实计算（198 页全站实测）、robots 分组解析、escapeHtml/safeUrl 全量转义、诊断历史可视化、四表空状态；P2 补齐同日完成——基线验证 Tab（Prompt 管理 + AI 引用记录，落地模块 6）、全站 JSON-LD 校验、llms.txt/sitemap 查看器、i18n 搜索筛选分页/导入/动态语言 |
