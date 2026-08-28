# 询盘对外 API 接口文档

> 版本：v1.0  
> 更新日期：2026-08-29  
> 适用对象：Kestrel Metal 工作台集成开发者

---

## 目录

1. [功能概述](#1-功能概述)
2. [文件变更清单](#2-文件变更清单)
3. [API 接口规范](#3-api-接口规范)
   - 3.1 [认证机制](#31-认证机制)
   - 3.2 [数据结构](#32-数据结构)
   - 3.3 [接口列表](#33-接口列表)
4. [部署指南](#4-部署指南)
   - 4.1 [前置条件](#41-前置条件)
   - 4.2 [一键部署](#42-一键部署)
   - 4.3 [手动部署步骤](#43-手动部署步骤)
5. [工作台集成指南](#5-工作台集成指南)
   - 5.1 [Python 示例](#51-python-示例)
   - 5.2 [Node.js 示例](#52-nodejs-示例)
   - 5.3 [cURL 示例](#53-curl-示例)
6. [前端同步配置](#6-前端同步配置)
7. [测试与验证](#7-测试与验证)
8. [常见问题 FAQ](#8-常见问题-faq)

---

## 1. 功能概述

本模块为 Kestrel Metal 官网的询盘（Inquiry）系统新增了一套**对外可访问的 REST API 接口**，支持将客户询盘数据直接集成到企业内部工作台系统中，无需登录后台管理页面即可查看和管理所有客户询盘。

### 核心特性

- 🔐 **安全认证**：基于 Bearer Token 的 API 密钥认证机制
- 💾 **持久化存储**：使用 Cloudflare KV 分布式存储，跨设备实时同步
- ⚡ **高性能**：Cloudflare Workers 边缘计算，全球低延迟访问
- 📊 **分页与筛选**：支持分页、关键词搜索、状态筛选
- 🔄 **双向同步**：前台提交的询盘自动同步到后端 KV 存储

### 数据流

```
客户访问官网
    │
    ▼
提交询盘表单 ──► 浏览器 localStorage（后台管理系统读取）
    │
    └──────► Cloudflare KV 存储（对外 API 读取）
                  │
                  ▼
           工作台系统 API 调用
```

---

## 2. 文件变更清单

### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/lib/inquiries.ts` | 询盘数据 CRUD 操作函数（KV 存储层封装） |
| `src/api-inquiries.ts` | 询盘 API 路由和控制器 |
| `scripts/setup-inquiry-api.sh` | 一键部署脚本 |
| `scripts/test-inquiry-api.sh` | API 自动化测试脚本 |

### 修改文件

| 文件路径 | 变更内容 |
|----------|----------|
| `wrangler.jsonc` | 新增 `INQUIRIES` KV 命名空间绑定（ID 占位符） |
| `src/index.ts` | 在 `Env` 接口中新增 `INQUIRIES: KVNamespace` 和 `INQUIRY_API_KEY: string` 类型定义；导入 `./api-inquiries` 模块 |
| `js/contact.js` | 新增 `syncToBackend()` 函数，在 `handleContactSubmit()` 中调用，将询盘数据同步到后端 KV |

---

## 3. API 接口规范

### 3.1 认证机制

所有对外 API 接口均采用 **Bearer Token** 认证方式。

#### 请求头

```http
Authorization: Bearer <YOUR_API_KEY>
```

#### 认证失败响应

```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

> **HTTP 状态码：401 Unauthorized**

⚠️ **安全提示**
- API 密钥请妥善保管，不要提交到代码仓库
- 建议定期轮换 API 密钥（通过 `wrangler secret put INQUIRY_API_KEY` 重新设置）
- 密钥长度为 64 字符十六进制字符串（256 位随机熵）

---

### 3.2 数据结构

#### Inquiry（询盘对象）

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | number | ✅ | 唯一 ID（时间戳 + 随机数） |
| `name` | string | ✅ | 客户姓名 |
| `email` | string | ✅ | 客户邮箱 |
| `phone` | string | ❌ | 联系电话 |
| `company` | string | ❌ | 公司名称 |
| `country` | string | ❌ | 国家/地区 |
| `product_name` | string | ❌ | 感兴趣的产品 |
| `quantity` | string | ❌ | 需求数量 |
| `status` | string | ✅ | 状态：`pending`（待回复）/ `replied`（已回复）/ `closed`（已关闭） |
| `message` | string | ✅ | 询盘内容 |
| `source_page` | string | ❌ | 来源页面路径 |
| `created_at` | string | ✅ | 创建时间（ISO 8601 格式） |
| `replied_at` | string | ❌ | 回复时间（ISO 8601 格式） |
| `replies` | array | ❌ | 回复记录数组 |

#### Reply（回复对象，嵌套在 Inquiry 中）

| 字段 | 类型 | 说明 |
|------|------|------|
| `admin.username` | string | 回复管理员用户名 |
| `content` | string | 回复内容 |
| `created_at` | string | 回复时间（ISO 8601 格式） |

#### 数据示例

```json
{
  "id": 1787935791123,
  "name": "John Smith",
  "email": "john.smith@abc-industries.com",
  "phone": "+1 234 567 8900",
  "company": "ABC Industries Inc.",
  "country": "United States",
  "product_name": "Galvanized Chain Link Fence",
  "quantity": "5,000 meters",
  "status": "replied",
  "message": "Hello, we are looking for a reliable supplier of chain link fencing for our upcoming construction project. Please provide pricing and MOQ details.",
  "source_page": "/contact.html",
  "created_at": "2026-08-29T03:29:51.123Z",
  "replied_at": "2026-08-29T05:12:33.456Z",
  "replies": [
    {
      "admin": { "username": "sales_admin" },
      "content": "Dear John, thank you for your inquiry. We can supply 5,000m at $X/m...",
      "created_at": "2026-08-29T05:12:33.456Z"
    }
  ]
}
```

---

### 3.3 接口列表

#### 3.3.1 获取询盘列表（分页）

获取询盘数据列表，支持分页、搜索和状态筛选。

```
GET /api/external/inquiries
```

##### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|:------:|------|
| `page` | number | 1 | 页码（从 1 开始） |
| `pageSize` | number | 20 | 每页条数（最大 100） |
| `search` | string | "" | 关键词搜索，匹配字段：name / email / company / product_name / message |
| `status` | string | "" | 状态筛选：`pending` / `replied` / `closed`，留空返回全部 |

##### 成功响应

```json
{
  "data": [
    { /* Inquiry 对象 */ },
    { /* Inquiry 对象 */ }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 156,
  "totalPages": 8
}
```

##### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | array | 当前页询盘数据数组，按创建时间倒序排列 |
| `page` | number | 当前页码 |
| `pageSize` | number | 每页条数 |
| `total` | number | 总记录数（匹配筛选条件后） |
| `totalPages` | number | 总页数 |

---

#### 3.3.2 获取询盘统计

获取各状态询盘的数量统计。

```
GET /api/external/inquiries/stats
```

##### 成功响应

```json
{
  "total": 156,
  "pending": 23,
  "replied": 120,
  "closed": 13
}
```

##### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | number | 询盘总数 |
| `pending` | number | 待回复数量 |
| `replied` | number | 已回复数量 |
| `closed` | number | 已关闭数量 |

---

#### 3.3.3 获取单条询盘详情

根据询盘 ID 获取完整详情，包括回复记录。

```
GET /api/external/inquiries/:id
```

##### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 询盘 ID |

##### 成功响应（HTTP 200）

返回单个完整的 [Inquiry 对象](#inquiry询盘对象)。

##### 失败响应

```json
// 询盘不存在（HTTP 404）
{
  "error": "Not found",
  "message": "Inquiry not found"
}

// ID 格式错误（HTTP 400）
{
  "error": "Bad request",
  "message": "Invalid inquiry ID"
}
```

---

#### 3.3.4 创建新询盘（前台同步用）

用于前台表单提交时同步数据到后端 KV，工作台系统一般不需要调用此接口。

```
POST /api/inquiries
```

##### 请求体（JSON）

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `name` | string | ✅ | 客户姓名 |
| `email` | string | ✅ | 客户邮箱 |
| `message` | string | ✅ | 询盘内容 |
| `phone` | string | ❌ | 联系电话 |
| `company` | string | ❌ | 公司名称 |
| `country` | string | ❌ | 国家/地区 |
| `product_name` | string | ❌ | 产品名称 |
| `quantity` | string | ❌ | 数量 |
| `source_page` | string | ❌ | 来源页面 |

##### 请求示例

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "company": "ABC Industries",
  "country": "USA",
  "product_name": "Chain Link Fence",
  "quantity": "1000 meters",
  "message": "Please send us the price list for chain link fence.",
  "source_page": "/contact.html"
}
```

##### 成功响应（HTTP 201 Created）

返回新创建的 Inquiry 对象，包含自动生成的 `id`、`status`、`created_at` 等字段。

##### 失败响应

```json
// 必填字段缺失（HTTP 400）
{
  "error": "Bad request",
  "message": "Missing required fields: name, email, message"
}
```

---

## 4. 部署指南

### 4.1 前置条件

在开始部署前，请确保已准备好以下环境：

- ✅ Node.js ≥ 18.x 和 npm
- ✅ Cloudflare 账户（免费版即可）
- ✅ 已登录 Wrangler CLI（`npx wrangler login`）
- ✅ 项目代码位于 `kestrel-site/` 目录

### 4.2 一键部署（推荐）

进入项目目录，执行自动化部署脚本：

```bash
cd kestrel-site
bash scripts/setup-inquiry-api.sh
```

脚本将自动完成以下步骤：

| 步骤 | 说明 |
|:----:|------|
| 1 | 检查 Wrangler CLI 环境 |
| 2 | 创建 Cloudflare KV 命名空间 `kestrel-inquiries`，获取命名空间 ID |
| 3 | 将命名空间 ID 写入 `wrangler.jsonc`（替换 `INQUIRIES_KV_ID_PLACEHOLDER`） |
| 4 | 生成 256 位随机 API 密钥，通过 `wrangler secret put` 配置为 `INQUIRY_API_KEY` |
| 5 | 补充配置 `ADMIN_TOKEN` 环境变量（如未配置） |
| 6 | 执行 `wrangler deploy` 部署 Worker |

部署成功后，脚本会输出：

```
==========================================
✅ 部署完成！
==========================================

📋 API 配置信息：
------------------------------------------
询盘API密钥（INQUIRY_API_KEY）:
  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx（请复制保存！）

📡 API 端点：
  GET  /api/external/inquiries
  GET  /api/external/inquiries/stats
  GET  /api/external/inquiries/:id
  POST /api/inquiries
==========================================
```

⚠️ **重要**：请立即复制并保存输出的 API 密钥，此密钥仅在部署时显示一次，丢失后无法找回（需要重新生成）。

### 4.3 手动部署步骤

如果脚本执行失败，可按照以下步骤手动部署：

#### 步骤 1：创建 KV 命名空间

```bash
cd kestrel-site

# 创建 KV 命名空间
npx wrangler kv namespace create kestrel-inquiries
```

执行成功后，终端会输出类似：
```
🌀 Creating namespace with title kestrel-inquiries
✅ Success!
Add the following to your wrangler.jsonc:
{ binding = "INQUIRIES", id = "abc123def456ghi789..." }
```

复制输出中的 `id` 值（例如 `abc123def456ghi789...`）。

#### 步骤 2：更新 wrangler.jsonc

打开 `wrangler.jsonc`，找到 `INQUIRIES_KV_ID_PLACEHOLDER`，替换为上一步获取的 KV 命名空间 ID：

```jsonc
{
  // ...
  "kv_namespaces": [
    // ... 其他 KV
    {
      "binding": "INQUIRIES",
      "id": "abc123def456ghi789..."   // ← 替换为你的实际 ID
    }
  ]
}
```

#### 步骤 3：生成并配置 API 密钥

```bash
# 生成 256 位随机密钥
INQUIRY_API_KEY=$(openssl rand -hex 32)
echo "API 密钥: $INQUIRY_API_KEY"   # 请务必保存此密钥！

# 设置为 Worker Secret
echo "$INQUIRY_API_KEY" | npx wrangler secret put INQUIRY_API_KEY
```

#### 步骤 4：配置 ADMIN_TOKEN（如未配置）

```bash
# 检查 wrangler.jsonc 中 vars 部分是否有 ADMIN_TOKEN
# 如果没有，添加一个：
ADMIN_TOKEN=$(openssl rand -hex 32)
# 手动编辑 wrangler.jsonc，在 vars 中添加：
#   "ADMIN_TOKEN": "<上面生成的token值>"
```

#### 步骤 5：部署 Worker

```bash
npx wrangler deploy
```

部署成功后会显示 Worker 域名，例如：
```
Total Upload: 123.45 KiB / gzip: 34.56 KiB
Uploaded kestrel-metal-web (0.12 sec)
Published kestrel-metal-web (0.15 sec)
  https://kestrel-metal-web.1411044767.workers.dev
  https://kestrelmetal.com
```

---

## 5. 工作台集成指南

### 5.1 Python 示例

适用于 Django / Flask / FastAPI / 普通 Python 脚本。

```python
import requests
from datetime import datetime

class KestrelInquiryClient:
    def __init__(self, api_key: str, base_url: str = "https://kestrelmetal.com"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }

    def get_inquiries(self, page: int = 1, page_size: int = 20,
                      search: str = "", status: str = "") -> dict:
        """获取询盘列表"""
        params = {
            "page": page,
            "pageSize": page_size
        }
        if search:
            params["search"] = search
        if status:
            params["status"] = status

        resp = requests.get(
            f"{self.base_url}/api/external/inquiries",
            headers=self.headers,
            params=params
        )
        resp.raise_for_status()
        return resp.json()

    def get_inquiry_stats(self) -> dict:
        """获取询盘统计"""
        resp = requests.get(
            f"{self.base_url}/api/external/inquiries/stats",
            headers=self.headers
        )
        resp.raise_for_status()
        return resp.json()

    def get_inquiry_by_id(self, inquiry_id: int) -> dict:
        """获取单条询盘详情"""
        resp = requests.get(
            f"{self.base_url}/api/external/inquiries/{inquiry_id}",
            headers=self.headers
        )
        resp.raise_for_status()
        return resp.json()

    def get_all_pending_inquiries(self) -> list:
        """获取所有待回复的询盘（自动翻页）"""
        all_inquiries = []
        page = 1
        while True:
            result = self.get_inquiries(page=page, page_size=100, status="pending")
            all_inquiries.extend(result["data"])
            if page >= result["totalPages"]:
                break
            page += 1
        return all_inquiries


# ========== 使用示例 ==========
if __name__ == "__main__":
    client = KestrelInquiryClient(
        api_key="你的API密钥",
        base_url="https://kestrelmetal.com"
    )

    # 1. 获取询盘统计（用于工作台仪表盘展示）
    stats = client.get_inquiry_stats()
    print(f"📊 询盘统计: 总数 {stats['total']} | "
          f"待回复 {stats['pending']} | "
          f"已回复 {stats['replied']} | "
          f"已关闭 {stats['closed']}")

    # 2. 获取第一页询盘
    result = client.get_inquiries(page=1, page_size=20)
    print(f"\n📋 第{result['page']}页，共{result['total']}条：")
    for inquiry in result["data"]:
        created = datetime.fromisoformat(inquiry["created_at"].replace("Z", "+00:00"))
        print(f"  [{inquiry['status']}] {inquiry['id']} "
              f"- {inquiry['name']} ({inquiry['email']}) "
              f"- {created.strftime('%Y-%m-%d %H:%M')}")

    # 3. 获取所有待回复询盘
    pending = client.get_all_pending_inquiries()
    print(f"\n⏰ 待回复询盘共 {len(pending)} 条")
```

### 5.2 Node.js 示例

适用于 Express / Next.js / 普通 Node.js 应用。

```javascript
// kestrel-inquiry-client.js

class KestrelInquiryClient {
  constructor(apiKey, baseUrl = "https://kestrelmetal.com") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Accept": "application/json",
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.statusCode = response.status;
      error.response = data;
      throw error;
    }

    return data;
  }

  /** 获取询盘列表 */
  async getInquiries({ page = 1, pageSize = 20, search = "", status = "" } = {}) {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return this.request(`/api/external/inquiries?${params.toString()}`);
  }

  /** 获取询盘统计 */
  async getStats() {
    return this.request("/api/external/inquiries/stats");
  }

  /** 获取单条询盘详情 */
  async getInquiry(id) {
    return this.request(`/api/external/inquiries/${id}`);
  }

  /** 获取所有询盘（自动翻页） */
  async getAllInquiries(filters = {}) {
    const all = [];
    let page = 1;
    while (true) {
      const result = await this.getInquiries({ ...filters, page, pageSize: 100 });
      all.push(...result.data);
      if (page >= result.totalPages) break;
      page++;
    }
    return all;
  }
}

// ========== 使用示例 ==========
async function main() {
  const client = new KestrelInquiryClient(
    "你的API密钥",
    "https://kestrelmetal.com"
  );

  try {
    // 1. 获取统计数据
    const stats = await client.getStats();
    console.log("📊 统计:", stats);

    // 2. 获取所有待回复询盘
    const pendingList = await client.getAllInquiries({ status: "pending" });
    console.log(`⏰ 待回复: ${pendingList.length} 条`);
    pendingList.forEach(inq => {
      console.log(`  - [${inq.id}] ${inq.name}: ${inq.message.slice(0, 50)}...`);
    });

    // 3. 查看详情
    if (pendingList.length > 0) {
      const detail = await client.getInquiry(pendingList[0].id);
      console.log("\n🔍 询盘详情:", JSON.stringify(detail, null, 2));
    }

  } catch (err) {
    console.error("❌ 错误:", err.statusCode, err.message);
  }
}

main();
```

### 5.3 cURL 示例

适用于测试、Shell 脚本集成。

```bash
# ========== 配置变量 ==========
API_KEY="你的API密钥"
BASE_URL="https://kestrelmetal.com"
AUTH_HEADER="Authorization: Bearer $API_KEY"

echo "========== 📊 获取询盘统计 =========="
curl -s -X GET "$BASE_URL/api/external/inquiries/stats" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n========== 📋 获取第一页询盘（20条/页） =========="
curl -s -X GET "$BASE_URL/api/external/inquiries?page=1&pageSize=20" \
  -H "$AUTH_HEADER" | jq '.data[] | {id, name, email, status, created_at}'

echo -e "\n========== 🔍 搜索包含 'fence' 的询盘 =========="
curl -s -X GET "$BASE_URL/api/external/inquiries?search=fence" \
  -H "$AUTH_HEADER" | jq '.total'

echo -e "\n========== ⏰ 筛选待回复询盘 =========="
curl -s -X GET "$BASE_URL/api/external/inquiries?status=pending" \
  -H "$AUTH_HEADER" | jq '.total'

echo -e "\n========== 📄 获取单条询盘详情 =========="
# 替换为实际的询盘 ID
INQUIRY_ID=1787935791123
curl -s -X GET "$BASE_URL/api/external/inquiries/$INQUIRY_ID" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n========== ➕ 测试创建询盘 =========="
curl -s -X POST "$BASE_URL/api/inquiries" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+86 13800138000",
    "company": "Test Company",
    "country": "China",
    "product_name": "Welded Wire Mesh",
    "quantity": "2000 sheets",
    "message": "This is a test inquiry from cURL.",
    "source_page": "/test"
  }' | jq .
```

---

## 6. 前端同步配置

为了让客户通过官网提交的询盘数据**自动同步到后端 Cloudflare KV 存储**，需要在提交询盘的浏览器中设置 API 密钥。

### 配置方法

#### 方法一：浏览器控制台（临时）

1. 打开官网 https://kestrelmetal.com/contact.html
2. 按 F12 打开开发者工具，切换到 Console（控制台）标签
3. 执行以下命令：

```javascript
localStorage.setItem('km_inquiry_api_key', '你的API密钥');
```

4. 刷新页面，配置生效

⚠️ 此方法仅对**当前浏览器**生效，清除浏览器数据后需要重新设置。

#### 方法二：嵌入页面代码（推荐，永久生效）

将 API 密钥配置嵌入到公共页面组件中（例如 navbar 或 footer 组件），这样所有访问者的浏览器都会自动获得同步能力。

编辑 `components/navbar.html` 或 `js/includes.js`，在 `<script>` 块中添加：

```html
<script>
  // 配置询盘API同步密钥
  if (!localStorage.getItem('km_inquiry_api_key')) {
    localStorage.setItem(
      'km_inquiry_api_key',
      '你的API密钥'
    );
  }
</script>
```

部署后，所有用户访问网站时会自动配置好 API 密钥，提交的询盘会自动同步到后端 KV。

### 同步原理

在 [js/contact.js](file:///Users/Zhuanz1/Desktop/kestrel%20metal%20web%201/kestrel-site/js/contact.js) 中的 `handleContactSubmit()` 函数，当用户提交表单时：

```
1. 保存到 localStorage（后台管理系统读取）——原有逻辑
    ↓
2. 调用 syncToBackend(inquiryData) ——新增逻辑
    │
    ├─► 检查 localStorage 中是否存在 km_inquiry_api_key
    │
    ├─► 不存在：打印警告，跳过同步
    │
    └─► 存在：发送 POST /api/inquiries 请求到后端，
             数据成功写入 Cloudflare KV
```

### 验证同步是否成功

1. 在官网提交一个测试询盘（填写 contact 表单）
2. 打开浏览器控制台，查看日志：
   - ✅ `[Inquiry] Synced to backend successfully: ...` 表示同步成功
   - ⚠️ `[Inquiry] No API key found, skipping backend sync` 表示未配置密钥
   - ❌ `[Inquiry] Failed to sync to backend: ...` 表示同步失败，请检查 API 密钥

---

## 7. 测试与验证

### 7.1 使用自动化测试脚本

项目提供了完整的自动化测试脚本：

```bash
cd kestrel-site

# 测试生产环境
bash scripts/test-inquiry-api.sh https://kestrelmetal.com 你的API密钥

# 测试本地开发服务器（先执行 npx wrangler dev）
bash scripts/test-inquiry-api.sh http://localhost:8787 test_key
```

脚本会依次执行以下 8 项测试：

| # | 测试项 | 期望结果 |
|---|--------|----------|
| 1 | 无认证访问询盘列表 | 返回 401 Unauthorized ✅ |
| 2 | 创建有效询盘（POST） | 返回 201 Created ✅ |
| 3 | 获取询盘统计 | 返回 200 + 统计数据 ✅ |
| 4 | 获取询盘列表（分页） | 返回 200 + 分页数据 ✅ |
| 5 | 搜索询盘（关键词匹配） | 返回 200 + 过滤后数据 ✅ |
| 6 | 按状态筛选（pending） | 返回 200 + 过滤后数据 ✅ |
| 7 | 获取不存在的询盘 ID | 返回 404 Not Found ✅ |
| 8 | 创建询盘缺少必填字段 | 返回 400 Bad Request ✅ |

### 7.2 手动测试步骤

#### 步骤 1：验证认证

```bash
# 不带 API Key 访问（应返回 401）
curl -I https://kestrelmetal.com/api/external/inquiries/stats
# 检查首行：HTTP/2 401
```

#### 步骤 2：验证列表接口

```bash
# 带 API Key 访问
curl -H "Authorization: Bearer 你的API密钥" \
  "https://kestrelmetal.com/api/external/inquiries?pageSize=5" | jq '{total, totalPages, count: (.data | length)}'
```

预期输出示例：
```json
{
  "total": 156,
  "totalPages": 32,
  "count": 5
}
```

#### 步骤 3：验证统计接口

```bash
curl -H "Authorization: Bearer 你的API密钥" \
  https://kestrelmetal.com/api/external/inquiries/stats
```

预期输出示例：
```json
{
  "total": 156,
  "pending": 23,
  "replied": 120,
  "closed": 13
}
```

---

## 8. 常见问题 FAQ

### Q1：API 返回 401 Unauthorized 怎么办？

**排查步骤**：
1. 确认 API 密钥是否正确，注意不要包含多余的空格或换行
2. 确认请求头格式为 `Authorization: Bearer <API_KEY>`（Bearer 后有一个空格）
3. 重新执行 `echo "密钥" | npx wrangler secret put INQUIRY_API_KEY` 确认密钥已配置

---

### Q2：前端提交的询盘没有同步到后端？

**排查步骤**：
1. 打开浏览器控制台，查看是否有 `[Inquiry] ...` 开头的日志
2. 执行 `localStorage.getItem('km_inquiry_api_key')` 检查密钥是否已设置
3. 确认密钥与部署时配置的 `INQUIRY_API_KEY` 一致
4. 检查网络面板中是否有 `POST /api/inquiries` 请求及其状态码

---

### Q3：如何更换 API 密钥？

```bash
# 1. 生成新密钥
NEW_KEY=$(openssl rand -hex 32)
echo "新密钥: $NEW_KEY"

# 2. 更新 Worker Secret
echo "$NEW_KEY" | npx wrangler secret put INQUIRY_API_KEY

# 3. 重新部署（让 Secret 生效）
npx wrangler deploy

# 4. 更新前端 localStorage 中的密钥（所有浏览器）
#    在浏览器控制台执行：
#    localStorage.setItem('km_inquiry_api_key', '新密钥值');
```

⚠️ 更换密钥后，所有使用旧密钥的工作台集成需要同步更新。

---

### Q4：如何导出所有询盘数据？

使用 Python 或 Node.js 客户端的「自动翻页获取全部」功能，例如：

```python
# Python
client = KestrelInquiryClient("API_KEY")
all_inquiries = []
for status in ["", "pending", "replied", "closed"]:
    page = 1
    while True:
        result = client.get_inquiries(page=page, page_size=100, status=status)
        all_inquiries.extend(result["data"])
        if page >= result["totalPages"]: break
        page += 1

import json
with open("inquiries_backup.json", "w", encoding="utf-8") as f:
    json.dump(all_inquiries, f, ensure_ascii=False, indent=2)
```

---

### Q5：Cloudflare KV 免费额度够用吗？

Cloudflare Workers 免费计划包含：
- KV 存储：**1 GB** 存储空间
- KV 读取：**100,000 次/天**
- KV 写入：**1,000 次/天**

按每条询盘约 500 字节估算，1GB 可存储约 **200 万条**询盘，免费额度完全够用。如需更高额度可升级到 Paid 计划（$5/月）。

---

### Q6：如何查看历史回复记录？

调用 `GET /api/external/inquiries/:id` 获取单条询盘详情，其中的 `replies` 数组包含所有回复记录：

```json
{
  "replies": [
    {
      "admin": { "username": "sales_admin" },
      "content": "回复内容...",
      "created_at": "2026-08-29T05:12:33.456Z"
    }
  ]
}
```

---

### 技术支持

如有问题，请查看：
- `docs/seo-automation-project.md` - Cloudflare Workers 架构说明
- `docs/operations-checklist.md` - 日常运维检查清单
- `docs/issue-log.md` - 已知问题与修复记录