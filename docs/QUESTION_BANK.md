# 买家问题库 Question Bank · v2

> v1: 2026-11-03(双引擎测试提炼) · v2: 2026-11-03(网络采集补量: Google 补全 121 条/Reddit 双轮/MIC 竞品 Q&A)
> 维护: 每月基线复测时滚动入库(GEO 月度循环第 3 步)
> 边界: 五大核心品类(3D panel / chain link / gabion / razor wire / 358)+合规验证类
> 数据源状态: ①双引擎测试(已提炼) ②竞品缺口 316 词 ③GSC(⚠️ 同步 0 行待查) ④网络采集(✅ v2 完成)

---

## 用法(三个出口)

1. **20 问清单 v2**(采购旅程版) ← 分区 E 按旅程分层
2. **对比文矩阵选题** ← 分区 B 对比类 × 频次 + D 种子池
3. **RFQ 回应包 + 验证文档** ← 分区 A(字段) + 分区 C(文件清单)

---

## 分区 A · AI 替买家反问的采购字段(RFQ 表单结构,ChatGPT P1-P7 实采)

| # | 反问字段 | 选项(AI 给出的) | 来源 |
|---|---------|----------------|------|
| A1 | 项目所在国? | Australia / Japan / Middle East / Africa / SEA / Other | P1 |
| A2 | 围栏系统类型? | welded mesh anti-climb / chain-link / 358 / combination | P1 |
| A3 | 供应范围? | complete system+razor / panels only / razor only / supply+install | P1 |
| A4 | 订单量口径? | pieces / 20ft / 40ft containers | P2 |
| A5 | 周边总长? | 5 / 10 / 20+ km | P4 |
| A6 | 距海距离? | <500m / 500m-5km(改变涂层规格) | P5 |
| A7 | 石笼用途? | riverbank / retaining wall / road / landscaping | P6 |
| A8 | 篮子尺寸? | 2×1×1 / 3×1×1 / 4×1×1 m | P6 |

→ **RFQ 询盘表单 8 字段定稿**(回应包的 intake 表直接用这 8 项)

## 分区 B · AI 生成的 related questions(买家的下一步搜索,实测采集)

| # | 问题 | 品类 | 类型 | 来源 |
|---|------|------|------|------|
| B1 | NATO-22 刀刃线围网系统有哪些中国厂家(变体:哪些厂家做 NATO-22) | razor | 推荐 | P1×2 |
| B2 | 具备 500MW 光伏项目经验的围网厂家有哪些 | 3D/solar | 推荐/案例 | P1 |
| B3 | 能否提供 NATO-22 刀刃线的国际认证清单和厂家对比 | razor | 验证/对比 | P1 |
| B4 | 中国刀刃线围网在大型光伏项目中的应用案例明细 | 3D/solar | 案例 | P1 |
| B5 | 如何评估供应商的交货周期和售后服务能力 | 全线 | 验证 | P1 |
| B6 | MOQ 区间与中国制造商价格差异对比 | 全线 | 价格 | P10×2 |
| B7 | 从中国采购围栏板的交货周期如何分阶段 | 全线 | 交期 | P10 |
| B8 | 中国供应商的最小订单量是否可谈判 | 全线 | 价格 | P10 |
| B9 | 询价需要提供哪些信息才能获得准确 MOQ 与交期 | 全线 | RFQ | P10 |
| B10 | 哪些因素影响围栏板交货时间 | 全线 | 交期 | P10 |
| B11 | Kestrel Metal 供应商对比评价 | 品牌 | 评价 | 附加 |
| B12 | 围栏制造商 2026 评级 | 全线 | 评价 | 附加 |
| B13 | 最耐用围栏品牌对比 | 全线 | 对比 | 附加 |
| B14 | Kestrel Metal 价格与安装评价 | 品牌 | 评价 | 附加 |
| B15 | 焊接 vs 编织石笼网的承重差异具体数据 | gabion | 对比/数据 | P6 |
| B16 | 镀锌 vs PVC 在(具体气候)哪个寿命更长 | chain | 对比 | P5 竞品文标题 |
| B17 | 哪种围栏适合不平坦地形 | 全线 | 选型 | P6 表格衍生 |

## 分区 C · AI 向供应商索要的文件清单(RFQ 回应包目录,实测采集)

