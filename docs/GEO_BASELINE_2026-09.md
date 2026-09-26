# GEO 基线测试报告 — 首轮(Perplexity)

> **日期**: 2026-09-25(北京时间 26 日凌晨)
> **执行**: AI 浏览器自动化(匿名会话,答案完整生成后判定)
> **判定口径**: 正文提及 "Kestrel Metal" 或引用列表出现 kestrelmetal.com
> **背景**: GEO 自动化流水线当日刚上线(此前基础设施已就绪但内容积累刚开始)

## 一、结果总表

| # | Prompt(类别) | 引用 | 被推荐对象 | 来源池特征 |
|---|--------------|------|-----------|-----------|
| 1 | NATO-22 + 500MW 太阳能推荐 | ❌ | Rongtai Wire Mesh | 竞品官网×7 + made-in-china×3 |
| 2 | 3D 焊接网太阳能围栏(澳) | ❌ | Anping Fuhua / Woda / Giant / Doudou / Bendin | made-in-china 目录页为主 |
| 3 | ISO 9001 gabion 安平 | ❌ | Angu / Zhuoda / Biaoguan / Xinboyuan | 安平本地竞品 + 目录页 |
| 4 | 358 高安全围栏 | ❌ | Cheungg / Anjia / Conquer 等 | alibaba 目录 + 竞品 |
| 5 | 3D vs 链网(澳太阳能) | ❌ | 澳洲本地 + topsfence 等 | 澳洲零售 + 竞品 |
| 6 | 镀锌 vs PVC 海水对比数据 | ❌ | **"找不到有对比数据的中国工厂"** | 竞品博客(wodafence 等) |
| 7 | 焊接 vs 编织石笼网 | ❌ | Mclassicmetal 等 | 竞品博客 + 目录页 |
| 8 | HS 编码出口 | ❌ | freightamigo / tariffnumber 等 | 物流/关税工具站 |
| 9 | NATO-22 剃刀网合规 | ❌ | "合规信息不明确" | 竞品 PDF/产品页 |
| 10 | CE / EN 10223 EU 认证 | ❌ | alibaba seller 博客 / 竞品证书 PDF / **LinkedIn 帖子** | 目录 + 证书页 + LinkedIn |

**基线引用率:0/10(0%)**。对照:GA4 已记录 ChatGPT 自发引用 6 次/28 天——ChatGPT 侧基线预计显著好于 Perplexity,待人工补测。

## 二、诊断(为什么是 0)

1. **候选池问题,不是内容质量问题**:P3(安平+ISO+gabion)完全命中我们的 llms.txt 身份段,Perplexity 检索到的却是其他安平厂商——我们的实体未进入 Perplexity 的索引候选池
2. **内容已存在但未被检索**:P6 明说"找不到有对比数据的中国工厂",而站内 blog-galvanized-vs-pvc.html 就是这篇内容——检索覆盖缺口,非内容缺口
3. **来源池三大支柱**:made-in-china / Alibaba 目录页出现率极高;竞品 SEO 博客(类型与我们流水线产出完全相同,竞品先发);LinkedIn 帖子(P10 引用了安平同行的 LinkedIn post——印证站外实体价值)
4. **竞品博客被引用**(wodafence、muyuan、leeter 的 galvanized-vs-pvc 文)——证明该内容类型在引用池内有效,我们的流水线方向正确,需要的是**收录积累时间 + 更多入口**

## 三、行动建议(按杠杆排序)

| 优先级 | 行动 | 依据 |
|--------|------|------|
| **P0** | **made-in-china / Alibaba 国际站供应商页建档**(新增到 ENT 待办,优先级高于 Europages) | 目录页在 10 条测试中出现 ~15 次,是 Perplexity 引用池第一来源 |
| P0 | 流水线照常跑(GEO≥70 文章 + llms.txt + FAQ) | 竞品同型博客正被引用;我们有 215 页 + 自动产出,需要收录积累 |
| P1 | GSC 索引请求:确保 blog-galvanized-vs-pvc 等对比文已被收录 | P6 直接证据 |
| P1 | ChatGPT / Gemini 人工补测(已登录环境) | GA4 显示 ChatGPT 已在自发引用,预计基线不为 0 |
| P2 | LinkedIn 内容计划执行(ENT-06 剩余) | P10 引用了同行 LinkedIn 帖 |

## 四、复测计划

- 每两周复测同 10 条 Prompt(operations-checklist §二·B 已挂例行)
- 录入管理台「基线验证」Tab(浏览器 localStorage,人工录入)
- 下轮对比目标:引用率 0% → ≥10%(至少 1 条)

---
*本报告为首轮基线,引用率低符合新站预期——基线的意义正是给后续所有 GEO 工作提供对照。*
