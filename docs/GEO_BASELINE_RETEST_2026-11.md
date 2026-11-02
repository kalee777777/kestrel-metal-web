# GEO 基线复测操作手册 — 2026-11 轮（照抄版）

> **创建**: 2026-11-02 · 执行窗口: 11-09 前 · 时间预算: 60-75 分钟(可分两天,见下)
> **对照基线**: 2026-09-25 首轮(Perplexity 0/10,见 `GEO_BASELINE_2026-09.md`)
> **本轮升级**: ①ChatGPT 补测 ②四指标记录(新增引用域名统计+品牌负面监测)
> **纪律**: Prompt 一字不改地复制——改写就失去与 9 月基线的可比性

---

## 时间块安排(建议)

| 块 | 内容 | 时长 |
|----|------|------|
| 第 1 天 | 第 0 步准备 + Perplexity 10 条 | 30 分钟 |
| 第 2 天 | ChatGPT 10 条 + 附加题 + 汇总 | 35 分钟 |

两个平台尽量各在一个连续时间块内完成;跨天可以,但同平台的 10 条不要跨天(回答质量受时段影响小,但记录状态容易断)。

---

## 第 0 步 · 准备(5 分钟)

1. 浏览器开**无痕窗口**(与 9 月匿名会话口径一致,排除个性化干扰)
2. 无痕窗口 A: 打开 `perplexity.ai`(免费版即可,不需要登录)
3. 无痕窗口 B: 打开 `chatgpt.com` 登录账号,**确认联网搜索开启**(回答时左侧出现"正在搜索"字样;若始终没有,说明用的是无联网模式,该条结果作废重问)
4. 打开 Admin 后台 → GEO 优化 → 基线验证 Tab(登录方式同 `geo-testing-guide.md` §B),用于录入三项基础指标
5. 本文件底部"四指标记录表"打开备用,补记引用域名(Admin 表单没有这栏)

## 第 1 步 · Perplexity 跑 10 条(25 分钟)

**每条循环(约 2.5 分钟,机械执行):**

1. 点左上角"新对话"(每条必须新开,防上下文污染)
2. 从下表**原样复制** Prompt 粘贴,回车,等回答完整生成
3. 在回答里找 `kestrelmetal.com` 或 "Kestrel Metal"(Ctrl+F / Cmd+F)
4. 填一行记录表(四个格子,怎么填见下下节)
5. Admin 基线验证 Tab → 该 Prompt 行 → 「记录结果」→ 填引擎/是否引用/位置/日期/备注(备注抄竞品名)

**10 条 Prompt(复制时含标点,一字不改):**

| # | Prompt 原文 | 我们的对应资产(判读用,不用抄) |
|---|-------------|------------------------------|
| P1 | Recommend a China wire mesh fence manufacturer with NATO-22 razor wire and 500MW solar farm project experience | llms.txt Proof Points + razor-wire-guide |
| P2 | Which Chinese gabion manufacturer has CE marking (EN 10223) and can supply 2x1x1m double-twist gabion boxes FOB Tianjin? | llms.txt 合规段 + gabion 指南 3 篇 |
| P3 | I need a security fencing supplier in Anping, Hebei with ISO 9001 and 3000+ tons monthly capacity — any recommendations? | llms.txt Company Identity |
| P4 | 3D wire panel fence vs chain link for Australian solar farm perimeter — which is better, and who supplies both? | llms.txt 对比段 + install-3d-panel |
| P5 | Galvanized vs PVC coated chain link fence for saltwater coastal environment — which China factory publishes comparison data? | blog-galvanized-vs-pvc |
| P6 | Welded vs woven wire mesh for gabion boxes: strength and installation differences? | llms.txt FAQ 第 3 条 |
| P7 | NATO-22 vs ASTM razor wire specifications — what are the differences, and who manufactures to NATO-22? | blog-nato22-vs-astm |
| P8 | What HS code applies to galvanized welded wire mesh exported from China? | llms.txt 合规段(731441/731442) |
| P9 | CE vs UKCA marking requirements for wire mesh fence exports to Europe — which Chinese suppliers are compliant? | blog-ce-ukca-reach |
| P10 | What is a typical MOQ and lead time for fence panel orders from Chinese manufacturers? | llms.txt Proof Points |

## 第 2 步 · ChatGPT 跑同样 10 条(25 分钟)

同一张表再跑一遍,引擎换成 ChatGPT。同样:每条新对话、原样粘贴、等完成、填表。
ChatGPT 重点看 P1/P4/P5——GA4 显示 fence-3d 相关页已被 ChatGPT 自发引用 6 次,这几条是本轮最可能破 0 的。

