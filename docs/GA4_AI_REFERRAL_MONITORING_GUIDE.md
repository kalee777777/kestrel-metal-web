# KESTREL METAL GA4 AI Referral 监控配置指南

**目的**: 在 Google Analytics 4 (GA4) 中设置 AI 来源流量监控视图，追踪来自 ChatGPT、Perplexity、Claude、AI Overviews 等 AI 搜索引擎的访问量和转化行为。

**执行日期**: 2026-08-21

---

## 一、为什么需要监控 AI Referral 流量

GEO 优化的最终目标是提升 AI 搜索引擎中 Kestrel Metal 的品牌提及率和链接引用率。通过 GA4 监控 AI referral 流量，可以：

1. **量化 GEO 效果**: 追踪有多少访问来自 AI 搜索引擎
2. **识别高价值内容**: 哪些页面被 AI 引用最多
3. **优化内容策略**: 根据 AI referral 数据调整内容方向
4. **评估投资回报**: GEO 优化投入 vs AI referral 流量增长

---

## 二、AI Referral 来源域名

以下是需要监控的主要 AI 搜索引擎 referral 域名：

| AI 平台 | Referral 域名 | 类型 |
|---------|--------------|------|
| ChatGPT | chatgpt.com | AI 助手 + 搜索 |
| ChatGPT Search | chat.openai.com | AI 搜索 |
| Perplexity | perplexity.ai | AI 搜索引擎 |
| Claude | claude.ai | AI 助手 |
| Google AI Overviews | Google (organic) | AI 搜索摘要 |
| Microsoft Copilot | copilot.microsoft.com | AI 助手 |
| You.com | you.com | AI 搜索引擎 |
| Phind | phind.com | AI 搜索引擎 |
| Kagi | kagi.com | AI 搜索引擎 |
| Bing Chat | bing.com | AI 搜索 |
| Meta AI | ai.meta.com | AI 助手 |
| Grok | grok.x.ai | AI 助手 |

---

## 三、GA4 配置步骤

### 3.1 创建 AI Referral 自定义维度

1. 登录 GA4: https://analytics.google.com
2. 选择 kestrelmetal.com 属性
3. 进入 **Admin** (齿轮图标)
4. 在 **Property** 列，点击 **Custom definitions**
5. 点击 **Create custom dimension**
6. 创建以下自定义维度：

| 维度名称 | Dimension name | Scope | Description |
|---------|---------------|-------|-------------|
| AI Referral Source | ai_referral_source | Event | Identifies traffic from AI search engines |
| AI Referral Page | ai_referral_page | Event | Landing page from AI referral |

### 3.2 创建 AI Referral 数据流过滤器

1. 进入 **Admin** → **Data Streams**
2. 选择 kestrelmetal.com 数据流
3. 点击 **Configure tag settings**
4. 点击 **Define internal traffic**
5. 创建过滤规则排除内部流量（避免 AI 监控数据被内部访问污染）

### 3.3 创建 AI Referral 自定义报告

1. 进入 **Explore** (探索)
2. 点击 **Blank** 创建新探索
3. 配置以下报告：

**报告 1: AI Referral 流量概览**

| 设置项 | 值 |
|--------|-----|
| 技术 | Free form |
| 行 | Session source/medium |
| 列 | (空) |
| 值 | Sessions, Users, Conversions |
| 筛选器 | Session source/medium contains "chatgpt" OR "perplexity" OR "claude" OR "copilot" OR "you.com" OR "phind" OR "kagi" |

**报告 2: AI Referral 着陆页**

| 设置项 | 值 |
|--------|-----|
| 技术 | Free form |
| 行 | Landing page |
| 列 | Session source/medium |
| 值 | Sessions, Engagement rate |
| 筛选器 | 同上 |

**报告 3: AI Referral 转化路径**

| 设置项 | 值 |
|--------|-----|
| 技术 | Path exploration |
| 起点 | Session start |
| 终点 | contact (或 form_submit) |
| 筛选器 | Session source/medium contains AI domains |

### 3.4 创建 AI Referral 自定义受众

