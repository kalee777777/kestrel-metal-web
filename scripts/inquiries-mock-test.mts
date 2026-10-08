/**
 * lib/inquiries.ts (v2) 运行时验证 — 模拟 KV（get/put/delete/list+metadata+cursor）
 * 运行：cd kestrel-site && npx tsx /tmp/inquiries-mock-test.ts
 */
import assert from 'node:assert';
import {
  getInquiries, getInquiryById, createInquiry, updateInquiry,
  deleteInquiry, addReply, getInquiryStats
} from '../src/lib/inquiries';

/** 忠实模拟 Workers KV 语义（含 metadata 与 cursor 分页） */
class MockKV {
  store = new Map<string, { value: string; metadata?: unknown }>();
  getCount = 0; putCount = 0; listCount = 0;
  pageSize: number; // list 每页 key 数（可调小以测 cursor）
  constructor(pageSize = 1000) { this.pageSize = pageSize; }

  async get(key: string, _type: 'json') {
    this.getCount++;
    await Promise.resolve();
    const e = this.store.get(key);
    return e ? JSON.parse(e.value) : null;
  }
  collisions = 0;
  async put(key: string, value: string, opts?: { metadata?: unknown }) {
    this.putCount++;
    await Promise.resolve();
    if (this.store.has(key)) this.collisions++;
    this.store.set(key, { value, metadata: opts?.metadata });
  }
  async delete(key: string) {
    await Promise.resolve();
    this.store.delete(key);
  }
  async list(opts: { prefix?: string; cursor?: string }) {
    this.listCount++;
    await Promise.resolve();
    const names = [...this.store.keys()].filter(k => k.startsWith(opts.prefix || '')).sort();
    const start = opts.cursor ? parseInt(opts.cursor, 10) : 0;
    const slice = names.slice(start, start + this.pageSize);
    const complete = start + this.pageSize >= names.length;
    return {
      keys: slice.map(name => ({ name, metadata: this.store.get(name)!.metadata ?? null })),
      list_complete: complete,
      cursor: complete ? undefined : String(start + this.pageSize)
    };
  }
}
const KEY = 'inquiries:item:';
let passed = 0;
function ok(name: string, fn: () => void) { fn(); passed++; console.log('  ✓', name); }

console.log('== 1. 旧版无 metadata 数据迁移 ==');
{
  const kv = new MockKV();
  // 模拟生产 4 条 v1 旧数据（无 metadata）
  const legacy = [
    { id: 1788009402921, name: 'Test Buyer', email: 't@b.com', status: 'closed', created_at: '2026-08-29T13:16:41.997Z', message: 'old test', replies: [] },
    { id: 1789369098672, name: 'Vanik', email: 'v@l.am', status: 'replied', created_at: '2026-09-14T06:58:17.964Z', message: 'gabion fence project', replies: [{ admin: { username: 'admin' }, content: 'hi', created_at: '2026-09-15T00:00:00Z' }] },
    { id: 1789621875791, name: 'Horizon', email: 'h@o.com', status: 'replied', created_at: '2026-09-17T05:11:14.828Z', message: 'chain link price list', replies: [] },
    { id: 1790270005869, name: 'kaleetest', email: 'k@t.com', status: 'closed', created_at: '2026-09-24T17:13:24.902Z', message: 'test', replies: [] },
  ];
  for (const l of legacy) await kv.put(KEY + l.id, JSON.stringify(l)); // 无 metadata（v1 行为）

  const res = await getInquiries(kv as any, 1, 20);
  ok('旧数据全部可见且按时间倒序', () => {
    assert.deepStrictEqual(res.data.map((r: any) => r.name), ['kaleetest', 'Horizon', 'Vanik', 'Test Buyer']);
    assert.strictEqual(res.total, 4);
  });
  ok('列表行补全 message/replies（契约兼容）', () => {
    assert.strictEqual(res.data[1].message, 'chain link price list');
    assert.strictEqual(res.data[2].replies.length, 1);
  });
  ok('首次读取即回写 metadata（永久迁移）', () => {
    assert(res.data.every((r: any) => kv.store.get(KEY + r.id)!.metadata));
  });
  kv.getCount = 0;
  const res2 = await getInquiries(kv as any, 1, 20);
  ok('迁移后列表不再拉旧数据详情（仅页切片补全）', () => {
    assert.strictEqual(res2.total, 4);
    assert.strictEqual(kv.getCount, 4); // 恰好 pageSize 次水合，0 次迁移
  });
}

