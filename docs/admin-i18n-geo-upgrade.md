# Admin 国际化 & GEO 板块升级记录

> **日期**: 2026-09-19(单日完成 P0/P1/P2 三阶段)
> **性质**: 改进全记录 + 经验总结,供后续回顾与同类工作复用
> **关联文档**: [GEO_PROGRESS.md](GEO_PROGRESS.md)(第五轮)、[GEO_OPTIMIZATION_REPORT.md](GEO_OPTIMIZATION_REPORT.md)
> **涉及板块**: Admin 管理台 → 国际化(`#/i18n`)、GEO 优化(`#/geo`),及 FAQ 管理(`#/faq`)联动

---

## 一、起点:改进前的状况评估

Admin 是**纯静态面板**(无真实服务端),`admin/js/api.js` 用 localStorage 模拟后端。两个板块当时处于"UI 骨架完成、数据链路未通"状态:

| 类别 | 问题 | 后果 |
|------|------|------|
| **A. 数据链路断裂** | i18n 翻译无任何消费者(`cms-sync.js` 只消费 faqs/blog_posts);GEO 问答与 FAQ 模块平行重复;Schema 模板无人消费;GEO 评分是假数据(URL 不存在 + `Math.random()` 且不落库) | 管理台录入对站点零影响,评分误导决策 |
| **B. 逻辑正确性** | robots 检测用正则抓"bot 名后第一个 Allow/Disallow",存在跨组错配和隐式放行误报;诊断历史只写 localStorage 从不展示;i18n/GEO 全部 innerHTML 裸插值(XSS);表格无空状态 | 检测结果不可信;安全隐患 |
| **C. 功能缺口** | i18n 硬编码 en/zh、无搜索/筛选/分页/导入导出/重复检测;基线 Prompt 固定 3 条且测试结果无处记录;llms.txt/sitemap/JSON-LD 等真实 GEO 资产无管理入口;GA4 ai_referral 无面板 | 管理台与站点真实 GEO 工作"两张皮" |

**关键反差**:站点真实的 GEO 建设其实很扎实(robots 8 爬虫 + Content-Signal、llms.txt、196 页静态 JSON-LD 569 块、GA4 ai_referral 事件、GSC 关联),但这些成果在 Admin 里完全没有体现。

---

## 二、总体方案与决策

**P0 方向决策:方案 A(采用)**——把两个板块定位为"**录入 → 导出/同步到静态站**"模式,复刻 cms-sync 之于 faqs 的既有模式;不接真后端(方案 B,Workers/D1),因为站点是纯静态架构,除非做多语言动态站否则不值得。

三阶段推进:

| 阶段 | 主题 | 核心交付 |
|------|------|---------|
| P0 | 数据链路打通 | GEO 问答并入 faqs 单一数据源;i18n 语言包导出;Schema 模板导出 + 保存校验;站点过滤中文条目 |
| P1 | 修正确性 | GEO 评分真实计算;robots 按规范分组解析;escapeHtml/safeUrl 全量转义;诊断历史可视化;空状态 |
| P2 | 功能补齐 | 基线验证 Tab(Prompt 管理 + AI 引用记录);全站 JSON-LD 校验;llms.txt/sitemap 查看器;i18n 搜索/筛选/分页/导入/动态语言 |

---

## 三、各阶段改动明细

### P0 — 数据链路打通

1. **GEO 问答并入 faqs 集合(单一数据源)**
   - `geo.js` GEO 问答 Tab 改读写 `/api/faq/all`;`priority` 字段统一为 FAQ 已有的 `sort_order`(语义等价,列表按它排序)
   - `api.js`:`/api/geo/questions` 路由改为 faqs **别名**(旧调用不断);faqs 种子并入原 2 条 GEO 问答(id 5/6)
   - **幂等迁移函数 `migrateLegacyGeoQuestions()`**:已播种的旧浏览器 localStorage 里的 `geo_questions` 按问题文本去重后并入 faqs,然后清空旧集合(种子有一次性守护 `seeded` 标记,老数据不会自动升级,必须显式迁移)
   - `api.js` 的 `update()` 本就是合并语义(`{...old, ...data}`),FAQ 页编辑不会丢 GEO 侧字段
