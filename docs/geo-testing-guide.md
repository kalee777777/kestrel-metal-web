# GEO 测试与完善操作手册

> **创建**: 2026-09-21
> **适用**: 当前阶段的四项测试(部署验证 / 基线测试 / GSC 收录 / GA4 首查)+ 月度循环
> **对应待办**: BACKLOG 的 GEO-01 / GEO-03 / SITE 部署验证;结果记录进 Admin「GEO 优化 → 基线验证」

---

## A. 部署后线上验证(15 分钟,先做)

> 触发条件:仓库最新提交(`f4c0093`)部署到生产后。若 Gitee 是推送即自动部署,现在就能测。

| # | 测试 | 操作 | 通过标准 |
|---|------|------|---------|
| A1 | 内链卡片上线 | 打开 `kestrelmetal.com/blog-news.html`,Ctrl+F 搜 "358 Fence" | 能搜到;Product Information 分类下有新卡片;各分类计数徽章为 14/11/22 |
| A2 | 文章互链上线 | 打开 `kestrelmetal.com/gabion-boxes-supplier-your-b2b-sourcing-guide.html`,拉到正文底部 | 有 "Related Guides" 区块,含 2-3 个链接可点击 |
| A3 | og 修复 | 查看网页源代码(Ctrl+U),搜 `og:image` | 14 篇每篇都有;特别验证 `galvanized-chain-link-fence-the-b2b-buyer-s-guide.html`(之前被工作流覆盖的那篇) |
| A4 | sitemap | 打开 `kestrelmetal.com/sitemap.xml` | 搜 "358-fence" 和 "top-10-wired" 都在;总数 212 |
| A5 | 产品页入口 | 打开 `kestrelmetal.com/welded-gabion-galvanized.html` 拉到底部 | 有 "Related Buying Guides" 块 |

任一项失败 → 告诉我具体哪项,我来排查(大概率是部署没跑或部署了旧版本)。

## B. GEO-01 首轮基线测试(60-90 分钟,核心!)

> 目的:拿到**第一份 AI 引用率基线**。现在的引用率低是正常且预期的,这轮的意义是建立对照起点。

### 准备

- 测试环境:ChatGPT(联网模式)、Perplexity、Gemini 三个引擎(条件不允许就前两个)
- 每条 Prompt 用**新对话**测试(避免上下文污染)
- 录入工具:打开 Admin(`kestrelmetal.com/admin/`,admin/admin123)→ GEO 优化 → 基线验证

### 操作循环(每条 Prompt 重复)

1. 复制 Prompt 到引擎,等待完整回答
2. 检查回答里是否出现 `kestrelmetal.com`(链接或文字提及都算)
3. 记录:是否引用(是/否)、引用位置(第几个来源)、回答里引用了**谁的**内容(竞品/目录站/维基)
4. Admin → 基线验证 → 该 Prompt 行点「记录结果」→ 填引擎/是否引用/位置/日期/备注(备注记竞品名,价值很高)

### 10 条测试 Prompt(直接复制)

**推荐类(P1-P3):**

| # | Prompt | 我们的对应资产 |
|---|--------|--------------|
| P1 | Recommend a China wire mesh fence manufacturer with NATO-22 razor wire and 500MW solar farm project experience | llms.txt Proof Points + razor-wire-guide 文章 |
| P2 | Which Chinese gabion manufacturer has CE marking (EN 10223) and can supply 2x1x1m double-twist gabion boxes FOB Tianjin? | llms.txt 合规段 + gabion 3 篇指南 |
| P3 | I need a security fencing supplier in Anping, Hebei with ISO 9001 and 3000+ tons monthly capacity — any recommendations? | llms.txt Company Identity |

**对比类(P4-P7,AI 最爱引用的内容类型):**

| # | Prompt | 我们的对应资产 |
|---|--------|--------------|
| P4 | 3D wire panel fence vs chain link for Australian solar farm perimeter — which is better, and who supplies both? | llms.txt 对比段 + install-3d-panel 文章 |
| P5 | Galvanized vs PVC coated chain link fence for saltwater coastal environment — which China factory publishes comparison data? | blog-galvanized-vs-pvc + galvanized 3 篇 |
| P6 | Welded vs woven wire mesh for gabion boxes: strength and installation differences? | llms.txt FAQ 第 3 条 |
| P7 | NATO-22 vs ASTM razor wire specifications — what are the differences, and who manufactures to NATO-22? | llms.txt 对比段 |

