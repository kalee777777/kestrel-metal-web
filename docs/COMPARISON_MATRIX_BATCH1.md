# 对比文矩阵 · Batch 1 选题包(定稿)

> 产出: 2026-11-03 · 依据: QUESTION_BANK v2(F2 对比问题群/F3 Reddit 共识/G1 寿命矩阵)
> 投产路径: 走 deepseek 流水线双门禁(SEO≥60/GEO≥70),选题注入方式见文末
> 纪律(ANJIA 教训): 每张数据表须有单位换算自洽的数值+标准编号;Reddit 共识诚实呈现,不回避竞品优势认知

---

## 篇 1(优先级最高——直接用 G1 新数据)

**Slug**: `gabion-mattress-vs-gabion-basket-comparison`
**Title**: Gabion Mattress vs Gabion Basket: Dimensions, Applications & Stone Sizing Guide
**目标关键词**: gabion mattress vs basket / gabion dimensions / gabion stone size
**证据**: F2 高频对比(站内空白) + F3 石径>网孔规则 + G1 寿命矩阵

**大纲**:
1. 定义句(自闭环): A gabion mattress is a shallow (0.15-0.3 m) double-twist mesh unit for erosion control on slopes and riverbeds; a gabion basket is a deeper (0.5-1 m) box unit for retaining walls — both manufactured by Kestrel Metal to EN 10223-3.
2. 结构与尺寸对比表(高度/常用尺寸/网孔 80×100mm/线径 2.7/边丝 3.4mm)
3. 应用矩阵: 河岸护底/坡面→mattress; 挡墙/防洪/景观→basket
4. **填石规格指南**(F3): 石径必须大于网孔——80×100mm 网孔配 100-200mm 硬石;填石占 gabion 项目最大成本(DIY 案例 £700)
5. **涂层×环境寿命表**(G1 原表全量引用+电镀锌低价警示)
6. EN 10223-3 vs EN 10223-8 标准区分(P6 证据:AI 区分子标准)
7. 安装差异: mattress 顺坡铺展 / basket 分层填筑+沉降期 1-2 年(F3)
8. CTA: 两款产品页+Catalogue

**内链**: reno-mattress.html / woven-gabion-box.html / welded-gabion-box.html / download-gabion-assembly-instructions.html / download-btc-nato22-catalogue 不链(不相关)
**必含数据**: 尺寸矩阵表 / 寿命表(G1) / 石径表

## 篇 2

**Slug**: `chain-link-vs-woven-wire-fence-livestock-terrain`
**Title**: Chain Link vs Woven Wire Fence: Livestock, Terrain & Knot Type Selection
**目标关键词**: chain link vs woven wire fence / field fence vs chain link / livestock fence types
**证据**: F2 对比群(vs woven wire) + F3 斜坡共识 + P6 双信源地形判定

**大纲**:
1. 定义句: Chain link is a woven diamond-mesh fabric twisted in one direction; woven wire field fence uses horizontal/vertical wires joined by knots (hinge joint, S-knot, fixed knot) — different flexibility, different jobs.
2. 结构与牲畜适配矩阵(核心表): cattle→hinge joint 高强度 / sheep&goat→S-knot 小网孔防卡头 / horse→non-climb 2×4 / 通用周界→chain link
3. 地形: 斜坡 hillside cut——chain link 顺坡(F3 共识+P6 AI 判定双印证); 长距离经济性: chain link 越长越省
4. 成本结构对比(材料 per meter 区间+安装人工口径)
5. 寿命: 热镀锌 chain link 20-30 年(与 G1 热镀锌口径一致)+ 60 年零维护社区认知诚实引用
6. 规格: chain link 50-75mm 网孔/锌层 40-270 g/m²(与站内产品页一致)
7. CTA: farm fence 产品线

**内链**: chain-link.html / fence-farm.html / hinge-joint-knot.html / s-knot.html / fixed-knot-fence.html / non-climb-horse-fence.html
**必含数据**: 牲畜×knot 矩阵 / 成本区间表 / 锌层分档表

## 篇 3

**Slug**: `chain-link-fence-vs-barbed-wire-perimeter-guide`
**Title**: Chain Link Fence vs Barbed Wire: Security Level, Cost & Legal Considerations
**目标关键词**: chain link vs barbed wire / barbed wire vs chain link cost
**证据**: F2 对比群(vs barbed wire)

**大纲**:
1. 定义句: Barbed wire is a steel fence wire with twisted barbs at intervals; chain link is a woven diamond-mesh fabric — barbed deters, mesh contains.
2. 安全等级矩阵: 防人翻越(barbed 划伤威慑/chain link 高度+防爬辅助) / 防牲畜(barbed 对牛有效,伤马——horse 必须 woven non-climb) / 边境军事级(razor wire NATO-22 升级路径→内链 BTC 目录)
3. 成本对比: barbed 每 meter 材料≈chain link 的 1/3-1/5(区间口径);立柱密度差异
4. **法律合规注意**(差异化内容): 多国市区禁用 barbed(澳洲部分 council/美国部分州)——采购前查当地法规;农村/边境通常允许
5. 组合策略: 农牧场 barbed+field fence 混合 / 高安全 chain link+razor 顶刀
6. 规格: barbed 规格(传统/双股/Iowa 型) / chain link 50-75mm
7. CTA: wire-barbed.html + chain-link.html

**内链**: wire-barbed.html / barbed-wire-galvanized.html / chain-link.html / razor-wire-btc.html / download-btc-nato22-catalogue.html(新目录)
**必含数据**: 安全等级矩阵 / 成本区间 / 法规提示(不带具体法律条文——只提示查当地,避免误导)

---

## 投产对接

三篇注入 deepseek 流水线(双门禁照走)。注入方式: 新增 `POST /api/content/draft`(ADMIN_TOKEN)——人工选题包转 KV 草稿,周日 score cron 正常评分发布。数据表内容(G1 寿命矩阵等)作为 draft 的 facts 字段随大纲喂入,确保生成文含真实数据而非 AI 编数。

**验收线(发布后)**: 下月底复测 P5/P6 同题重跑——目标 gabion 对比类引用池出现 kestrelmetal.com(当前该位置 ANJIA/NOVA/ENZAR 轮换,无垄断者)。