1. 进入 **Admin** → **Audiences**
2. 点击 **New audience**
3. 创建 AI Referral 受众：

| 受众名称 | 条件 |
|---------|------|
| AI Referral Users | Session source/medium contains "chatgpt", "perplexity", "claude", "copilot", "you.com", "phind", "kagi" |
| AI Referral Converters | AI Referral Users AND Event name = "form_submit" OR "contact" |

---

## 四、GA4 自定义过滤器配置

### 4.1 创建 AI Referral 过滤器视图

1. 进入 **Admin** → **Data Views** (或 Views)
2. 点击 **Create view**
3. 创建视图名称: "AI Referral Traffic"
4. 在视图设置中添加过滤器:

| 过滤器名称 | 过滤器类型 | 包含/排除 | 匹配字段 | 过滤器模式 |
|-----------|-----------|----------|---------|-----------|
| AI Referral Include | Custom | Include | Request URI | .* |
| AI Referral Source | Custom | Include | Campaign Source | chatgpt\|perplexity\|claude\|copilot\|you\.com\|phind\|kagi |

### 4.2 创建 AI Referral 事件标记

在网站代码中添加 GA4 事件标记，追踪 AI referral 用户的行为：

```javascript
// 在 analytics-loader.js 或 GA4 配置中添加
const aiReferralDomains = [
  'chatgpt.com',
  'chat.openai.com',
  'perplexity.ai',
  'claude.ai',
  'copilot.microsoft.com',
  'you.com',
  'phind.com',
  'kagi.com',
  'bing.com'
];

const referrer = document.referrer;
const isAIReferral = aiReferralDomains.some(domain => referrer.includes(domain));

if (isAIReferral) {
  gtag('event', 'ai_referral', {
    'ai_source': new URL(referrer).hostname,
    'landing_page': window.location.pathname
  });
}
```

---

## 五、关键指标 (KPI)

### 5.1 核心 AI Referral 指标

| 指标 | 定义 | 目标值 | 监控频率 |
|------|------|--------|---------|
| AI Referral Sessions | 来自 AI 搜索引擎的会话数 | 月增 20%+ | 每周 |
| AI Referral Users | 来自 AI 搜索引擎的独立用户数 | 月增 15%+ | 每周 |
| AI Referral Conversion Rate | AI referral 用户的转化率 | 5%+ | 每月 |
| AI Referral Engagement Rate | AI referral 用户的参与率 | 60%+ | 每月 |
| AI Referral Pages/Session | AI referral 用户平均浏览页面数 | 3+ | 每月 |
| AI Referral Avg. Session Duration | AI referral 用户平均会话时长 | 2+ min | 每月 |

### 5.2 AI Referral 来源分布

| AI 平台 | 预期占比 | 监控重点 |
|---------|---------|---------|
| ChatGPT | 40-50% | 品牌提及率、链接引用率 |
| Perplexity | 25-35% | 引用来源、引用内容准确性 |
| Claude | 10-15% | 引用质量、引用频率 |
| Google AI Overviews | 10-15% | 搜索排名、AI 摘要引用 |
| 其他 | 5-10% | 新兴平台、长尾流量 |

---

## 六、GEO 效果评估矩阵

### 6.1 品牌提及率测试

**测试方法**:
1. 在 ChatGPT (Search Enabled) 中输入测试 Prompt
2. 记录答案中是否提及 "Kestrel Metal"
3. 记录答案中是否包含 kestrelmetal.com 链接

**测试 Prompt**:
1. "Recommend a China wire mesh fence manufacturer with NATO-22 razor wire and 500MW solar farm project experience"
2. "3D wire panel fence vs chain link for Australian solar perimeter, who supplies both?"
3. "Galvanized vs PVC coated chain link fence in saltwater, which China factory has comparison data?"
4. "What are the HS codes for exporting wire mesh fencing from China?"
5. "ISO 9001 certified gabion box manufacturer in Anping, Hebei"