**合规/事实类(P8-P10):**

| # | Prompt | 我们的对应资产 |
|---|--------|--------------|
| P8 | What HS code applies to galvanized welded wire mesh exported from China? | llms.txt 合规段(731441/731442) |
| P9 | CE vs UKCA marking requirements for wire mesh fence exports to Europe — which Chinese suppliers are compliant? | blog-ce-ukca-reach 文章 |
| P10 | What is a typical MOQ and lead time for fence panel orders from Chinese manufacturers? | llms.txt Proof Points(100 panels / 15-25 天) |

> P1-P3/P10 先在 Prompt 输入框加入基线列表(默认 3 条可删,建议保留 P1/P4/P5 + 新增其余)。Admin 基线验证页支持自由增删,以本表 10 条为准录全。

### 结果解读(测完看)

| 现象 | 含义 | 下一步 |
|------|------|--------|
| 0/10 引用 | 正常(基线期,内容刚上线) | 走 C 步推收录,下月复测 |
| 引用了竞品/目录站 | 关键信号:该主题 AI 有需求但选了别人 | 记录竞品名 → 该主题内容加强(深度/数据) |
| 引用了我们但没链接 | 内容被采信,署名不足 | 检查该页定义句/llms.txt 是否含品牌名 |
| 3+/10 引用 | 超预期 | 记录哪类 Prompt 命中,加大该主题内容 |

## C. GSC 收录推送(15 分钟,加快 AI 抓取)

> 逻辑:ChatGPT/Perplexity 的检索源很大程度依赖 Bing/Google 索引,先让搜索引擎收录,AI 才有料可引。

1. 打开 [search.google.com/search-console](https://search.google.com/search-console)(用绑定的 Google 账号,资源已验证 kestrelmetal.com)
2. 顶部「网址检查」逐个粘贴 14 篇新文章 URL → 「请求编入索引」
3. 优先级(参考 `docs/gsc-indexing-new-articles.md` 的做法):
   - **第一波(高价值)**:top-10-wire-mesh-manufacturers-china-comprehensive-guide、top-10-welded-wire-mesh-manufacturers-china-2024-updated、razor-wire-guide、358-fence、install-3d-panel-fence
   - **第二波**:galvanized 系列 3 篇 + galvanized-wire 2 篇
   - **第三波**:gabion 系列 3 篇 + cattle-fence-roll
4. 顺带:网址检查输入 `blog-news.html` → 确认新卡片版本被抓(可点"查看已抓取的网页"验证)

## D. GA4 ai_referral 首查(10 分钟)

1. 打开 [analytics.google.com](https://analytics.google.com) → 选 kestrelmetal 数据流
2. 「报告」→「互动度/流量获取」,或「探索」新建自由形式探索
3. 维度加 **AI Referral Source** / **AI Referral Page**(自定义维度,已建),指标看「事件数」筛选 `ai_referral`
4. 通过标准:能看到事件名和维度配置无报错。**当前大概率是 0 事件——正常**,部署确认的是"追踪管道通",数据等 AI 引用发生
5. 若维度报错/事件不存在 → 告诉我,我查 analytics-loader.js 加载状态

## E. 月度循环(固化流程,每轮 ~2 小时)

```
1. 管理台 GEO 诊断 → 运行,5 项全绿?(robots/llms/sitemap/信号)
2. 管理台 JSON-LD 校验 → 全站 0 失败?
3. 管理台 GEO 评分 → 全站评分 → 对比上月平均分
4. 基线 10 条 Prompt 复测 → 记录 → 对比上月引用率
5. GA4 ai_referral → 记录会话数
6. 低分页 Top5 补内容 → 更新 llms.txt(如有新事实)
7. 工作流若又发了新文章 → 告诉 AI 跑回收脚本
```

结果全部记在 Admin 基线验证 Tab(自动汇总引用率)+ BACKLOG 完成区。

---

## 测完后的"完善"触发器

| 测试发现 | 对应完善动作(BACKLOG) |
|---------|----------------------|
| 对比类 Prompt 被竞品引用 | GEO-06 对比内容按关键词簇加强 |
| 引用率整体低 + 收录慢 | 先做 ENT-01/02(目录平台外链引蜘蛛) |
| GA4 看到 ai_referral 但无转化 | 检查落地页 CTA(询盘表单) |
| 部署验证 A1-A5 失败 | 找 AI 排查部署链路 |
