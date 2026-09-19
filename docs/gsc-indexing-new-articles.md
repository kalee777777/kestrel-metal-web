# GSC 请求索引：两篇新博客文章

> 创建日期：2026-09-16
> 网站：kestrelmetal.com
> 背景：两篇新文章已部署上线（HTTP 200 ✅ / sitemap 已收录 ✅ / 站内入口齐全 ✅ / 专属 banner ✅），现需在 Google Search Console 手动请求编入索引，加速抓取收录。

---

## 目标网址（共 2 个）

| # | 网址 | 文章 | 部署状态 |
|---|------|------|---------|
| 1 | `https://www.kestrelmetal.com/gabion-boxes-supplier-find-the-best-for-your-project.html` | Gabion Boxes Supplier: Find the Best for Your Project（石笼网供应商筛选指南） | ✅ 已上线 |
| 2 | `https://www.kestrelmetal.com/galvanized-chain-link-fence-specs-benefits-buying-guide.html` | Galvanized Chain Link Fence: Specs, Benefits & Buying Guide（镀锌勾花网规格与采购指南） | ✅ 已上线 |

---

## 操作步骤（约 3 分钟）

1. 打开 [Google Search Console](https://search.google.com/search-console)
2. 顶部搜索框（**网址检查**）→ 粘贴第 1 个完整网址 → 回车
3. 等待检测完成（约 10~30 秒）
4. 确认检测结果正常（见下方"检测信号核对"）
5. 点击右上角 **"请求编入索引"**
6. 等待弹窗确认 **"已提交请求。系统会先安排抓取该网页"** → 完成
7. 对第 2 个网址重复步骤 2~6

> 两个页面数量少，无需分天执行，今天一次做完即可。

---

## 检测信号核对（请求前花 10 秒确认）

| 检测项 | 期望值 | 异常处理 |
|--------|--------|---------|
| 网页可用性 | "移动设备上可用" ✓ | 若报错，截图记录，暂缓请求 |
| 抓取的网页 | 显示文章标题（Gabion Boxes Supplier…） | 若显示空白/兜底页，见下行 |
| Canonical 网址 | `https://www.kestrelmetal.com/….html`（**www + .html**） | 若显示 `kestrelmetal.com/blog/…`（无 www、/blog/ 路径），说明检测到了 Worker 兜底渲染版本 → 等几分钟后重新检测 |
| 屏蔽索引问题 | 无（无 noindex / robots 屏蔽） | — |

---

## 时间线预期

| 阶段 | 预计时间 |
|------|---------|
| 请求后 Google 抓取页面 | 1~3 天 |
| 编入索引 | 1~7 天 |
| GSC"页面索引编制"报告中状态更新 | 抓取后数日内 |
| 开始出现展示/点击数据 | 索引后 7~14 天 |

> 这两个 URL 此前在"已发现 - 尚未编入索引"报告里（曾被 sitemap 提交但 404）。现在文件已真实上线，手动请求相当于"插队重抓"，成功率很高。

---

## 如何确认已被索引（3 种方法任选）

1. **Google 搜索框直接查**：`site:kestrelmetal.com/gabion-boxes-supplier-find-the-best-for-your-project.html` → 有结果 = 已索引
2. **GSC 网址检查**：重新检测该 URL → 显示 **"网址已位于 Google 上"** = 已索引
3. **GSC 索引报告**：左侧"索引 → 网页"→ 搜索框输入 URL → 查看所属类别（应从"已发现"消失，进入"已编入索引"）

---

## 进度追踪

| 日期 | 网址 | 已请求索引 | 已抓取 | 已索引 | 备注 |
|------|------|-----------|--------|--------|------|
| 2026-09-16 | gabion-boxes-supplier-find-the-best… | ⬜ | ⬜ | ⬜ | |
| 2026-09-16 | galvanized-chain-link-fence-specs… | ⬜ | ⬜ | ⬜ | |

> 建议每 2~3 天核对一次；若 7 天后仍未索引，用"网址检查"重新检测并再次请求，同时检查页面是否有新问题。

---

## 关联待办（勿遗漏）

1. **第三篇幽灵记录清理**：`gabion-boxes-supplier-your-guide-to-quality-cost.html` 仍挂在线上后台 CMS（Worker 会兜底渲染薄内容页，且不在 sitemap）→ 登录 /admin 删除该记录，或补写完整文章
2. **存量 150 页"已发现未索引"**：按 [gsc-request-index-priority.csv](gsc-request-index-priority.csv) 的 P1→P2 优先级，每天 10 页推进"请求编入索引"，总流程参考 [gsc-indexing-checklist.md](gsc-indexing-checklist.md)
3. **剩余孤岛页**：`blog.html`（与 blog-news.html 定位重复，建议 301 收敛或加入口）

---

*本文档由 SEO 优化流程生成，操作完成后请更新进度追踪表。*