2. **站点渲染过滤中文**:`js/cms-sync.js` 渲染条件从 `is_active !== false` 收紧为 `is_active !== false && f.language !== 'zh'`(站点英文单语,Admin 录入的中文条目不泄漏到 faq.html)
3. **i18n 语言包导出**:「导出 en.json / zh.json」——扁平 key→value 映射、仅启用条目,缺失/重复(取最后一条)/停用跳过在 toast 汇总;文件放置 `kestrel-site/js/locales/`(多语言上线前作翻译资产管理)
4. **Schema 模板导出 + 校验**:导出含占位符自动提取(`{placeholder}` 正则)和 jsonld 预解析,非法模板标记 `parse_error`;保存时强制 `JSON.parse` 校验;目标位置 `perf-scripts/geo-schema-templates.json`(static-jsonld.js 目前从 HTML 内容抽取 schema,**未硬改生成器**,导出文件作为后续类型扩展的备用输入)
5. `admin.css` 补 `.toast.warning` 样式

### P1 — 修正确性

1. **GEO 评分真实计算**(替代随机数)
   - 「🔍 从 sitemap 拉取并全站评分」:解析 sitemap.xml → **统一取 pathname 在本域抓取**(sitemap 的 `<loc>` 是生产域名)→ 分批并发(8/批)逐页抓 HTML
   - 评分模型:**JSON-LD 类型覆盖 40%**(解析块数 + 相关类型覆盖,解析失败降级)+ **可引用结构 30%**(meta description 15 / 自闭环定义句 30 / 标题层级 20 / FAQ 区块 15 / canonical 10 / 列表 10)+ **事实密度 30%**(带单位数字每千字符 × 25,封顶 100)
   - `api.js` geo_scores 路由:删除随机 generate,新增 **POST upsert**(按 page_url,四个分项 0-100 校验)+ DELETE;`migrateLegacyGeoScores()` 一次性清空旧假数据
   - 评分表低分置顶、显示评分时间;单页「重新评分」走同一真实计算
2. **robots.txt 按规范分组解析**(`checkRobotsBots`):连续 user-agent 行合并同组;bot 未显式列出时回落 `*` 组;判定"Disallow: /"整站禁止;诊断详情逐 bot 输出来源(显式组 / `*` 组回落)
3. **XSS 防护**:`api.js` 新增 `API.escapeHtml` 与 `API.safeUrl`(仅放行 http(s) 与站内相对路径,防 `javascript:` 注入);i18n/GEO 全部插值统一转义;**动作按钮改索引传参**(`editGeoQuestion(${idx})`),不再把字符串拼进 onclick
4. **诊断历史可视化**:`renderAuditHistory()` 把 localStorage 滚动基线(12 次)渲染为表格(时间/通过/警告/失败/需关注项),打开 GEO 页即渲染,每次诊断后刷新
5. 四表(i18n/GEO 问答/Schema 模板/GEO 评分)空数据引导提示(`emptyRow` 助手)

### P2 — 功能补齐

1. **基线验证 Tab(新)**——GEO「效果验证」模块(原 0%)的落地工具
   - 基线 Prompt 增删(`km_geo_prompts`,默认 3 条采购问题);逐条记录 AI 引用测试结果(`km_geo_citations`:引擎/是否引用/引用位置/日期/备注)
   - 按引擎汇总引用率(如 "ChatGPT: 0/1 引用 / Perplexity: 1/1 引用")
   - 诊断报告的基线块改为动态读取 Prompt 列表 + 「前往基线验证 →」跳转
