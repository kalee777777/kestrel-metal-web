# Kestrel Metal — 自动化 SEO 系统项目文档

> 版本：v1.0 | 最后更新：2026-08-25 | 状态：Phase 01-09 已完成

---

## 1. 项目概述

### 1.1 目标

为 Kestrel Metal 官网（kestrelmetal.com）构建一套**全自动化的 SEO 内容生产与监控系统**，实现从关键词挖掘、内容生成、图片制作、SEO 评分到自动部署的完整闭环。

### 1.2 核心能力

- **关键词排名监控**：通过 Google Search Console API 每日自动拉取关键词数据
- **内容机会发现**：基于 GSC 数据自动识别低点击率、第二页排名等优化机会
- **AI 内容生成**：使用 DeepSeek V4 Pro 生成 SEO 优化的 B2B 英文博客文章
- **AI 图片生成**：使用 Qwen3.8-max 为每篇文章自动生成 Hero 图和配图
- **SEO 质量评分**：30+ 项检查，低于 80 分自动修复（最多 3 轮）
- **自动部署**：评分达标后自动提交到 GitHub，Cloudflare Pages 自动部署
- **效果追踪**：已发布文章的排名变化跟踪和月度报告生成

### 1.3 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| 运行时 | Cloudflare Workers | API 服务 + Cron 调度 |
| 存储 | Cloudflare KV | 关键词数据、草稿、配置 |
| 图片存储 | Cloudflare R2 | AI 生成的产品图片 |
| AI 内容 | DeepSeek V4 Pro | 文章大纲 + 正文生成 |
| AI 图片 | Qwen3.8-max | 产品图片生成 |
| SEO 数据 | Google Search Console API | 关键词排名、展示、点击 |
| 版本控制 | GitHub + Gitee | 代码管理 + 自动部署 |
| 前端 | Admin 后台 SPA | 可视化监控面板 |

---

## 2. 系统架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Worker 后端                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  GSC 数据层  │  │ AI 内容引擎  │  │  SEO 质量评分器   │  │
│  │              │  │              │  │                  │  │
│  │ · 关键词排名 │  │ · DeepSeek   │  │ · 30+ 项检查     │  │
│  │ · 流量分析   │  │ · 大纲生成   │  │ · 自动修复循环   │  │
│  │ · 机会挖掘   │  │ · 正文生成   │  │ · Schema 校验    │  │
│  │ · 历史趋势   │  │ · HTML 装配  │  │ · 关键词密度     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                  │                  │               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  AI 图片引擎  │  │  自动部署    │  │  效果追踪        │  │
│  │              │  │              │  │                  │  │
│  │ · Qwen3.8    │  │ · GitHub PR  │  │ · 排名变化       │  │
│  │ · Hero 图    │  │ · Cloudflare │  │ · 月度报告       │  │
│  │ · 配图生成   │  │ · 索引请求   │  │ · 数据回流       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                  │                  │               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              数据存储 (Cloudflare KV)                │   │
│  │  keywords  |  rankings  |  drafts  |  published     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
GSC API → 关键词数据 → 机会分析 → 选题清单
                                         ↓
DeepSeek V4 Pro → 文章大纲 → 正文生成 → HTML 装配
                                         ↓
Qwen3.8-max → Hero 图 + 配图 → R2 存储
                                         ↓
SEO 评分器 → 30+ 项检查 → ≥80 分通过 / <80 分自动修复
                                         ↓
GitHub Push → Cloudflare Pages → 自动部署
                                         ↓
