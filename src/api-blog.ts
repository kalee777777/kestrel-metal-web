import { route, jsonResponse, type RouteContext } from './router';
import { listKeys, getJSON } from './lib/kv';

export interface BlogPostRecord {
  id: string;
  slug: string;
  title: string;
  description?: string;
  metaDescription?: string;
  cover_image?: string;
  image?: string;
  category?: string;
  tags?: string[] | string;
  section?: string;
  author?: string;
  read_time?: string;
  status?: string;
  static_url?: string;
  detail_url?: string;
  score?: number;
  publishedAt?: string;
  createdAt?: string;
  created_at?: string;
  url?: string;
}

interface BlogListParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function parseTags(raw: BlogPostRecord['tags']): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return raw.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
}

function normalizePost(item: BlogPostRecord) {
  const tags = parseTags(item.tags);
  const staticUrl = item.static_url || item.detail_url || item.url || '';
  return {
    id: item.id || item.slug,
    title: item.title || '',
    slug: item.slug || '',
    description: item.description || item.metaDescription || '',
    cover_image: item.cover_image || item.image || '',
    category: item.category || '',
    tags,
    section: item.section || '',
    author: item.author || 'Kestrel Metal',
    read_time: item.read_time || '5 min read',
    status: item.status || 'published',
    published_at: item.publishedAt || item.created_at || item.createdAt || '',
    created_at: item.created_at || item.createdAt || item.publishedAt || '',
    static_url: staticUrl,
    detail_url: staticUrl,
    score: item.score ?? null,
  };
}

function filterBySearch(items: ReturnType<typeof normalizePost>[], search?: string) {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) => {
    return (
      item.title.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q)
    );
  });
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    page: safePage,
    pageSize,
    totalPages,
    total,
  };
}

async function loadBlogPosts(env: RouteContext['env'], params: BlogListParams) {
  const status = (params.status || 'published').trim().toLowerCase();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize || DEFAULT_PAGE_SIZE));

  const draftKeys = await listKeys(env.CONTENT_QUEUE, 'draft:');
  const draftEntries = await Promise.all(
    draftKeys.map(async (key) => getJSON<BlogPostRecord>(env.CONTENT_QUEUE, key.name)),
  );

  const publishedAll = await getJSON<BlogPostRecord[]>(env.CONTENT_QUEUE, 'published:all');
  const publishedEntries = Array.isArray(publishedAll) ? publishedAll : [];

  const merged = new Map<string, BlogPostRecord>();

  for (const item of publishedEntries) {
    if (item && item.slug) {
      merged.set(item.slug, item);
    }
  }

  for (const item of draftEntries) {
    if (item && item.slug && !merged.has(item.slug)) {
      merged.set(item.slug, item);
    }
  }

  let items = Array.from(merged.values())
    .map((item) => normalizePost({ ...item, status: item.status || 'published' }));

  if (status === 'published') {
    items = items.filter((item) => item.status === 'published' && item.detail_url);
  } else {
    items = items.filter((item) => item.status === status);
  }

  const filtered = filterBySearch(items, params.search);
  return paginate(filtered, page, pageSize);
}

function parseSearchParams(url: URL): BlogListParams {
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || url.searchParams.get('limit') || '50', 10);
  return {
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || 'published',
    page,
    pageSize,
  };
}

function register() {
  route('GET', '/api/blog', async (ctx: RouteContext) => {
    const params = parseSearchParams(ctx.url);
    const result = await loadBlogPosts(ctx.env, params);
    return jsonResponse(result);
  });
}

register();
