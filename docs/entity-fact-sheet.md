# 统一信息包(Entity Fact Sheet)

> **性质**: 公司实体信息的**唯一事实源**。所有站外平台档案(Europages/Thomasnet/GBP/Wikidata/LinkedIn/YouTube)只从本文件复制,禁止凭记忆或临时改写
> **创建**: 2026-09-20(用户拍板 DEC-1/2/3)
> **使用规则**: 字段有变更 → 先改这里 → 再同步各平台 → 最后同步站内 schema/llms.txt
> **关联**: [BACKLOG.md](BACKLOG.md)(ENT-* 条目) · [EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md](EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md)(平台操作步骤)

---

## 一、核心字段(Canonical Values)

| 字段 | 标准值 | 备注 |
|------|--------|------|
| 品牌名 | Kestrel Metal | 各平台 Company name 统一用这个 |
| 英文法定名 | Kestrel Metal Products Co., Ltd. | LinkedIn 页面名已用此 |
| 中文法定名 | 安平县凯瑞尔金属制品有限公司 | |
| 成立年份 | 2014(12+ years) | |
| 地址(英文,统一) | Anping Industrial Zone, Anping County, Hengshui, Hebei 053600, China | **DEC-2 已定稿 2026-09-20**;与站内 schema 一致 |
| 电话(统一) | +86 17832383339 | **用户定稿 2026-09-20**;站内 schema 现为 `+86-17832383339`(数字相同,仅分隔符差异,见 SITE-01) |
| 邮箱(主) | kalee@kestrelmetal.com | **用户定稿 2026-09-20**;站内 schema 现为 `sales@kestrelmetal.com`,待对齐(见 SITE-01) |
| 邮箱(备用) | info@kestrelmetal.com / sales@kestrelmetal.com | 仅平台要求备用邮箱时使用 |
| 员工规模 | 51-100 | **DEC 已定 2026-09-20**;平台下拉选 51-100;站内 schema 为 60-100(数字区间不冲突,随 SITE-01 顺手对齐) |
| 官网 | https://www.kestrelmetal.com | |
| LinkedIn | ⏳ **待定稿**(用户 2026-09-21 提供) | 候选:`linkedin.com/company/kestrelmetal`(线上已验证存在)。定稿前任何平台不得填写 LinkedIn 链接 |
| YouTube | 暂保留,**档案待建** | DEC-3 已定 2026-09-20;档案建好前 **不得** 写入任何平台链接或 sameAs |
| 认证 | ISO 9001:2015 / CE(EN 10223, EN 10244) / UKCA / REACH | |
| 年产能 | 3,000+ metric tons/month | |
| 工厂面积 | 200,000 m² | |
| 出口市场 | 50+ countries;重点: Australia, USA, UK, Germany, Canada, New Zealand | |
| 贸易条款 | FOB Tianjin / Shanghai;MOQ 100 panels(fencing)/ 50 rolls(wire mesh);交期 15-25 days | |

## 二、产品线清单(各平台产品目录按此录)

1. Security fence — Y-post anti-climb panels, 358 mesh, 3D welded panels(1.73-2.4m, galvanized + powder coat)
2. Chain link fence — galvanized / PVC coated, mesh 50-75mm, heights 0.9-3.6m, zinc 40-270 g/m²
3. Welded wire mesh — 700 series panels(711/712/713/715/717)
4. Gabion boxes & mattresses — welded double-twist, 2x1x1m standard
5. Razor wire — NATO-22 concertina(BTC barbed tape), CBT-65, CBT-25
6. Barbed wire — single twist / double twist / traditional
7. 3D wire panel fence — V-beam stiffening, solar farm perimeter
8. Epoxy coated wire mesh — marine-grade
9. Nickel mesh — aerospace / battery / chemical
10. Farm & horse fence / Airport fence / Deer fence

## 三、公司描述(直接复制到平台)

### 短版(~50 词,目录一句话简介)

> Kestrel Metal Products Co., Ltd. is a China-based manufacturer of security fences, wire mesh, gabions, razor wire and barbed wire, operating from Anping Industrial Zone, Hebei since 2014. ISO 9001:2015 certified, with 3,000+ tons monthly capacity and 200+ projects delivered in 50+ countries.

### 中版(~150 词,Europages / Thomasnet 公司描述)