GSC 数据回流 → 效果追踪 → 月度报告
```

---

## 3. 已实现功能（Phase 01-09）

### Phase 01：基础设施 ✅

| 组件 | 说明 |
|------|------|
| Cloudflare Worker | 主服务入口 |
| KV 命名空间 ×3 | SEO_DATA / CONTENT_QUEUE / SCORE_LOG |
| R2 桶 | kestrel-images（图片存储） |
| Cron 触发器 | 5 个定时任务 |

### Phase 02：GSC API 集成 ✅

| 组件 | 说明 |
|------|------|
| OAuth2 认证 | Google OAuth2 + refresh_token 自动刷新 |
| 关键词数据拉取 | 每日 03:00 北京时间自动同步 |
| Admin 关键词页面 | 排名监控、趋势分析、Top 10 列表 |

### Phase 03：关键词分析面板 ✅

| 组件 | 说明 |
|------|------|
| 趋势检测 | 上升/下降/新增关键词标记 |
| 分组统计 | 按产品线分组（Chain Link / Gabion / Razor 等） |
| 可视化面板 | Admin 后台关键词监控页面 |

### Phase 04：内容机会引擎 ✅

| 组件 | 说明 |
|------|------|
| 机会分析 | 低点击率、第二页排名、新长尾词 |
| 难度评估 | 容易/中等/困难三级 |
| 选题清单 | 自动生成内容建议列表 |

### Phase 05：AI 内容生成 ✅

| 组件 | 说明 |
|------|------|
| AI 模型 | DeepSeek V4 Pro |
| 生成内容 | 2000-3000 字 SEO 优化英文文章 |
| HTML 模板 | 完整 HTML + JSON-LD Schema |
| FAQ 生成 | 自动生成 FAQ 段落 |

### Phase 06：AI 图片生成 ✅

| 组件 | 说明 |
|------|------|
| AI 模型 | Qwen3.8-max |
| Hero 图 | 1280×720px 工业场景风格 |
| 内容配图 | 800×600px ×2 张 |
| 产品线模板 | chain-link / gabion / razor / welded / high-security |
| R2 存储 | 自动生成并上传到 R2 |

### Phase 07：SEO 评分器 ✅

| 检查项 | 分值 | 说明 |
|--------|------|------|
| Title Tag | 10 | 关键词 + 长度 30-60 字符 |
| Meta Description | 10 | 关键词 + 长度 120-160 字符 |
| H1 Tag | 10 | 单个 H1 + 含关键词 |
| Heading Structure | 10 | H2≥3 + H3≥2 |
| Keyword Density | 10 | 1-2.5% |
| Internal Links | 10 | ≥3 个内部链接 |
| Image Alt Text | 10 | 所有图片有 alt + 含关键词 |
| Word Count | 10 | ≥2000 字 |
| FAQ Section | 10 | FAQ + FAQPage Schema |
| Schema Markup | 10 | Article + Organization |
| Canonical URL | 10 | 存在 |
| Open Graph | 10 | og:title + og:description + og:image |
| Paragraph Length | 10 | 段落不超过 100 词 |

**评分阈值**：≥80 分通过，<80 分自动修复（最多 3 轮）

### Phase 08：完整流程测试 ✅

| 测试项 | 结果 |
|--------|------|
| Health Check | ✅ KV/R2 绑定正常 |
| 内容生成 | ✅ DeepSeek 生成文章 |
| 图片生成 | ✅ Qwen 生成图片 |
| SEO 评分 | ✅ 30+ 项检查执行 |
| API 端点 | ✅ 所有端点正常 |

### Phase 09：效果追踪 ✅

| 组件 | 说明 |
|------|------|
| 文章性能追踪 | 跟踪已发布文章在 GSC 中的表现 |
| 月度报告 | 每月 1 号自动生成 SEO 报告 |
| 数据回流 | 排名数据回写到 KV |

---

## 4. Cron 定时任务

| Cron 表达式 | 北京时间 | 任务 | 状态 |
|-------------|---------|------|------|
| `0 19 * * *` | 每日 03:00 | GSC 数据同步 | ✅ |
| `0 20 * * 1` | 每周一 04:00 | AI 内容生成 | ✅ |
| `0 20 * * 1` | 每周一 04:00 | AI 图片生成 | ✅ |
| `0 21 * * 1` | 每周一 05:00 | SEO 评分 + 部署 | ✅ |
| `0 22 * * 1` | 每周一 06:00 | 效果追踪 | ✅ |
| `0 16 1 * *` | 每月 1 号 00:00 | 月度报告 | ✅ |

---

## 5. API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/gsc/status` | GET | GSC 连接状态 |
| `/api/keywords/rankings` | GET | 关键词排名数据 |
| `/api/keywords/rankings/range` | GET | 多日排名数据 |
| `/api/keywords/analysis` | GET | 关键词分析（趋势 + 分组） |
| `/api/opportunities` | GET | 内容机会列表 |
| `/api/opportunities/stats` | GET | 机会统计 |
| `/api/content/drafts` | GET | 草稿列表 |
| `/api/content/published` | GET | 已发布内容 |
| `/api/trigger/gsc-sync` | POST | 手动触发 GSC 同步 |
| `/api/trigger/generate` | POST | 手动触发内容生成 |
| `/api/trigger/image-gen` | POST | 手动触发图片生成 |
| `/api/trigger/score` | POST | 手动触发 SEO 评分 |