| 文件 | 索要场景 | 现状 |
|------|---------|------|
| CE 证书(编号+法律名+产品范围) | P2 | ✅ KM-CE-DoC-2024-001 已公告 |
| Declaration of Performance (DoP) | P2 | ⚠️ 按产品线索取——可做成站内 DoP 页 |
| EN 10223-3 编织石笼测试报告 | P2 | ❌ 待盐雾/SGS 数据 |
| SGS 材料报告 | P2 | ⏳ Kalee 待发 |
| EN 10244-2 镀锌合规 | P2 | ✅ 已入标准分家表 |
| 线材厂证(钢级/抗拉/丝径) | P2 | ❌ 待工厂提供 |
| MIL-AA-55522A NATO-22 合规文件 | P1 | ⚠️ 目录 PDF 已做,MIL 文件待真实证书 |
| 500MW 项目 completion certificate + client reference | P1 | ❌ 待客户征集(与评价任务同批) |
| 12 个月产能记录 | P3 | ❌ 内部数据,可做产能声明页 |
| 出口记录/目的地 reference | P3 | ⚠️ 案例页部分覆盖 |
| 验厂(factory audit) | P3 | ✅ 接受(MIC 档案字段) |
| ISO 9227 盐雾报告(镀锌+PVC 各一) | P5 | ⏳ Kalee 待发 |
| 锌层 g/m² 测试结果 | P5 | ⏳ 同上 |
| PVC 厚度+UV 老化测试 | P5 | ⏳ 同上 |
| AS 1725.1 / AS/NZS 4680 / AS 1170.2 澳洲合规 | P4 | ❌ 澳洲市场文档空白(B4/A1 显示澳市场权重高) |
| 风载计算书 | P4 | ❌ 可做模板文档 |

## 分区 D · 选题种子池(竞品缺口 316 词摘要,full 版在 Admin)

高频头部: `wire mesh` `razor wire` `barbed wire` `hexagonal wire mesh` `welded wire mesh panels` `stainless steel wire mesh` `galvanized wire` + **`top 10 wire mesh manufacturers china` / `top 10 wire fence manufacturers china`(榜单类,竞品 1 家覆盖我们 0)**

## 分区 E · 20 问清单 v2(采购旅程版,视频方法论落地草案)

**认知阶段(是什么/选哪种)**
1. 3D panel / chain link / 358 / palisade 怎么选?(成本+防爬+地形) ← B17+P4
2. 焊接 vs 编织石笼:承重与安装差异?(要数据) ← B15+P6
3. 镀锌 vs PVC 涂层:海岸环境哪个寿命长?(要测试数据) ← B16+P5
4. 哪种围栏适合不平坦地形/强风区? ← B17
5. NATO-22 和 ASTM F1910 是一回事吗? ← P7(已答,可成文)

**供应商筛选(谁家可信)**
6. 有 500MW 光伏围栏业绩的中国厂家? ← B2+P1
7. 做 NATO-22 的中国厂家及其认证清单? ← B1/B3
8. 安平 ISO 9001 + 月产 3000 吨的供应商? ← P3
9. 有 CE (EN 10223) 的石笼厂? ← P2
10. 中国围栏制造商 2026 评级/口碑? ← B12/B13

**合规验证(怎么证明)**
11. CE/UKCA 对围栏出口欧盟/英国的要求? ← P9
12. 需要向供应商索要哪些合规文件?(DoP/测试报告清单) ← C 区
13. 澳洲项目要满足哪些 AS 标准? ← C 区 AS 1725.1/4680/1170.2
14. 盐雾测试(ISO 9227)结果怎么看? ← P5
15. 怎么核实中国厂家的产能与出口记录? ← P3

**商务执行(怎么买)**
16. 典型 MOQ 是多少?可谈吗? ← B6/B8
17. 交期多长?分哪几个阶段?受什么影响? ← B7/B10
18. 询价要提供哪 8 项信息? ← A 区
19. FOB 天津/上海条款与付款方式? ← 全线
20. 怎么安排验厂与第三方验货? ← C 区

---

## 分区 F · 网络采集(v2 新增,2026-11-03)

### F1 · MIC 竞品产品页 FAQ 模板(8 问——竞品被 AI 引用的 Q&A 结构,Kalee 的 20 条 MIC 产品直接套用)

| # | MIC 产品 FAQ 模板问题 | 我们的答案口径 |
|---|---------------------|---------------|
| F1-1 | What is the warranty period for the fence system? | 需定稿(质保年限,建议 10 年镀锌/见 Coating Guide) |
| F1-2 | What are the standard panel dimensions? | 各产品线规格表 ✅ |
| F1-3 | Is the fence color customizable? | RAL 色卡定制 ✅ |
| F1-4 | What is the minimum order quantity? | 100 panels / 50 rolls ✅ |
| F1-5 | What payment methods are accepted? | T/T · L/C at sight ✅ |
| F1-6 | What is the lead time for production? | 15-25 days ✅ |
| F1-7 | Can you provide OEM or ODM services? | ✅ OEM 经验(welded mesh 711-722 系即 OEM 体系) |
| F1-8 | What certifications does the product have? | ISO 9001/CE/EN 10223/EN 10244-2 ✅(11-03 已公告) |