> Kestrel Metal Products Co., Ltd. is a China-based manufacturer of security fencing and wire mesh products, headquartered in Anping Industrial Zone, Hebei — China's wire mesh manufacturing hub. Since 2014 we have delivered 200+ projects in 50+ countries, including a 500MW solar farm perimeter in Australia and a 10,000-acre cattle ranch fencing project.
>
> Our product lines cover security fences (Y-post anti-climb panels, 358 mesh, 3D welded panels), galvanized and PVC-coated chain link fence, welded wire mesh panels (700 series), gabion boxes and mattresses, NATO-22 concertina razor wire, barbed wire, epoxy coated wire mesh and nickel mesh. All products are manufactured in our 200,000 m² facility with 3,000+ tons monthly capacity and 15-25 days lead time.
>
> We are ISO 9001:2015 certified, with CE (EN 10223, EN 10244), UKCA and REACH compliance for international markets. FOB Tianjin/Shanghai, MOQ from 100 panels or 50 rolls.

### 长版(500+ 字,LinkedIn / GBP 公司简介)

> Kestrel Metal Products Co., Ltd. (安平县凯瑞尔金属制品有限公司) is a China-based manufacturer of security fencing and wire mesh products, headquartered in Anping Industrial Zone, Hebei Province — the heart of China's wire mesh industry. Founded in 2014, the company has grown into a group of 4 manufacturing subsidiaries operating a 200,000 m² production facility with 3,000+ tons of monthly capacity.
>
> Over the past 12+ years, Kestrel Metal has delivered more than 200 projects across 50+ countries. Representative projects include a 500MW solar farm perimeter security project in Australia, a 10,000-acre cattle ranch fencing project, and gabion levee works for flood control infrastructure.
>
> Our complete product portfolio includes: security fences (Y-post anti-climb panels, 358 security mesh, 3D welded wire panels from 1.73 m to 2.4 m), galvanized and PVC-coated chain link fence (mesh 50-75 mm, heights 0.9-3.6 m), welded wire mesh panels (700 series), gabion boxes and mattresses, NATO-22 concertina razor wire (BTC barbed tape, plus CBT-65 and CBT-25), barbed wire in single and double twist, marine-grade epoxy coated wire mesh, and nickel mesh for aerospace, battery and chemical applications.
>
> Quality is backed by ISO 9001:2015 certification, CE marking (EN 10223, EN 10244), UKCA compliance and REACH-compliant materials. We export with FOB Tianjin/Shanghai terms, flexible MOQ starting from 100 panels or 50 rolls, and standard lead times of 15-25 days.
>
> Website: https://www.kestrelmetal.com

## 四、媒体资产

| 资产 | 位置 | 用途 |
|------|------|------|
| Logo | `kestrel-site/images/logo.svg` / `kestrelmetal.png` | 平台头像(与网站一致) |
| 产品图 | `kestrel-site/images/blog/`、`kestrel-site/products/` | 平台产品目录(≥5 张) |
| 认证证书 | `kestrel-site/files/`(下载页对应文件) | Thomasnet 等要求认证文件时 |

## 五、平台档案登记表(上线一个登记一个)

| 平台 | 档案 URL | 状态 | 日期 |
|------|---------|------|------|
| LinkedIn | ⏳ 待定稿(页面已上线) | ✅ 2026-08-30 | 上线 |
| Europages | — | ☐ 未建 | |
| Thomasnet | — | ☐ 未建 | |
| Google Business Profile | — | ☐ 未建 | |
| Wikidata | — | ☐ 未建(等前三个作引用源) | |
| YouTube | — | ⏸ 保留规划,档案待建 | |

> 平台 URL 定稿后:① 更新本表 → ② 加入 sameAs 回加(ENT-05)→ ③ 同步 llms.txt Company Identity 段

## 六、决策记录

| 日期 | 决策 |
|------|------|
| 2026-09-20 | DEC-2 地址统一为 "Anping Industrial Zone, Anping County, Hengshui, Hebei 053600, China" |
| 2026-09-20 | 电话统一为 +86 17832383339;邮箱主用 kalee@kestrelmetal.com |
| 2026-09-20 | 员工规模 51-100 |
| 2026-09-20 | DEC-3 YouTube 暂保留(档案待建,建好前不进 sameAs) |
| 2026-09-21(待) | DEC-1 LinkedIn slug 待用户提供后定稿 |