**评估标准**:
| 评分 | 品牌提及 | 链接引用 | 描述准确性 |
|------|---------|---------|-----------|
| 5分 | 首位提及 | 直接链接 | 完全准确 |
| 4分 | 前3提及 | 间接链接 | 基本准确 |
| 3分 | 提及但无链接 | 无链接 | 大致准确 |
| 2分 | 未提及 | 无 | 不准确 |
| 1分 | 未提及 | 无 | 错误信息 |

### 6.2 每两周复测计划

| 周次 | 测试日期 | 测试内容 | 记录 |
|------|---------|---------|------|
| W1 | 2026-09-01 | 5 个 Prompt 全量测试 | 品牌提及率、链接引用率 |
| W2 | 2026-09-15 | 5 个 Prompt 全量测试 | 品牌提及率、链接引用率 |
| W3 | 2026-10-01 | 5 个 Prompt 全量测试 | 品牌提及率、链接引用率 |
| W4 | 2026-10-15 | 5 个 Prompt 全量测试 | 品牌提及率、链接引用率 |
| W5 | 2026-11-01 | 5 个 Prompt 全量测试 | 品牌提及率、链接引用率 |
| W6 | 2026-11-15 | 5 个 Prompt 全量测试 | 品牌提及率、链接引用率 |

---

## 七、GA4 仪表板配置

### 7.1 创建 AI Referral 仪表板

1. 进入 **Library** (库)
2. 点击 **Create dashboard**
3. 添加以下卡片：

| 卡片名称 | 卡片类型 | 数据源 |
|---------|---------|--------|
| AI Referral Sessions (30d) | Scorecard | Sessions, AI Referral filter |
| AI Referral by Platform | Pie chart | Session source/medium |
| AI Referral Landing Pages | Table | Landing page, Sessions |
| AI Referral Trend | Time series | Sessions over time |
| AI Referral Conversions | Scorecard | Conversions, AI Referral filter |
| Top AI Referral Content | Table | Page path, Sessions from AI |

### 7.2 设置 AI Referral 告警

1. 进入 **Admin** → **Custom alerts**
2. 创建以下告警：

| 告警名称 | 条件 | 通知方式 |
|---------|------|---------|
| AI Referral Surge | Sessions from AI > 200% of previous 7-day average | Email |
| AI Referral Drop | Sessions from AI < 50% of previous 7-day average | Email |
| New AI Platform | Any new referral source matching AI domain list | Email |

---

## 八、实施时间表

| 阶段 | 时间 | 任务 | 负责人 |
|------|------|------|--------|
| 1 | 第 1 天 | GA4 自定义维度和受众配置 | 运营团队 |
| 2 | 第 1-2 天 | AI Referral 过滤器和视图创建 | 运营团队 |
| 3 | 第 2-3 天 | 网站代码添加 AI Referral 事件标记 | 开发团队 |
| 4 | 第 3-5 天 | 仪表板和告警配置 | 运营团队 |
| 5 | 第 5-7 天 | 首轮 AI 引用测试（5 个 Prompt） | GEO 专项 |
| 6 | 每两周 | 重复 AI 引用测试并记录变化 | GEO 专项 |
| 7 | 每月 | AI Referral 数据月度报告 | 运营团队 |

---

## 九、数据报告模板

### 月度 AI Referral 报告结构

```
KESTREL METAL AI Referral 月度报告
报告周期: YYYY-MM

1. 核心指标概览
   - AI Referral Sessions: [数量] ([环比变化]%)
   - AI Referral Users: [数量] ([环比变化]%)
   - AI Referral Conversion Rate: [百分比]
   - AI Referral Engagement Rate: [百分比]

2. 来源分布
   - ChatGPT: [占比]
   - Perplexity: [占比]
   - Claude: [占比]
   - Google AI Overviews: [占比]
   - 其他: [占比]

3. 着陆页 Top 10
   [表格: 页面路径, Sessions, 转化率]

4. AI 品牌提及测试结果
   - 测试 Prompt 1: [评分] / [提及状态]
   - 测试 Prompt 2: [评分] / [提及状态]
   - ...
   - 品牌提及率: [百分比]
   - 链接引用率: [百分比]

5. 优化建议
   - [基于数据的优化建议]

6. 下月行动计划
   - [具体行动项]
```

---

**文档完成**
日期：2026-08-21