# 线上路由连环故障复盘（2026-08-27）

## 事件概述

| 项目 | 内容 |
|------|------|
| 影响范围 | 生产环境 kestrelmetal.com：导航栏与 footer 无法加载 → 首页 404 → 组件接口 500 |
| 持续时间 | 2026-08-27 16:00 – 18:25（UTC+8） |
| 最终结果 | ✅ 全部修复，线上验证通过 |
| 修复提交 | `460bbcc` / `11efaf8` / `ca054eb`（main 分支，经 Cloudflare CI 自动部署） |

## 架构背景

站点路由由三层协作完成，本次 4 个问题全部源于三层的配置与逻辑互相冲突：

```text
浏览器 fetch
   │
   ▼
Cloudflare 资源层（wrangler.jsonc 的 html_handling 规则）
   │  run_worker_first: true，所有请求先进 Worker
   ▼
Worker 路由层（src/index.ts：组件拦截、/ 映射、SEO 注入）
   │
   ▼
静态资源（components/navbar.html、footer.html、各页面 .html）
```

前端组件加载方式：页面占位符 `<div id="navbar-placeholder">` 由 `js/includes.js` 通过 `fetch('components/navbar.html')` 动态注入。

---

## 问题 1：线上导航栏和 footer 消失

**现象**：本地环境正常，线上页面顶部与底部空白。

**根因**：`html_handling: "auto-trailing-slash"` 与 Worker 组件拦截逻辑冲突，形成重定向死循环：

```text
浏览器请求 /components/navbar.html
  → 资源层 308 重定向到 /components/navbar（自动去 .html）
  → Worker 拦截后内部改回 .html 再取资源
  → 资源层再次 308 ...
  → ERR_TOO_MANY_REDIRECTS，fetch 失败
```

**诊断依据**：浏览器 Network 面板中 `GET /components/navbar` 与 `GET /components/footer` 均为 `net::ERR_TOO_MANY_REDIRECTS`。

**解决方案**：[wrangler.jsonc](../wrangler.jsonc) 中 `html_handling` 由 `"auto-trailing-slash"` 改为 `"none"`，HTML 按原始 URL 直接返回，消除重定向。（提交 `460bbcc`）

---

## 问题 2：首页 404

**现象**：`https://kestrelmetal.com/` 返回 404，但 `/index.html`、`/products.html` 均正常，网站实际在线。

**根因**：问题 1 修复的副作用。`"none"` 模式下 Cloudflare 不再将根路径 `/` 自动映射到 `/index.html`。

**解决方案**：Worker 中将 `/` 重写为 `/index.html` 后再请求静态资源，且该路径仍走 SEO 注入流程（提交 `11efaf8`）：

```ts
let assetRequest = request;
if (url.pathname === '/') {
  const rootUrl = new URL(request.url);
  rootUrl.pathname = '/index.html';
  assetRequest = new Request(rootUrl, request);
}
```

---

## 问题 3：组件接口 500（error 1101）

**现象**：首页恢复后，`/components/navbar.html` 与 `/components/footer.html` 返回 500（Cloudflare error 1101 = Worker 抛出未捕获异常），导航栏和 footer 再次无法加载。

**根因**：[src/index.ts](../src/index.ts) SEO 注入流程的隐藏 bug：

```ts
const html = await response.text();          // ← 消费了响应体
// 对 /components/* 跳过 SEO 注入
return response;                              // ← 返回"已掏空"的响应 → Body already used 异常
```

- **历史为何不暴露**：`auto-trailing-slash` 时代该路径返回 308 重定向，提前返回、从不读取 body，bug 代码从未执行到
- **为何难发现**：边缘缓存（`cf-cache-status: HIT`）持续返回旧的 200 响应，掩盖了 500

**解决方案**：调整执行顺序——组件和管理页在读取 body 之前提前返回；普通页面读取后总是重建新 Response（提交 `ca054eb`）：

```ts
if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/components/')) {
  return response;                            // 未读 body，安全返回
}
const html = await response.text();
const enhanced = injectSeoTags(html, url.pathname);
return new Response(enhanced, {               // 总是重建，杜绝消费后返回
  headers: response.headers,
  status: response.status,
});
```

---

## 问题 4：无扩展名 URL 404（SEO 隐患）

**现象**：`"none"` 模式下 `/products` 等无扩展名路径返回 404。

**风险**：搜索引擎收录的是无扩展名格式（`auto-trailing-slash` 时代的规范 URL），全站 404 会导致收录流失、排名下降。

**解决方案**：Worker 检测到 404 且路径不含扩展名时，自动尝试 `路径 + '.html'` 回退（`"none"` 模式下无重定向，安全无循环），提交 `11efaf8`：

```ts
let response = await env.ASSETS.fetch(assetRequest);
if (response.status === 404 && !url.pathname.includes('.')) {
  const htmlUrl = new URL(request.url);
  htmlUrl.pathname = url.pathname + '.html';
  const htmlResponse = await env.ASSETS.fetch(new Request(htmlUrl, request));
  if (htmlResponse.status !== 404) {
    response = htmlResponse;
  }
}
```

---

## 修复提交记录

| 提交 | 内容 | 解决的问题 |
|------|------|-----------|
| `460bbcc` | `html_handling` → `"none"` | 问题 1（重定向死循环） |
| `11efaf8` | `/` 重写 + 无扩展名 `.html` 回退 | 问题 2（首页 404）、问题 4（SEO） |
| `ca054eb` | 组件响应提前返回、页面响应重建 | 问题 3（Body already used 500） |

部署链路：`git push github main` → Cloudflare Workers Builds 自动部署（本机无 `CLOUDFLARE_API_TOKEN`，不能直接 `wrangler deploy`；`--temporary` 临时账号因未应用 `.assetsignore` 读取 1.1 万文件、manifest 超过 5MB 限制而失败，正式 CI 不受影响）。

## 验证结果

使用带随机参数的 URL 绕过边缘缓存复测（`?cb=随机数`）：

| 路径 | 修复前 | 修复后 |
|------|--------|--------|
| `/` | 404 | ✅ 200 |
| `/components/navbar.html` | 500 / 死循环 | ✅ 200 |
| `/components/footer.html` | 500 / 死循环 | ✅ 200 |
| `/products`（无扩展名） | 404 | ✅ 200 |

浏览器实测：导航栏（含全部菜单链接）、首页内容、footer（含联系方式、版权信息）全部正常渲染。本地 `tsc --noEmit`、lint（0 错误）、build 均通过。

## 经验教训

1. **三层路由必须配套设计**：`html_handling`（资源层）、Worker 拦截逻辑（路由层）、前端 fetch 路径（应用层）任一层单独改动都可能引发连锁反应，本次 4 个问题全部由此产生
2. **验证必须绕过缓存**：边缘缓存会掩盖真实部署状态，用随机 query 参数请求才能看到真实行为
3. **诊断先取证据再动手**：`curl -I` 响应头 + Network 请求日志 + git 历史（`d763d74`、`c0d9ff4` 两个旧提交表明同类问题曾出现过）远比猜测有效
4. **Workers 响应体只能消费一次**：任何 `await response.text()` 之后，必须用 `new Response()` 重建，不能返回原 response

---

*文档创建时间：2026-08-27*