2. **全站 JSON-LD 校验**:抓取 sitemap 全部页面,统计无 Schema 页面 / JSON 解析失败页 / `@type` 分布
3. **llms.txt 查看/编辑器**:行数/章节/FAQ 统计 + textarea 编辑 + 下载替换站点根文件
4. **sitemap 查看器**:全量 URL 列表 + 关键字过滤
5. **i18n 功能补齐**(页面整体重写)
   - 搜索(key+译文)/ 按模块筛选 / 只看缺失 / 分页(20 条每页)
   - **语言列表数据驱动**(`km_i18n_langs`):「+ 添加语言」即时扩展表格列/导出按钮/表单字段/导入下拉(实测添加 es)
   - JSON 导入:选目标语言 + `{key: 译文}` 扁平映射,同名覆盖、新 key 归 `import` 模块
   - 录入校验:key 重复提示(非阻断 confirm)、命名规范提醒(`nav.products` 风格)、module 改 datalist
6. FAQ 管理页补与 GEO 问答共享数据源的互指提示

---

## 四、验证记录(本地服务 + 浏览器实测)

启动方式:`cd kestrel-site && python3 -m http.server 8901`,Admin 登录 admin/admin123(mock)。

| 验证项 | 结果 |
|--------|------|
| 全站评分 | 198 页 100% 成功;分布 高 32 / 中 93 / 低 73;低分置顶 |
| JSON-LD 校验 | 无 Schema 页 0;解析失败 0;分布 Organization×198 / BreadcrumbList×197 / Product×88 / Article×60 / FAQPage×23 / Service×6 / LocalBusiness×2 / WebSite×1(与 GEO_PROGRESS 文档记录吻合) |
| robots 检测 | 6/6 AI 爬虫放行,逐 bot 输出"显式组"判定 |
| XSS 实测 | 注入 `<img src=x onerror=...>` / `<script>`:全部渲染为纯文本,onerror 未触发 |
| i18n | 搜索筛选正确;缺失筛选空态正确;导入覆盖+新建正确;添加 es 即时生效;导出 en.json 内容为 5 条正确扁平映射 |
| 基线验证 | 添加第 4 条 Prompt + 记录 2 条结果,汇总 "ChatGPT: 0/1 / Perplexity: 1/1" 正确,弹窗正常关闭 |
| llms/sitemap 查看器 | llms.txt 73 行/6 章节/6 FAQ;sitemap 198 URL,过滤 "razor" 出 14 条 |
| 数据同源 | `/api/geo/questions` POST 实测落入 faqs;FAQ 管理页同步可见(6 条) |
| 每轮测试后 | 测试数据均清理(repair/import 测试值/临时 Prompt/引用记录) |

---

## 五、实施中踩的坑(重点经验)

均为真实发生、当场修复的问题:

1. **API 路径与请求体不一致**:geo_scores POST 路由最初设计为从 URL 路径取 `page_url`,而客户端放在 body 里 → 全站评分 197 条全部失败。**教训:前后端(mock 也算)接口契约先写清楚;失败信息要能直接暴露原因**(后来给批量评分加了 `firstErr` 上报)。
2. **外域 URL 直接 fetch**:sitemap 的 `<loc>` 是生产域名,最初只剥离同域前缀,非同域 URL 原样保留 → 全部按外域抓取失败。**教训:外部数据里的 URL 一律 `new URL(l, location.origin).pathname` 归一化,不要用字符串前缀判断**。
3. **DOM 依赖的初始化时机**:citationForm 的 submit 监听器注册在 `container.innerHTML` 渲染**之前** → 元素不存在,整个 GEO 路由抛 `Cannot read properties of null (reading 'addEventListener')` 页面挂掉。**教训:Admin 页面模式固定为"先 innerHTML 渲染,后 addEventListener;所有 getElementById 调用必须位于渲染之后"**。
4. **种子守护导致老数据不升级**:`seeded` 一次性标记意味着改种子对老浏览器无效。**教训:mock 数据结构变更要配幂等迁移函数**(geo_questions 并入 faqs、geo_scores 假数据清空都是这个模式:检查→迁移→清空旧集合)。
5. **测试脚本自身的问题**(非项目代码):evaluate 里 `const API = window.__API || API` 自引用触发 TDZ;IAB 内核刷新后 `window.__API` 丢失。**对策:每格先 `window.__API = API` 挂载,引用统一走 `window.__API`**。