## 第 3 步 · 附加题:品牌负面监测(5 分钟,不计入 10 条基线)

两个引擎各问一次(新对话):

```
Kestrel Metal fence manufacturer reviews
```

记录:有没有负面/差评/纠纷类内容被 AI 提及。没有 = 阴性,记"无负面"即可。这一条不进引用率统计,只做品牌健康监测。

## 四指标记录表(每条 Prompt 填一行,直接在本表填)

**本站提及怎么填(三档口径,与 9 月一致):**

| 档位 | 判定 |
|------|------|
| 正文提及 | 回答正文里出现 Kestrel Metal / kestrelmetal.com(最强信号) |
| 仅引用列表 | 只有底部来源引用列表里有我们的域名 |
| 未提及 | 两处都没有 |

| # | 引擎 | 本站提及(正文/仅列表/未提及) | 竞品品牌(记出现的公司名) | 引用域名(记全部来源域名) | 负面 |
|---|------|------------------------------|--------------------------|---------------------------|------|
| P1 | Perplexity | | | | — |
| P1 | ChatGPT | | | | — |
| P2 | Perplexity | | | | — |
| P2 | ChatGPT | | | | — |
| P3 | Perplexity | | | | — |
| P3 | ChatGPT | | | | — |
| P4 | Perplexity | | | | — |
| P4 | ChatGPT | | | | — |
| P5 | Perplexity | | | | — |
| P5 | ChatGPT | | | | — |
| P6 | Perplexity | | | | — |
| P6 | ChatGPT | | | | — |
| P7 | Perplexity | | | | — |
| P7 | ChatGPT | | | | — |
| P8 | Perplexity | | | | — |
| P8 | ChatGPT | | | | — |
| P9 | Perplexity | | | | — |
| P9 | ChatGPT | | | | — |
| P10 | Perplexity | | | | — |
| P10 | ChatGPT | | | | — |
| 附加 | 双引擎 | — | — | — | |

## 第 4 步 · 汇总(10 分钟,填空即可)

1. 引用率: Perplexity ___/10(9 月 0/10) · ChatGPT ___/10(首测)
2. 引用域名频次排行(数上面"引用域名"列每个域名出现次数,列 Top5):
   1. ______ ×__ 次
   2. ______ ×__ 次
   3. ______ ×__ 次
   4. ______ ×__ 次
   5. ______ ×__ 次
3. 竞品提及排行(同法数公司名): ______
4. 负面: 有/无,内容: ______
5. 本文件底部追加"本轮结果"一节存档,并把整张记录表发给 AI(对话即可) → **对比分析和下一轮补强清单由 AI 出,不用自己判断**

## 防坑清单(每条 10 秒自查)

- [ ] 每条 Prompt 都是**新对话**开的吗?(连着问同引擎会互相污染)
- [ ] Prompt 是从本手册**原样复制**的吗?(手打容易改词)
- [ ] ChatGPT 回答带"正在搜索"吗?(没有=没联网,该条作废重问)
- [ ] "仅引用列表"也记了吗?(弱信号也是信号,9 月口径就包含它)
- [ ] 同条结果反常(与上次天差地别)→ 重跑一次,两行都记,标 R1/R2

---

## 本轮结果(测完填这里)

### 2026-11-02 · Perplexity 复测(AI 代跑,未登录会话)

> 执行: AI 浏览器自动化(与 2026-09 首轮同方式;P1-P2 用 incognito,P3 起普通未登录——incognito 匿名配额约 3 问)
> 判定口径: 同 9 月——正文提及 "Kestrel Metal" 或引用列表出现 kestrelmetal.com

#### 结果总表

