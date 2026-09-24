# Kestrel Metal 官网运维清单

> **文档版本**: v1.0
> **创建日期**: 2026-08-19
> **适用范围**: www.kestrelmetal.com 全站日常维护

---

## 一、每日例行（约 5 分钟）

| # | 检查项 | 操作方法 | 异常判断 |
|---|--------|----------|----------|
| 1 | **网站可用性** | 浏览器打开 `https://www.kestrelmetal.com` | 页面加载失败、白屏、5xx 错误 |
| 2 | **Umami 实时访客** | 登录 Umami 后台查看实时地图 | 在线访客数异常归零 |
| 3 | **询盘表单** | 检查邮箱是否有新询盘到达 | 长时间无询盘可能表单故障 |

---

## 二、每周例行（约 15 分钟）

| # | 检查项 | 操作方法 | 说明 |
|---|--------|----------|------|
| 1 | **GA4 基础数据** | [GA4 Reports](https://analytics.google.com) → 流量获取 → 概览 | 关注：总用户数、会话数、跳出率 |
| 2 | **GA4 页面表现** | GA4 → 页面与屏幕 → 按页面浏览量排序 | 发现异常高/低流量页面 |
| 3 | **GSC 索引状态** | [GSC](https://search.google.com/search-console) → 索引 → 网页 | "已编入索引"数量是否持续增长 |
| 4 | **GSC sitemap 状态** | GSC → Sitemaps → 查看状态 | 保持"成功"，URL 数 ≥ 190 |
| 5 | **GSC 搜索表现** | GSC → 效果 → 搜索结果 | 关注：展示次数、点击次数、平均排名 |
| 6 | **链接检查** | 手动点击 3-5 个产品页内部链接 | 确认无 404 死链 |

---

## 三、每月例行(约 30 分钟)

| # | 检查项 | 操作方法 | 说明 |
|---|--------|----------|------|
| 1 | **GSC 覆盖率报告** | GSC → 索引 → 网页 → 筛选"错误" | 排查爬取错误、被排除页面 |
| 2 | **GA4 搜索关键词** | GSC → 效果 → 排名靠后的查询词 | 优化低排名但高潜力关键词的页面内容 |
| 3 | **Umami 来源分析** | Umami → 来源 | 识别主要流量渠道、优化来源差的渠道 |
| 4 | **Umami 热门页面** | Umami → 页面 | 对比上月变化趋势 |
| 5 | **Cloudflare 部署日志** | Cloudflare Dashboard → Workers → kestrel-metal-web → Deployments | 确认最近部署成功 |
| 6 | **SSL 证书状态** | Cloudflare → SSL/TLS → 边缘证书 | 确认自动续期正常 |
| 7 | **页面加载速度** | Chrome → F12 → Lighthouse → Generate report | LCP < 2.5s, CLS < 0.1 |
| 8 | **移动端适配** | Chrome DevTools → 手机视图 → 浏览主要页面 | 确认无布局错位 |
| 9 | **3D 模型加载** | 访问 5 个含 3D 模型的产品页 | 确认所有 3D 模型正常加载 |
| 10 | **GEO 月度审计结果** | Admin → GEO 优化 → GEO 评分(geo-audit 1 号 09:00 自动跑) | 看全站平均分与低分页变化;补丁在「GEO 补强」Tab 审核 |
| 11 | **GEO 补丁 PR 合并** | Admin → GEO 补强 → 批准 → 开 PR → GitHub 合并 | 合并即自动部署;部署后下轮审计复测分数 |
| 12 | **GA4 AI Referral 报告** | GA4 探索「AI Referral 月度报告」 | AI 引用带来的会话/来源/着陆页,日期改上月 |

---

## 二·B、GEO 自动化流水线(cron 驱动,人工只做审核)

> 2026-09-25 上线。生成侧 GEO 强化 + llms.txt/FAQ 闭环 + 月度审计三段式,
> 复用 DeepSeek key 与 Worker/KV 架构,静态页补强经 GitHub PR 人工合并。

| 时机 | 自动动作 | 人工动作 |
|------|---------|---------|
| 每日 04:00/05:00(北京) | 文章生成 + 双门禁发布(SEO ≥60 **且 GEO ≥70**):首段定义句、FAQPage schema 服务端注入、事实密度;发布自动追加 llms.txt 条目 | 无 |
| 每周日 07:00(北京) | geo-faq:从竞品缺口/GSC 机会词生成 3 条含数字事实的 FAQ → KV 待审 | Admin → FAQ 管理:待审行「✓ 启用」(即时上线 faq.html) |
| 每月 1 号 09:00(北京) | geo-audit:全站逐页 GEO 评分 → KV geo:scores;低分页生成补丁(定义句+事实点)→ KV geo:patches | Admin → GEO 补强:批准/编辑补丁 → 「开 PR」→ GitHub 合并(合并即部署) |
| 每月 1 号 08:00(北京) | 月报附 GEO 段(平均分/分布/llms 新增/FAQ 待审数) | 无 |

**前置配置**(一次性):`wrangler secret put GH_TOKEN`(fine-grained,仅 `kalee777777/kestrel-metal-web` 仓库 Contents + Pull requests 读写);Admin → FAQ 管理 → 本地存量一键上传。
**手动补跑**:`POST /api/trigger/geo-faq`、`POST /api/trigger/geo-audit`(ADMIN_TOKEN);审计耗时数分钟属正常。
**回退**:清空 KV `geo:llms:entries` 恢复纯静态 llms.txt;FAQ 注入随 `is_active=false` 即停;补丁不批准则永不进仓库。

---


## 四、每季度例行

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | **robots.txt 检查** | 访问 `https://www.kestrelmetal.com/robots.txt`，确认 Sitemap 路径正确 |
| 2 | **sitemap.xml 完整性** | 对比实际页面数与 sitemap 中 URL 数，新增/删除页面时更新 |
| 3 | **结构化数据验证** | [Google Rich Results Test](https://search.google.com/test/rich-results) 抽查 2-3 个页面 |
| 4 | **竞品 SEO 分析** | 检查主要竞争对手的关键词排名变化 |
| 5 | **Umami 免费额度** | Umami 免费版月 10,000 PV，查看是否接近上限 |
| 6 | **内容更新** | 补充博客文章、更新产品参数、新增案例研究 |
| 7 | **安全更新** | 检查 Cloudflare 安全事件日志，确认无异常攻击 |
| 8 | **图片检查** | 抽查产品页图片是否加载正常、是否有失效图片 |

---

## 五、紧急响应（异常处理）

| 异常现象 | 排查步骤 | 修复方法 |
|----------|----------|----------|
| **网站完全打不开** | ① 检查 Cloudflare Workers Deployments ② 查看是否误提交 `_redirects` / `_headers` | 删除问题文件 → `git push github main` |
| **www.域名 522 错误** | ① DNS 中是否有 www CNAME ② Workers 是否配置了 Route | 添加 CNAME + Route（详见 PROJECT_DOCUMENT.md 第六节） |
| **sitemap.xml GSC 显示"无法抓取"** | 浏览器直接访问 sitemap.xml 确认 | 修复域名配置 → GSC 重新提交 |
| **GA4 / Umami 数据归零** | ① 检查 `analytics-loader.js` 中的 ID 是否正确 ② 是否误删了脚本加载代码 | 检查并修复 ID 配置 |
| **新页面未被 Google 收录** | GSC → URL 检查 → 输入新页面 URL → 请求编入索引 | 主动请求索引 + 更新 sitemap |
| **某产品页白屏** | 浏览器 F12 → Console 查看报错 | 根据报错修复 JS/CSS |

---

## 六、内容发布检查清单（新增/修改页面时）

| # | 检查项 | 必须 |
|---|--------|------|
| 1 | `<title>` 标签包含关键词 | ✅ |
| 2 | `<meta description>` 150 字以内 | ✅ |
| 3 | `<link rel="canonical">` 指向当前页 | ✅ |
| 4 | Open Graph / Twitter Card 标签 | ✅ |
| 5 | JSON-LD 结构化数据 | ✅ |
| 6 | 所有图片有 `alt` 属性 | ✅ |
| 7 | 图片已压缩（WebP 格式优先） | ✅ |
| 8 | 内部链接指向正确的产品子页面 | ✅ |
| 9 | 3D 模型文件 ≤ 25MB | ✅ |
| 10 | sitemap.xml 已添加新页面 URL | ✅ |
| 11 | 导航栏链接是否已更新 | ✅ |
| 12 | 移动端显示正常 | ✅ |

---

## 七、关键账号与配置信息速查

| 项目 | 地址 / ID |
|------|-----------|
| **GA4 Measurement ID** | `G-Q5WHY8L8BN` |
| **Umami Website ID** | `a7ba74c4-ee31-414b-8a9c-2fa239ae7557` |
| **Umami 后台** | `https://cloud.umami.is` |
| **GA4 后台** | `https://analytics.google.com` |
| **Google Search Console** | `https://search.google.com/search-console` |
| **Cloudflare Dashboard** | `https://dash.cloudflare.com` |
| **GitHub 仓库** | `kalee777777/kestrel-metal-web` |
| **Gitee 备份仓库** | `kestrelmetal_0/kestrel-static-site` |
| **主域名** | `https://www.kestrelmetal.com` |
| **Workers 配置** | Workers & Pages → `kestrel-metal-web` |

---

*文档版本: v1.0 | 创建者: AI Assistant | 最后更新: 2026-08-19*