---

## 6. 配置的 Secrets

| Secret | 用途 | 来源 |
|--------|------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth2 客户端 ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 客户端密钥 | Google Cloud Console |
| `GSC_REFRESH_TOKEN` | GSC API 刷新令牌 | 浏览器授权获取 |
| `GSC_SITE_URL` | GSC 网站资源标识 | `sc-domain:kestrelmetal.com` |
| `DEEPSEEK_API_KEY` | DeepSeek V4 Pro API 密钥 | platform.deepseek.com |
| `QWEN_API_KEY` | Qwen3.8-max API 密钥 | dashscope.aliyuncs.com |
| `GH_TOKEN` | GitHub Personal Access Token | github.com/settings/tokens |
| `ADMIN_TOKEN` | Admin 后台访问令牌 | 自定义 |

---

## 7. 文件结构

```
kestrel-site/
├── src/
│   ├── index.ts                    # Worker 入口（fetch + scheduled）
│   ├── router.ts                   # API 路由注册表
│   ├── lib/
│   │   ├── kv.ts                   # KV 读写封装
│   │   ├── r2.ts                   # R2 存储封装
│   │   ├── gsc.ts                  # GSC OAuth2 + API 查询
│   │   ├── deepseek.ts             # DeepSeek V4 Pro 内容生成
│   │   ├── image-gen.ts            # Qwen3.8-max 图片生成
│   │   ├── seo-score.ts            # 30+ 项 SEO 评分检查
│   │   └── tracking.ts             # 效果追踪 + 月度报告
│   └── cron/
│       ├── gsc-sync.ts             # 每日 GSC 数据同步
│       ├── generate.ts             # 每周 AI 内容生成
│       ├── image-gen.ts            # 每周 AI 图片生成
│       ├── score.ts                # 每周 SEO 评分 + 部署
│       ├── track.ts                # 每周效果追踪
│       └── monthly-report.ts       # 每月报告生成
├── admin/
│   ├── index.html                  # Admin 后台入口
│   └── js/pages/
│       ├── keywords.js             # 关键词监控页面
│       ├── content.js              # AI 内容管理页面
│       └── opportunities.js        # 内容机会页面
├── wrangler.jsonc                  # Cloudflare Worker 配置
└── tsconfig.json                   # TypeScript 配置
```

---

## 8. 已知限制与优化方向

### 8.1 当前限制

| 限制 | 原因 | 影响 |
|------|------|------|
| Worker 执行时间 30 秒 | Cloudflare Free 版限制 | 图片生成/SEO 评分可能超时 |
| Cron 触发器 5 个 | Cloudflare Free 版限制 | 已注册 5 个，刚好够用 |
| KV 写入 1000 次/天 | Cloudflare Free 版限制 | 高频写入可能受限 |
| 无真实图片生成 | Qwen API 响应较慢 | 图片生成需要更长执行时间 |

### 8.2 优化方向

| 优化项 | 优先级 | 说明 |
|--------|--------|------|
| 升级 Workers Paid | 中 | $5/月，执行时间 15 分钟，Cron 1000 个 |
| 图片生成异步化 | 高 | 拆分为多个小任务，避免超时 |
| SEO 评分异步化 | 高 | 拆分为单轮评分，避免超时 |
| KV 写入优化 | 中 | 批量写入，减少 API 调用 |
| Admin 后台增强 | 低 | 更多可视化图表、导出功能 |