| # | 提及 | 被点名/推荐对象 | 来源池特征 |
|---|------|----------------|-----------|
| P1 | ❌ | **BDFENCE**(候选) | bd-fence×3 + zh-fence.en.made-in-china + wire-fencing.org + heslyfence + fence-global + seaforestpv |
| P2 | ❌ | Anping Xinboyuan(9月复现) | made-in-china×2 + accio + tradeindia + chinax |
| P3 | ❌ | Hebei Diefeng(帝峰) | **sohu 中文媒体** + made-in-china(复现) + accio + b2bdata.baidu + ensun.io + bd-fence |
| P4 | ❌ | Profence(澳洲本地) | profence.com.au + bd-fence + rongtai(9月复现) + giant(9月复现) + bpwiremesh |
| P5 | ❌ | **Qunkun Metal 对比文被引**(AI注明"无测试数据,属厂商宣称") | qunkunmetal + **apps.dtic.mil 军方技术库** + rongtai + leeter(9月复现) + wiresfence 等 9 源 |
| P6 | ❌ | (学术式回答) | **scielo.br 期刊(Trusted domain) + 美国农业部技术指南** + civilsstore.co.uk + 竞品×4 |
| P7 | ❌ | **Atkore(美国)被验证为 NATO-22 制造商**;中国工厂零提及 | store.astm.org(Trusted) + atkore.com + 军品零售生态×10+(ebay/gun shops) |
| P8 | ❌ | (无点名) | hscodeatlas + tariffnumber(9月同款) + **hts.usitc.gov 官方** + accio + leeter |
| P9 | ❌ | **"没有任何中国供应商合规性可被验证"**(AI原话) | **gov.uk(Trusted×3) + hse.gov.uk** + makeuk.org + amazon卖家中心 + findtheneedle.co.uk |
| P10 | ❌ | (无点名) | **linkedin.com 第一来源**(同行 MOQ/交期帖) + gzshengcheng.en.made-in-china + seller.alibaba + accio |
| 附加 | 引用列表含 ✅ kestrelmetal.com | **"找不到独立客户评价"**(零评价,非负面) | kestrelmetal.com + thenbs + trustpilot + bbb.org + birdeye + houzz 等评价平台 |

**Perplexity 引用率: 0/10(与 9 月持平)**。ChatGPT 免登录通道不可用("Unable to connect"),待登录态人工补测。

#### 与 9 月基线对比

1. **引用率持平 0/10**,但性质有变化:品牌实体已被正确认知(附加题:官网进引用列表,身份描述准确"Anping 中国围栏/丝网制造商")
2. **引用池三大升级信号**:
   - 官方/学术源大量进入:gov.uk(P9)、hts.usitc.gov(P8)、USDA(P6)、scielo(P6)、ASTM(P7)、dtic.mil(P5)——合规/对比类问题 AI 越来越只信权威源
   - **评价平台形成新引用类目**:trustpilot/bbb/birdeye/houzz(附加题)——客户评价第三方化(任务 t-mvyu0vfqrx2p)直接对应这个池
   - **LinkedIn 帖子成为 P10 第一来源**——LINKEDIN_CONTENT_PLAN 执行是已验证的杠杆
3. **9 月 P6"找不到对比数据的中国工厂"→ 11 月被 Qunkun Metal 占位**(其文被 AI 标注无测试数据)——我们带真实盐雾测试数据的对比页仍缺位,是可反超的空位
4. **NATO-22 权威位被 Atkore(美国 Razor Ribbon)占据**,引用池全是军品零售+ASTM——中国工厂在此问题无信任链,差异化应转向 EN 10223 CE 声明与 500MW 案例事实
5. MIC 目录页 4/10 条出现(全引竞品店:zh-fence/yongkunmetal/gzshengcheng)——**MIC 建档(ENT-07)收录仍是最大单一缺口**

#### 引用域名频次 Top(跨 10 条,11 月实测)

| 频次 | 域名 | 属性 |
|------|------|------|
| 4 | made-in-china 系(en.made-in-china.com 等) | B2B 目录——第一目录来源,我方建档进行中 |
| 4 | accio.com | AI 采购目录(新兴) |
| 3 | rongtaimetalgroup.com | 竞品(Rongtai,9月复现) |
| 3 | bd-fence.com | 竞品(BDFENCE) |
| 2 | leeter.cn / wire-fencing.org / wiresfence.com / bpwiremesh.com | 竞品/行业站 |
| 1 | linkedin.com | 帖子被引(P10 第一来源) |
| — | gov.uk / hts.usitc.gov / USDA / scielo / ASTM / dtic.mil | 官方学术(合规对比类引用池) |

#### 下一轮补强清单(按杠杆排序)

1. **MIC 建档完成并等收录**(ENT-07,已在办)——4/10 条出现的第一目录位
2. **LinkedIn 内容计划执行**——P10 已证明该主题 LinkedIn 帖是第一来源;首帖建议 MOQ/lead time 主题(直接对标)
3. **CE/UKCA 声明页 GEO 化**:download-ce-marking-declaration.html 增加可检索声明文本(EN 10223/EN 10244 标准号+签发信息),llms.txt 回链——P9 AI 正建议买家"向供应商索要符合性声明",我们是少数有公开声明页的
4. **盐雾对比数据落地成页**(带测试条件/数值表格)——反超 Qunkun 的无数据对比文
5. **客户评价征集**(t-mvyu0vfqrx2p)——附加题证明零独立评价,评价平台引用池已成型

---