console.log('== 2. 并发创建（竞态回归）+ CRUD ==');
{
  const kv = new MockKV(2); // list 每页 2 key，逼出 cursor 分页
  for (let i = 0; i < 5; i++) await createInquiry(kv as any, {
    name: `bulk${i}`, email: `b${i}@x.com`, message: `msg ${i}`,
    source_page: '/contact.html'
  });
  // 并发创建 5 条 —— v1 的共享索引读改写会丢条目，v2 各写各键
  await Promise.all(Array.from({ length: 5 }, (_, i) =>
    createInquiry(kv as any, { name: `race${i}`, email: `r${i}@x.com`, message: `race ${i}` })));
  const all = await getInquiries(kv as any, 1, 50);
  ok('10 条全部入库（并发无丢失）', () => assert.strictEqual(all.total, 10));
  ok('cursor 分页枚举完整（mock 每页 2 key）', () => assert(kv.listCount >= 5));

  const first = all.data[0];
  ok('倒序排列（created_at 降序，同毫秒按 id 决胜）', () => {
    for (let i = 1; i < all.data.length; i++) {
      const prev = all.data[i - 1], cur = all.data[i];
      const pk = new Date(prev.created_at).getTime(), ck = new Date(cur.created_at).getTime();
      assert(pk > ck || (pk === ck && prev.id > cur.id), `row ${i - 1}->${i} 乱序`);
    }
  });

  const st = await getInquiryStats(kv as any);
  ok('统计：total=10 pending=10 today=10', () => {
    assert.strictEqual(st.total, 10);
    assert.strictEqual(st.pending, 10);
    assert.strictEqual(st.today, 10);
  });

  const upd = await updateInquiry(kv as any, first.id, { status: 'replied' });
  ok('状态更新生效（replied_at 由 API 路由层附加）', () => {
    assert.strictEqual(upd!.status, 'replied');
  });
  const st2 = await getInquiryStats(kv as any);
  ok('metadata 同步：统计无需详情即反映状态变化', () => {
    assert.strictEqual(st2.replied, 1);
    assert.strictEqual(st2.pending, 9);
  });

  const replied = await addReply(kv as any, first.id, { content: 'price sent' });
  ok('添加回复 → status=replied + replies+1', () => {
    assert.strictEqual(replied!.replies!.length, 1);
    assert.strictEqual(replied!.status, 'replied');
  });
  assert.strictEqual(await getInquiryById(kv as any, 999999), null, '不存在 id → null');

  await deleteInquiry(kv as any, first.id);
  const afterDel = await getInquiries(kv as any, 1, 50);
  ok('删除后列表立即少一条', () => assert.strictEqual(afterDel.total, 9));
  const delAgain = await deleteInquiry(kv as any, first.id);
  const afterDel2 = await getInquiries(kv as any, 1, 50);
  ok('删除幂等（再删仍 true，总数不变）', () => {
    assert.strictEqual(delAgain, true);
    assert.strictEqual(afterDel2.total, 9);
  });
}

console.log('== 3. 搜索（含 message 全文）与状态过滤 ==');
{
  const kv = new MockKV();
  await createInquiry(kv as any, { name: 'Alice', email: 'a@x.com', message: 'need GABION boxes CIF Dubai' });
  await createInquiry(kv as any, { name: 'Bob', email: 'bob@chainlink.com', message: 'hello' });
  const byMsg = await getInquiries(kv as any, 1, 20, 'gabion');
  const byMeta = await getInquiries(kv as any, 1, 20, 'chainlink');
  const byName = await getInquiries(kv as any, 1, 20, 'alice');
  ok('message 全文命中（文档契约）', () => assert.strictEqual(byMsg.total, 1));
  ok('email 元数据命中', () => assert.strictEqual(byMeta.total, 1));
  ok('name 命中（大小写不敏感）', () => assert.strictEqual(byName.total, 1));
  const flt = await getInquiries(kv as any, 1, 20, '', 'pending');
  ok('状态过滤', () => { assert.strictEqual(flt.total, 2); assert(flt.data.every((r: any) => r.status === 'pending')); });
}

console.log('== 4. 子请求预算与降级（上限 50）==');
{
  const kv = new MockKV();
  for (let i = 0; i < 60; i++) await createInquiry(kv as any, { name: `n${i}`, email: `e${i}@x.com`, message: `m${i}` });
  kv.getCount = 0; kv.listCount = 0;
  const csv = await getInquiries(kv as any, 1, 10000); // CSV 导出路径
  ok('60 条创建无一 id 撞车（覆盖即丢单）', () => assert.strictEqual(kv.collisions, 0));
  ok('CSV 路径：10000 pageSize 不拉详情（1 次 list 即够）', () => {
    assert.strictEqual(csv.total, 60);
    assert.strictEqual(kv.getCount, 0);
    assert.strictEqual(csv.data.every((r: any) => r.message === ''), true);
  });
  kv.getCount = 0; kv.listCount = 0;
  const searched = await getInquiries(kv as any, 1, 20, 'm5');
  ok('超预算搜索降级为元数据字段（message 不再命中但子请求≤50）', () => {
    assert.strictEqual(searched.total, 0); // 'm5' 只在 message 里 → 降级后不命中
    assert(kv.getCount + kv.listCount <= 2, `gets=${kv.getCount} lists=${kv.listCount}`);
  });
  kv.getCount = 0; kv.listCount = 0;
  const paged = await getInquiries(kv as any, 2, 20); // 常规列表页
  ok('常规列表页子请求 = 1 list + ≤20 水合 ≤ 50', () => {
    assert.strictEqual(paged.total, 60);
    assert.strictEqual(paged.data.length, 20);
    assert(kv.getCount + kv.listCount <= 21, `gets=${kv.getCount} lists=${kv.listCount}`);
  });
}

console.log('== 5. 超长字段截断（metadata 1KB 保护）==');
{
  const kv = new MockKV();
  const long = 'A'.repeat(5000);
  const created = await createInquiry(kv as any, { name: long, email: 'big@x.com', message: long });
  const res = await getInquiries(kv as any, 1, 20);
  const csv = await getInquiries(kv as any, 1, 10000);
  const detail = await getInquiryById(kv as any, created.id);
  ok('创建不因超长字段失败', () => assert(created.id > 0));
  ok('列表页水合显示全文，CSV 元数据行截断到 120，详情全文', () => {
    assert.strictEqual(res.data[0].name.length, 5000);
    assert.strictEqual(csv.data[0].name.length, 120);
    assert.strictEqual(detail!.name.length, 5000);
  });
}

console.log(`\n全部 ${passed} 组断言通过 ✅`);