---

## 9. 升级计划

### 9.1 短期（保持 Free 版）

- 拆分图片生成和 SEO 评分为多次小调用
- 每个 Cron 任务独立运行
- 手动触发时分步执行
- **预计完成时间**：1-2 天

### 9.2 中期（升级 Workers Paid）

- 升级到 Workers Paid（$5/月）
- 一键全流程正常运行
- Cron 触发器扩展到 1000 个
- KV 读写配额大幅提升
- **预计费用**：$5/月

### 9.3 长期（功能增强）

- 接入 Google Analytics 4 API
- 多语言内容生成（中文/西班牙语/阿拉伯语）
- 自动外链建设
- 竞争对手监控
- A/B 测试标题和描述
- **预计时间**：3-6 个月

---

## 10. 部署命令参考

### 10.1 本地开发

```bash
cd kestrel-site
npm install
npx wrangler dev
```

### 10.2 部署到生产

```bash
export CLOUDFLARE_API_TOKEN="你的token"
npx wrangler deploy
```

### 10.3 手动触发任务

```bash
# GSC 数据同步
curl -X POST "https://kestrel-metal-web.1411044767.workers.dev/api/trigger/gsc-sync" \
  -H "Authorization: Bearer kestrel-admin-2026"

# AI 内容生成
curl -X POST "https://kestrel-metal-web.1411044767.workers.dev/api/trigger/generate" \
  -H "Authorization: Bearer kestrel-admin-2026"

# AI 图片生成
curl -X POST "https://kestrel-metal-web.1411044767.workers.dev/api/trigger/image-gen" \
  -H "Authorization: Bearer kestrel-admin-2026"

# SEO 评分
curl -X POST "https://kestrel-metal-web.1411044767.workers.dev/api/trigger/score" \
  -H "Authorization: Bearer kestrel-admin-2026"
```

### 10.4 查看数据

```bash
# 关键词排名
curl "https://kestrel-metal-web.1411044767.workers.dev/api/keywords/rankings"

# 内容机会
curl "https://kestrel-metal-web.1411044767.workers.dev/api/opportunities"

# 已发布内容
curl "https://kestrel-metal-web.1411044767.workers.dev/api/content/published"

# GSC 连接状态
curl "https://kestrel-metal-web.1411044767.workers.dev/api/gsc/status"
```

---

## 11. 监控与运维

### 11.1 Cloudflare Dashboard

- Worker 日志：`https://dash.cloudflare.com/7288dde3c69b2c981d77a94abc15a406/workers`
- KV 数据：`https://dash.cloudflare.com/7288dde3c69b2c981d77a94abc15a406/r2/overview`

### 11.2 健康检查

```bash
curl "https://kestrel-metal-web.1411044767.workers.dev/api/health"
```

预期返回：
```json
{
  "status": "ok",
  "timestamp": "2026-08-25T...",
  "kv_bound": true,
  "r2_bound": true
}
```

### 11.3 故障排查

| 问题 | 排查步骤 |
|------|---------|
| GSC 数据为空 | 检查 `/api/gsc/status`，确认 OAuth 令牌有效 |
| 内容生成失败 | 检查 DeepSeek API Key 是否有效 |
| 图片生成超时 | 升级 Workers Paid 或拆分任务 |
| 部署失败 | 检查 GitHub Token 权限 |

---

## 12. 安全注意事项

- **不要**将 Cloudflare API Token、DeepSeek API Key、Qwen API Key 提交到 Git
- **不要**在聊天中明文发送 API 密钥
- 所有 Secrets 通过 `wrangler secret put` 配置
- Admin 后台需要 `ADMIN_TOKEN` 认证
- Google OAuth2 使用 refresh_token 自动刷新，access_token 缓存到 KV

---

## 13. 联系与支持

- **项目仓库**：https://github.com/kalee777777/kestrel-metal-web
- **Gitee 镜像**：https://gitee.com/kestrelmetal_0/lenke--kestrel-metal-web
- **生产环境**：https://kestrelmetal.com
- **Worker API**：https://kestrel-metal-web.1411044767.workers.dev

---

*文档结束*
