# GEO 基础与实施手册(GEO Playbook)

> **日期**: 2026-09-20
> **定位**: ① 本站(kestrelmetal.com)GEO 基础资产盘点;② AI 抓取的完整逻辑链;③ **新网站从零做 GEO 的通用路线图**(可复制到任何站点)
> **关联**: [GEO_PROGRESS.md](GEO_PROGRESS.md)(本站进度)、[admin-i18n-geo-upgrade.md](admin-i18n-geo-upgrade.md)(管理台升级)、[GEO_OPTIMIZATION_REPORT.md](GEO_OPTIMIZATION_REPORT.md)
> **配套 Skill**: `geo-playbook`(ZCode skill,在任何项目里输入 /geo-playbook 或让 AI "audit GEO" 即可按本手册执行)

GEO(Generative Engine Optimization)= 让 AI 引擎(ChatGPT/Perplexity/Gemini/Copilot)在回答用户采购问题时**引用你的网站**。与 SEO 的区别:SEO 争取排名点击,GEO 争取"被 AI 说出名字并给出链接"。

---

## 第一部分:本站 GEO 基础盘点(资产清单)

项目五层模型:**开门 → 自我介绍 → 让 AI 敢引用 → 知道谁来 → 证明我是我**,外加验证层。

### 1. 开门层(让 AI 爬虫能进来)

| 资产 | 内容 | 位置 |
|------|------|------|
| robots.txt | `*` 组 + **8 个 AI 爬虫显式 Allow**(GPTBot / OAI-SearchBot / ClaudeBot / PerplexityBot / Google-Extended / Bingbot / Amazonbot / Applebot-Extended);`Disallow` 仅 /admin/ /components/ /api/;末行声明 Sitemap | `kestrel-site/robots.txt` |
| Content-Signal | `search=yes, ai-input=yes, ai-train=no, use=full` —— 欢迎搜索与 AI 实时引用(RAG),禁止拿去训练 | robots.txt `*` 组首行 |
| Cloudflare 边缘层 | AI Crawlers 策略 Search/Agent=Allow;robots.txt 托管 Disable(防边缘覆盖本地文件) | Cloudflare 控制台 |

### 2. 自我介绍层(来了能快速读懂)

| 资产 | 内容 |
|------|------|
| llms.txt | 6 章节 73 行:Company Identity(品牌↔英文法名↔中文法名)、Product Lines(10 条产品线带参数)、**Proof Points(机器可引用事实)**、Key Comparison Data(5 组对比)、Compliance & Certifications(含 HS 编码)、FAQ(6 条可直接引用的问答) |
| 5 篇 GEO 磁铁博客 | 对比/合规/剃刀网/太阳能/HS 编码主题 —— AI 采购问题的高频检索面 |
| 5 个核心产品页 | 段首重写为"自闭环定义句"(AI 抽取一段即完整) |
| factory-audit.html | 工厂审计页(可信度信号) |

### 3. 让 AI 敢引用层(结构化数据)

- **静态 JSON-LD**:196 个 HTML 原始文件写入(实测 198 文件全有、0 解析失败),类型分布 Organization×198 / BreadcrumbList×197 / Product×88 / Article×60 / FAQPage×23 / Service×6 / LocalBusiness×2 / WebSite×1
- **运行时补充** `js/seo-enhance.js`:只补缺不重复(`hasJsonLdType` 守卫),补 Product 的运费/退货结构
- 生成器 `perf-scripts/static-jsonld.js`(569 块全解析通过)

### 4. URL 规范层(避免重复/死链信号)

- canonical 统一 `.html` 形态(首页 `/`)
- sitemap.xml 198 条与 canonical 一致
- `_redirects` 约 195 条无扩展名 → `.html` 的 301

### 5. 知道谁来层(追踪)

- `js/analytics-loader.js`:**15 个 AI referrer 域名**识别(ChatGPT/Perplexity/Claude/Copilot/Gemini/Grok/DeepSeek/Mistral 等)→ GA4 + Umami **双通道发 `ai_referral` 事件**(维度:来源+落地页),sessionStorage 会话去重
- GA4 自定义维度 2 个(AI Referral Source / Page);GA4 ↔ Search Console 已关联

### 6. 证明我是我层(实体一致性)

- LinkedIn 公司页上线,`sameAs` 三层回加(HTML 静态 + 生成器 + 运行时,198 块);清理过 197 处死链 sameAs
- 全站公司名统一 **Kestrel Metal Products Co., Ltd.**;llms.txt 有实体关联段
- ⏳ 未完成:Europages / Thomasnet / Google Business Profile(站外实体 55%)

