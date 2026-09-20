# 项目待办总表(BACKLOG)

> **性质**: 全项目待办的**唯一事实源**,滚动更新(活文档)
> **创建**: 2026-09-20
> **维护约定**:
> 1. 新待办直接追加到对应优先级区,按 ID 规则编号(`GEO-` 优化项 / `ENT-` 站外实体 / `ADMIN-` 管理台 / `SITE-` 站点级 / `I18N-` 国际化 / `DEC-` 待决策)
> 2. 状态标记:☐ 未开始 / 🔄 进行中 / ✅ 完成(附日期) / ⏸ 挂起(附条件) / 🚫 不做(附原因)
> 3. 完成项保留在表内打勾并填完成日期,不删除(留档);需要详细记录的写进 GEO_PROGRESS.md 后在此注明链接
> 4. 各文档不再各自记待办,统一指向本文件
> **关联**: [GEO_PROGRESS.md](GEO_PROGRESS.md) · [GEO_PLAYBOOK.md](GEO_PLAYBOOK.md) · [admin-i18n-geo-upgrade.md](admin-i18n-geo-upgrade.md) · [EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md](EXTERNAL_ENTITY_ALIGNMENT_GUIDE.md)

---

## DEC · 待决策(阻塞项,先拍板)

| ID | 事项 | 说明 | 状态 |
|----|------|------|------|
| DEC-1 | LinkedIn slug 定稿 | ✅ 2026-09-20 定稿 **kestrelmetal**(https://www.linkedin.com/company/kestrelmetal,无痕窗口公开访问验证通过) | ✅ 09-20 |
| DEC-2 | 公司地址英文写法定稿 | ✅ 2026-09-20 定为 "Anping Industrial Zone, Anping County, Hengshui, Hebei 053600, China"(与站内 schema 一致) | ✅ 09-20 |
| DEC-3 | YouTube 频道建或不建 | ✅ 2026-09-20 定为**暂保留**(档案待建;建好前不进任何平台链接/sameAs) | ✅ 09-20 |

---

## P0 · 本周(数据流动 + 部署风险)

| ID | 事项 | 说明 / 验收标准 | 负责 | 状态 |
|----|------|----------------|------|------|
| GEO-01 | 首轮基线测试 | 10 条 Prompt(推荐/对比/合规各 3-4)× ChatGPT(联网)/Perplexity/Gemini;结果录入管理台「基线验证」。验收:产出第一份引用率基线 | 人工测试 + AI 记录 | ☐ |
| GEO-02 | 生产/本地 sitemap 差异修复 | 线上 207 vs 本地 198,找出多出的 9 个页面并同步本地副本。验收:差异清单 + 本地补齐,消除部署覆盖风险 | AI | ☐ |
| ENT-00 | 创建统一信息包 entity-fact-sheet.md | ✅ 2026-09-20 完整定稿([entity-fact-sheet.md](entity-fact-sheet.md)):DEC-1/2/3 全部关闭,字段 + 三版描述 + 平台登记表齐备 | AI | ✅ 09-20 |
| ENT-06 | LinkedIn 页面补全 | ✅ 2026-09-20:概述(长简介)、专业领域、地点(Anping Industrial Zone)、行业 已更新完成。**剩余**:有效邮箱域名添加(kestrelmetal.com,后台提醒项)+ 按内容计划发前 3 篇帖子([LINKEDIN_CONTENT_PLAN.md](LINKEDIN_CONTENT_PLAN.md)) | 人工 | 🔄 |
| SITE-01 | 站内 schema 联系信息对齐 | 电话格式 `+86-17832383339` → `+86 17832383339`、schema 邮箱 `sales@` → `kalee@`(主)、员工 60-100 → 51-100;改动点:`perf-scripts/static-jsonld.js` + `js/seo-enhance.js`,随下次 schema 重建/部署一并执行(数字主体不变,不紧急) | AI | ☐ |
| GEO-03 | GA4 ai_referral 数据首查 | 确认事件在积累、自定义维度可查,定型月度查看路径 | 人工 | ☐ |

## P1 · 30 天

| ID | 事项 | 说明 / 验收标准 | 负责 | 状态 |
|----|------|----------------|------|------|
| GEO-04 | 低分页 Top20 补强 | 管理台评分排序取最低 20 页,补段首定义句 + "数字+单位"事实点。验收:复测评分上升 | AI + 人工审核 | ☐ |
| ENT-01 | Europages 建档 | 免费供应商账户、域名邮箱注册、信息包全量填写、≥5 张产品图。验收:档案 URL 存档进 ENT-05 | 人工 | ☐ |
| GEO-05 | llms.txt 月度更新机制 | 新博客/新证据点每月同步进 llms.txt,挂入月度循环(见 GEO-08) | AI | ☐ |

## P2 · 90 天

| ID | 事项 | 说明 / 验收标准 | 负责 | 状态 |
|----|------|----------------|------|------|
| ENT-02 | Thomasnet 建档 | Add Your Business(国际供应商),人工审核周期长尽早提交。验收:上线确认 + URL 存档 | 人工 | ☐ |
| ENT-03 | Google Business Profile | 发起认领(验证明信片/视频 2-4 周,只发起不等待);类别 Manufacturer 主 + Fencing Supplier 次;≥10 张照片。验收:通过验证 | 人工 | ☐ |
| ENT-04 | Wikidata 条目 | 前置:ENT-01/02 上线后用其作第三方引用,降低删除风险;属性 P571/P856/P159/P1056 + 引用。验收:存活 2 周无删除模板 | AI 起草 + 人工提交 | ☐ |
| ENT-05 | sameAs 回加(持续) | 每个档案上线后:URL 加进 static-jsonld 生成器 → 跑回加脚本 → llms.txt 补行 → 推 Gitee 部署 → 管理台 JSON-LD 校验 0 失败 | AI | ☐ |
| GEO-06 | 对比类内容按关键词簇产出 | 接入现有 SEO 关键词簇流水线(feat(seo) cluster 提交),一个簇一篇对比文带数据表 | AI + 人工审核 | ☐ |
| GEO-07 | FAQ 扩容 23 → 40+ | 用管理台 FAQ 模块录入(与 GEO 问答单一数据源),页面真实渲染 + FAQPage schema | AI + 人工审核 | ☐ |
| GEO-08 | 月度循环固化 | 审计脚本 → 评分 → 基线测试 → 补内容 → 更新 llms.txt;写入 operations-checklist.md,每月一轮 | AI | ☐ |

## P3 · 远期(触发式,到条件再做)

| ID | 事项 | 触发条件 | 状态 |
|----|------|---------|------|
| ADMIN-01 | GA4 ai_referral 数据面板 | 接真后端 / OAuth 凭据可用时,分析板块加 Tab 拉 GA4 Data API | ☐ |
| ADMIN-02 | 诊断基线历史导出 | 需要跨设备/长期留存时,localStorage 升级为可导出 | ☐ |
| GEO-09 | 半年 KPI 复盘 | 2027-03:引用率趋势 / ai_referral 会话/月 / 全站平均分(当前高 32/中 93/低 73) | ☐ |
| I18N-01 | 多语言构建接入 | 决定做语言站点时:语言包导出 → 构建期注入双语页 + hreflang + 分语言 sitemap | ☐ |
| SCHEMA-01 | Schema 模板接入生成器 | static-jsonld.js 需要自定义类型扩展时,读取 perf-scripts/geo-schema-templates.json | ☐ |

---

## 完成归档

> 完成的条目在表内打 ✅ + 日期;需要过程记录的写 GEO_PROGRESS.md 对应轮次并在此注明。

| ID | 事项 | 完成日期 | 记录 |
|----|------|---------|------|
| (示例)GEO-00 | Admin GEO/i18n 板块 P0-P2 全链路改造 | 2026-09-19 | [admin-i18n-geo-upgrade.md](admin-i18n-geo-upgrade.md) |