---

## 六、方法论沉淀

1. **先修数据链路,再加功能**。装饰性 UI(录入后无任何效果)比缺功能危害更大——它制造"已管理"的错觉。方案 A 的本质:让 Admin 的每一次录入都有明确的去向(站点渲染 or 导出文件)。
2. **单一数据源消灭双录漂移**。GEO 问答与 FAQ 合并时选择"别名到同一集合"而非"加同步按钮",从结构上杜绝两处数据不一致。
3. **假数据不如没有数据**。随机评分会误导优化决策;删除假种子 + 显式迁移 + 真实计算,三者缺一不可。
4. **统一转义入口**。`API.escapeHtml` / `API.safeUrl` 集中在 api.js,比各页自写可靠;按钮传索引而不是拼接参数,顺带消除一类注入面。
5. **缓存治理**。改动 JS 后同步 bump `?v=YYYYMMDD(-n)`(admin/index.html 与 faq.html),避免线上缓存吃掉新代码。
6. **用站点真实资产做验证锚点**。JSON-LD 类型分布与 GEO_PROGRESS 文档记录对上了,才敢说校验器是对的——工具输出要能和已知事实交叉印证。
7. **诚实标注边界**。GA4 ai_referral 面板需要 OAuth/后端,纯静态 Admin 做不了,明确延后而不是硬做一个假面板。

---

## 七、遗留事项与触发条件

| 事项 | 触发条件 |
|------|---------|
| ai_referral 数据面板 | 接入真后端或 OAuth 代理后,在分析板块加 Tab 拉 GA4 Data API |
| i18n 语言包接入构建流程 | 决定做多语言站点时(P3):导出 en/zh.json → 构建期注入双语页 + hreflang + 分语言 sitemap |
| Schema 模板接入生成器 | static-jsonld.js 需要自定义类型扩展时,读取 `perf-scripts/geo-schema-templates.json` |
| 诊断基线历史升级 | 需要跨设备/长期留存时,从 localStorage 升级为可导出或后端存储 |

---

## 八、改动文件清单

| 文件 | 改动 |
|------|------|
| `admin/js/api.js` | escapeHtml/safeUrl 助手;faqs 种子并入 GEO 问答;geo_questions/geo_scores 幂等迁移;geo/questions 别名 faqs;geo_scores POST upsert + DELETE;移除随机评分 |
| `admin/js/pages/geo.js` | 问答改读写 faqs;真实评分引擎;robots 分组解析;诊断历史;基线验证 Tab;JSON-LD 校验;llms/sitemap 查看器;全量转义 + 索引传参 + 空状态 |
| `admin/js/pages/i18n.js` | 整体重写:动态语言/搜索/筛选/分页/导入/导出/录入校验/转义 |
| `admin/js/pages/faq.js` | 共享数据源提示 |
| `admin/css/admin.css` | `.toast.warning` |
| `admin/index.html` | 脚本版本号 `?v=20260919-6` |
| `js/cms-sync.js` + `faq.html` | 过滤 zh 条目 + 版本号 |
| `docs/GEO_PROGRESS.md` | 第五轮记录 + 更新日志 |

### 维护速查

- **打开 Admin**:本地起静态服务(如 `python3 -m http.server 8901`)→ `/admin/` → admin / admin123
- **数据位置**(均为 localStorage,按浏览器隔离):管理台数据 `km_admin_*`;GEO 基线/诊断 `km_geo_*`;i18n 语言列表 `km_i18n_langs`
- **重置数据**:清空对应 localStorage 键后刷新即可重新播种
- **缓存**:改动 admin 下 JS/CSS 后,记得 bump `admin/index.html` 里的 `?v=` 参数