### 7. 验证层(Admin 管理台)

- GEO 诊断(robots/llms/sitemap 检查 + 历史基线)
- **基线验证**(Prompt 管理 + AI 引用记录 + 按引擎引用率)——"效果验证"模块的落地工具
- 全站 JSON-LD 校验、真实 GEO 评分(198 页)、llms.txt/sitemap 查看器

---

## 第二部分:AI 抓取的完整逻辑链

一条链路走完,每一步对应我们的哪块资产:

**① 爬虫决定来不来** → 查 robots.txt
- 8 个 bot 各有显式组 `Allow: /`;未列名的新爬虫落 `*` 组同样放行 → **默认全放行**,只挡后台路径
- 每组读到 Content-Signal:引用可以、训练不行

**② 各家引擎用哪个爬虫**

| AI 产品 | 爬虫 | 用途 |
|---------|------|------|
| ChatGPT | GPTBot + OAI-SearchBot | 训练控制 + 搜索引用 |
| Perplexity | PerplexityBot | RAG 实时检索(**对我们最重要**) |
| Claude | ClaudeBot | RAG 实时检索 |
| Gemini / AI Overviews | Google-Extended + Googlebot | 训练控制 + 搜索 |
| Copilot / Bing | Bingbot | 索引 |
| Alexa / Apple Intelligence | Amazonbot / Applebot-Extended | 语音 / 训练控制 |

**③ 进来后先要 URL 清单** → robots.txt 末尾 `Sitemap:` 声明 → sitemap.xml 198 条,与 canonical、301 三者一致,无重复页面信号

**④ 读页面时的理解顺序** → llms.txt(最快的事实摘要)→ JSON-LD(机器可信结构化事实)→ 正文(定义句/对比数据/FAQ,为"抽一段就能用"而设计)

**⑤ 引用 vs 训练的合规立场** → `ai-input=yes, ai-train=no`:要的是被引用露出(流量+询盘),不让内容变训练语料

**⑥ 我们怎么知道它来了** → 用户从 15 个 AI 域名点击过来 → referrer 匹配 → GA4/Umami 记 `ai_referral` 事件。**边界:爬取本身不可见**(只有服务器日志有 UA),能追踪的是"引用后带来的人"

**⑦ 闭环验证** → 管理台 GEO 诊断(配置)→ JSON-LD 校验(内容)→ 基线验证(AI 是否真引用)→ ai_referral 流量(最终效果)

---

## 第三部分:新网站从零做 GEO —— 通用路线图

以下适用于**任何新网站**(静态或 CMS 均可),按依赖顺序分 5 个阶段。原则:**先准入、再身份、后内容、持续验证**,不要一上来就堆内容。

### 阶段 0:抓取准入(第 1 周,半天工作量)

目标:确保主流 AI 爬虫能来、能读。

- [ ] **robots.txt 四要素**:`*` 组基础规则(挡后台/接口路径)+ 主要 AI bot 显式 Allow + Content-Signal 声明立场 + `Sitemap:` 声明
- [ ] Content-Signal 立场决策:`ai-input=yes`(欢迎引用)是默认建议;是否 `ai-train=no` 由版权策略定
- [ ] CDN/边缘层检查:Cloudflare(或同类)的 AI 爬虫阻断策略、托管 robots.txt 功能——确保不会覆盖你自己的 robots.txt
- [ ] 页面可无 JS 读取:核心内容必须存在于 HTML 源码中,不能只靠客户端渲染(AI 爬虫大多不执行 JS)
- [ ] 验收:`curl https://站点/robots.txt` 逐 bot 检查;管理台/脚本跑一次 robots 分组解析

### 阶段 1:机器可读的身份与事实(第 1-2 周)

目标:AI 来了一次就"认识"你,并且敢引用。