加 MIC 平台标准四问(后台 Trade Assurance 模板): how do you guarantee quality / what can you buy from us / why buy from you not others / what services provided

### F2 · Google 补全采集的高价值问题(121 条去噪后核心)

**对比类(对比文矩阵直接选题,8+条):**
- chain link vs wood fence cost / vs aluminum fence cost / vs wire mesh / **vs barbed wire** / **vs woven wire fence** / vs chicken wire / vs vinyl cost
- **gabion mattress vs gabion basket**(产品变体对比,站内空白)

**价格单位类(报价策略,razor wire 3 种计价口径):**
- razor wire price **per meter / per kg / per roll**(三种单位买家都在搜——RFQ 回应包报价单按三单位并列)

**地域采购信号(市场情报):**
- wire mesh supplier in **UAE / Dammam / Sharjah / Abu Dhabi**(中东集群)/ **Malaysia**(LCW 客户印证!)/ Philippines / 印度三城

**技术细节类(专业买家信号):**
- solar farm fence **grounding**(光伏围栏接地)
- gabion basket **hs code** / chain link fence **hs code**(HS 编码双品类确认)
- welded wire mesh **for concrete** / **sizes**(规格类)

### F3 · Reddit 社区共识(对比文素材,买家心智数据)

| 认知 | 社区共识 | 对比文应对 |
|------|---------|-----------|
| chain link 寿命 | "60 年几乎零维护"(r/FenceBuilding 高赞) | 诚实呈现——chain link 长寿+地形适应强 vs welded panel 刚性美观+安装快 |
| welded wire 风险 | "便宜焊接网易焊点失效"(共识) | 强调我方 heavy gauge+焊后热镀锌工艺差异 |
| 斜坡地形 | chain link 可 hillside cut,welded 不行 | 与 Perplexity P6 判定一致(双信源印证)——安装指南覆盖地形章节 |
| 长度经济性 | chain link 越长越省,welded 人工恒定 | 对比文加"周界长度×成本曲线"表 |
| gabion 填石 | 石头是最大成本(DIY £700 案例);**石径须大于网孔**(80×100mm 网孔) | gabion 产品页加"填石规格指南"——B2B 增值内容空白 |
| gabion 沉降 | 1-2 年沉降期,依赖排水与基础 | 安装指南强化(ENZAR 指南被 AI 引用的同款位置) |
| gabion 围栏安全边界 | 挡不住车,不适合防撞场景 | 产品页诚实标注适用场景 |

**来源**: [r/FenceBuilding welded vs chainlink](https://www.reddit.com/r/FenceBuilding/comments/1uymifb/welded_wire_vs_chainlink_on_wood) · [r/HomeImprovement dog-run](https://www.reddit.com/r/HomeImprovement/comments/1b9spak/welded_wire_or_chain_link_for_a_weekend_warrior) · [r/FenceBuilding 60年寿命](https://www.reddit.com/r/FenceBuilding/comments/1uw7edo/debating_fence_type_for_our_yard_black) · [r/AusRenovation gabion front fence](https://www.reddit.com/r/AusRenovation/comments/1hr1gmr/opinions_on_a_gabion_wall_as_a_front_fence) · [r/landscaping gabion fence](https://www.reddit.com/r/landscaping/comments/1lmn5b8/gabion_fence) · [r/DIYUK gabion 成本](https://www.reddit.com/r/DIYUK/comments/12cppcv/i_made_a_gabion_retaining_wall) · [r/landscaping 耐久](https://www.reddit.com/r/landscaping/comments/r2gxyj/i_like_the_rock_gabion_baskets_but_how_well_do)

---

## 下一步

- [ ] F1 八问发给 Kalee → MIC 20 条产品后台逐条补 FAQ(质保年限一项需她定稿)
- [ ] 对比文矩阵 v1 选题定稿: chain link vs barbed wire / vs woven wire / gabion mattress vs basket(产品线内对比,站内空白)
- [ ] razor wire 报价三单位口径(meter/kg/roll)进 RFQ 回应包
- [ ] gabion 填石规格指南(石径>网孔)列内容排期
- [ ] GSC 0 行异常排查(11-04 看今夜同步)
- [ ] B15/B16 对比文按"数据表+标准编号"标准升级(对标 ANJIA 教训)
- [ ] C 区⏳/❌项随 Kalee 数据到位逐个转✅