- [ ] **llms.txt**(站点根目录,这是新站 ROI 最高的一项):`# 站名` + 一段定位(地域/年限/规模/认证)→ `## Company Identity`(法名/地址/官网/社媒)→ `## Product Lines`(带参数)→ `## Proof Points`(可引用数字:年限/产能/认证/里程碑)→ `## 对比数据` → `## 合规` → `## FAQ`(Q:/A: 格式,答案自包含)
- [ ] **Organization JSON-LD** 全站注入:name/legalName/logo/url/address/contactPoint/knowsAbout/**sameAs**
- [ ] **实体一致性**:公司法定名、品牌名、地址、电话全站统一(一种写法);llms.txt 与页面与 schema 三处一致
- [ ] sitemap.xml 生成且与实际页面一一对应;canonical 规范统一(一种形态)
- [ ] 验收:JSON-LD 全站解析 0 报错;llms.txt 与页面事实抽查一致

### 阶段 2:可引用内容(第 2-4 周起,持续)

目标:让 AI 抽到的每一段都完整、有数据、可署名。

- [ ] 每个关键页面**段首自闭环定义句**(第一段即"X 是什么+属于谁+关键参数")
- [ ] **FAQ 模块**:页面上真实渲染(不是只放 schema),配 FAQPage JSON-LD
- [ ] **对比类内容**:A vs B 文章带数据表(价格/性能/适用场景)——AI 回答对比类问题最爱引用
- [ ] **Proof Points**:具体数字(年限、产能、认证编号、代表项目+规模),避免"丰富经验"这类不可引用的空话
- [ ] 每个 URL 一种类型一种 schema(Product 页 Product、文章 Article、FAQ 页 FAQPage),禁止假 schema
- [ ] 验收:抽检 5 个页面,正文里每页至少 3 个"数字+单位"事实点;无 JS 渲染下内容完整

### 阶段 3:追踪与验证(第 2-4 周起部署,持续积累)

目标:知道谁来了、AI 有没有引用。

- [ ] **ai_referral 事件**:GA4(或同类)+ referrer 域名清单(至少:chatgpt.com / perplexity.ai / claude.ai / copilot.microsoft.com / gemini.google.com / grok.com / deepseek / mistral),自定义维度 来源+落地页,会话去重
- [ ] GA4 ↔ Search Console 关联
- [ ] **基线 Prompt 5-10 条**(覆盖:品类推荐类 / 对比类 / 合规类,含你的差异化关键词),在 ChatGPT(联网)/Perplexity 里人工测试,**记录是否引用你的域名及位置**——每月一次,看趋势
- [ ] 工具化:管理台或脚本做诊断(robots/llms/sitemap)+ 全站 JSON-LD 校验 + 页面评分(参考本站模型:Schema 40% / 可引用结构 30% / 事实密度 30%)
- [ ] 验收:GA4 能看到 ai_referral 事件;基线记录有第一笔数据(此时引用率低是正常的,先建基线)

### 阶段 4:站外实体一致性(第 2 个月起,长期)

目标:让 AI 交叉验证"你是谁",提升实体置信度。

- [ ] **LinkedIn 公司页**(AI 最常采信的 B2B 身份源),官网 schema `sameAs` 回指
- [ ] 行业目录:目标市场的 B2B 平台(如 Europages / Thomasnet),NAP(名称/地址/电话)与官网完全一致
- [ ] Google Business Profile(有实体经营场地时)
- [ ] 清理死链:sameAs 指向的档案必须真实存在(本站曾一次删 197 处死链 sameAs)
- [ ] 验收:搜索"品牌名"时,官网/LinkedIn/目录三者信息一致

### 上线后的优化循环(每月)

```
诊断(robots/llms/sitemap/JSON-LD)→ 评分(找低分页)→ 基线测试(AI 是否引用)
→ 补内容(给低分页加定义句/FAQ/数据点)→ 更新 llms.txt → 下月复测
```

优先级判断:无 schema 页 > 解析失败页 > 无定义句页 > 引用率低的 Prompt 对应主题。

### 反模式清单(每条都有真实代价)

| 反模式 | 代价 |
|--------|------|
| 假 schema(套类型但内容不符/假日期) | AI 引擎降低对站点信任 |
| 核心内容只靠 JS 渲染 | 爬虫读到空壳 |
| canonical / sitemap / 301 三者不一致 | 重复 URL 信号稀释权重 |
| llms.txt 与页面事实不一致 | 引用错信息,损害可信度 |
| sameAs 指向不存在的档案 | 实体验证失败 |
| 只声明 ai-train=no 不声明 ai-input | 引擎拿不准能否引用,倾向不引 |
| 公司名多种写法混用 | 实体归属混乱,引用归属不到你 |

### 新站最小可用清单(如果只能做 5 件事)

1. robots.txt:8 个 AI bot Allow + Content-Signal + Sitemap 声明
2. llms.txt:身份 + 证据点 + FAQ
3. Organization schema(全站,带 sameAs)+ 每页正确的类型 schema
4. ai_referral 追踪事件
5. 5-10 条基线 Prompt 开始记录引用率
