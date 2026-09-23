/**
 * Banner 图片自动生成（仅用于新增动态页面）
 *
 * 使用阿里云 DashScope 万相 wanx-v1 文生图 API
 * 为 AI 生成的文章页面生成工业风格 Banner 背景图
 * 不影响已有静态页面的任何内容
 */

export interface BannerGenEnv {
  QWEN_API_KEY?: string;
  QWEN_MODEL?: string;
  IMAGES?: R2Bucket;
}

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 30;

/**
 * 统一画面基调：明亮、通透、清晰。
 *
 * 曾经这里散落着 "dark moody tones" / "dark tones" / "dramatic lighting"，
 * 实测产出的图片平均亮度只有 42/255，多张图的暗部占比超过 90%
 * （cattle fence 那张几乎整幅纯黑）。hero 区本身还叠着 72%-90% 的深色遮罩，
 * 暗图再压一层，页面上就是一团灰。B2B 产品图本就该明亮易辨，故统一改掉。
 */
const BRIGHT_BASE =
  'bright natural daylight, well-lit, clean composition, professional commercial photography, wide angle, 8k resolution, photorealistic';

/**
 * 关键词 → Banner 提示词映射
 * 根据关键词生成对应的工业风格 Banner 描述
 */
export function buildBannerPrompt(keyword: string): string {
  const kw = keyword.toLowerCase();

  // 产品类关键词
  if (kw.includes('gabion')) {
    return `gabion wire mesh cages filled with natural stones, retaining wall construction site, sunny blue sky, ${BRIGHT_BASE}`;
  }
  if (kw.includes('chain link') || kw.includes('chain-link')) {
    return `galvanized chain link fence installation, metallic steel mesh, industrial security perimeter, ${BRIGHT_BASE}`;
  }
  if (kw.includes('razor wire') || kw.includes('razor-wire')) {
    return `razor wire concertina coil on security fence, industrial perimeter protection, ${BRIGHT_BASE}`;
  }
  if (kw.includes('barbed wire') || kw.includes('barbed-wire')) {
    return `barbed wire fence line, rural agricultural boundary, bright green field, morning sunlight, ${BRIGHT_BASE}`;
  }
  if (kw.includes('welded wire') || kw.includes('welded-wire')) {
    return `welded wire mesh panels, modern industrial fencing, clean geometric patterns, bright warehouse, ${BRIGHT_BASE}`;
  }
  if (kw.includes('hexagonal') || kw.includes('hexagonal wire')) {
    return `hexagonal wire mesh chicken netting, agricultural fencing, bright green countryside, sunny daylight, ${BRIGHT_BASE}`;
  }
  if (kw.includes('security fence') || kw.includes('high security')) {
    return `high security fence system with anti-climb mesh, industrial facility perimeter, ${BRIGHT_BASE}`;
  }
  if (kw.includes('fence post') || kw.includes('post')) {
    return `metal fence posts installation, steel Y-post and T-post, construction site, ${BRIGHT_BASE}`;
  }
  if (kw.includes('wire mesh')) {
    return `wire mesh manufacturing, steel wire grid panels, bright modern factory interior, ${BRIGHT_BASE}`;
  }
  if (kw.includes('galvanized')) {
    return `galvanized steel wire products, shiny metallic surface, well-lit industrial setting, ${BRIGHT_BASE}`;
  }
  if (kw.includes('358') || kw.includes('anti-climb')) {
    return `358 high security anti-climb fence, prison grade security fencing, industrial facility, ${BRIGHT_BASE}`;
  }
  if (kw.includes('stainless') || kw.includes('nickel') || kw.includes('copper') || kw.includes('filter')) {
    return `stainless steel wire mesh and filter screens, fine metallic weave close-up, clean bright workshop, ${BRIGHT_BASE}`;
  }
  if (kw.includes('manufacturer') || kw.includes('supplier') || kw.includes('factory')) {
    return `metal fencing manufacturing facility, large-scale industrial production, bright well-lit factory interior, ${BRIGHT_BASE}`;
  }
  if (kw.includes('guide') || kw.includes('buying') || kw.includes('b2b')) {
    return `industrial metal fencing products showcase, professional B2B catalog style, clean bright studio background, well-lit, ${BRIGHT_BASE}`;
  }

  // 通用工业风格 Banner
  return `industrial metal fencing and wire mesh products, professional B2B photography, clean bright composition, ${BRIGHT_BASE}`;
}

async function submitBannerTask(apiKey: string, prompt: string): Promise<string> {
  const resp = await fetch(DASHSCOPE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wanx-v1',
      input: { prompt },
      parameters: {
        style: '<photography>',
        size: '1280*720',
        n: 1,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Banner generation submit error (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as { output: { task_id: string } };
  const taskId = data.output?.task_id;
  if (!taskId) throw new Error('No task_id in banner generation response');
  return taskId;
}

async function pollBannerResult(apiKey: string, taskId: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const resp = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Banner poll error (${resp.status}): ${errText}`);
    }

    const data = (await resp.json()) as {
      output: {
        task_status: string;
        results?: Array<{ url: string }>;
        message?: string;
      };
    };

    const status = data.output.task_status;
    console.log(`[banner-gen] Task ${taskId}: ${status} (attempt ${i + 1})`);

    if (status === 'SUCCEEDED') {
      const urls = data.output.results?.map((r) => r.url) ?? [];
      if (urls.length === 0) throw new Error('Banner task succeeded but no image URL returned');
      return urls[0];
    }

    if (status === 'FAILED') {
      throw new Error(`Banner task failed: ${data.output.message ?? 'unknown error'}`);
    }
  }

  throw new Error(`Banner task ${taskId} timed out after ${MAX_POLL_ATTEMPTS} polls`);
}

/** 计算字节内容的 SHA-256，返回小写十六进制串 */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 根据文件头判断图片格式（Qwen 并不稳定返回同一种容器） */
function detectImageFormat(b: Uint8Array): 'webp' | 'png' | 'jpeg' | null {
  if (b.length < 12) return null;
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
    && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return 'webp';
  }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  return null;
}

export function imageFormatToContentType(fmt: 'webp' | 'png' | 'jpeg'): string {
  return fmt === 'png' ? 'image/png' : fmt === 'jpeg' ? 'image/jpeg' : 'image/webp';
}

/**
 * 校验生成的 banner 图片字节是否可用。
 *
 * 历史事故（2026-09）：wanx 生成的 5 张 hero 图下半部分为纯黑
 * （生成中断但文件完整），发布链路无任何校验直接上传，导致
 * 卡片与 banner 半黑。Workers 无法解码像素做半黑检测（像素级
 * 检测由回收入库时的本地脚本负责），这里至少校验：
 * 1. 文件大小合理（>30KB）
 * 2. 是可识别的图片容器（WebP / PNG / JPEG 均可）
 * 3. 声明尺寸达到请求的 1280x720 量级（宽≥1000 且 高≥500）
 * 任一不满足即抛错，上层 catch 返回 null，文章回退到静态 hero 图。
 *
 * 注意：早期这里只认 WebP，而 wanx 实际会返回 PNG，于是整条链路
 * 静默失败、文章退回静态兜底图。现在按实际格式判断并校验尺寸。
 */
function validateBannerImage(bytes: ArrayBuffer): { format: 'webp' | 'png' | 'jpeg' } {
  const b = new Uint8Array(bytes);
  if (b.length < 30_000) {
    throw new Error(`banner too small (${b.length} bytes), likely truncated`);
  }

  const format = detectImageFormat(b);
  if (!format) {
    throw new Error(`banner is not a recognised image (magic: ${b[0]?.toString(16)} ${b[1]?.toString(16)} ${b[2]?.toString(16)} ${b[3]?.toString(16)})`);
  }

  let width = 0;
  let height = 0;

  if (format === 'png') {
    // IHDR: 宽高各 4 字节大端，位于第 16 字节起
    width = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19];
    height = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23];
  } else if (format === 'jpeg') {
    // 逐个扫描 SOFn 标记（0xFFC0 ~ 0xFFCF，排除 C4/C8/CC）
    let offset = 2;
    while (offset + 9 < b.length) {
      if (b[offset] !== 0xff) { offset++; continue; }
      const marker = b[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        height = (b[offset + 5] << 8) | b[offset + 6];
        width = (b[offset + 7] << 8) | b[offset + 8];
        break;
      }
      offset += 2 + ((b[offset + 2] << 8) | b[offset + 3]);
    }
  } else {
    const fourcc = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (fourcc === 'VP8X') {
      // extended format: 24-bit little-endian canvas size minus one
      width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
      height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    } else if (fourcc === 'VP8L') {
      // lossless: 14-bit little-endian bitstream after signature byte
      width = 1 + ((b[21] | (b[22] << 8)) & 0x3fff);
      height = 1 + ((((b[22] >> 6) | (b[23] << 2) | (b[24] << 10)) & 0x3fff));
    } else if (fourcc === 'VP8 ') {
      // lossy: sync code 0x9D 0x01 0x2A then 14-bit width/height
      if (b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
        width = (b[26] | (b[27] << 8)) & 0x3fff;
        height = (b[28] | (b[29] << 8)) & 0x3fff;
      }
    }
  }

  if (width < 1000 || height < 500) {
    throw new Error(`banner dimensions too small (${width}x${height}), expected 1280x720`);
  }
  console.log(`[banner-gen] Validated banner: ${format} ${width}x${height}, ${b.length} bytes`);
  return { format };
}

/**
 * 为新增动态页面生成 Banner 图片
 * 仅用于 AI 生成的文章页面，不影响已有静态页面
 *
 * @returns Banner 图片的相对 URL（如 /images/banner/galvanized-wire-hero.webp），失败返回 null
 */
export async function generateBannerImage(
  env: BannerGenEnv,
  keyword: string,
  slug: string,
): Promise<string | null> {
  if (!env.QWEN_API_KEY) {
    console.log('[banner-gen] No QWEN_API_KEY configured, skipping banner generation');
    return null;
  }

  if (!env.IMAGES) {
    console.log('[banner-gen] No IMAGES bucket configured, skipping banner generation');
    return null;
  }

  const prompt = buildBannerPrompt(keyword);

  console.log(`[banner-gen] Generating banner for: ${slug} (keyword: ${keyword})`);

  try {
    const taskId = await submitBannerTask(env.QWEN_API_KEY, prompt);
    console.log(`[banner-gen] Submitted task ${taskId} for ${slug}`);

    const imageUrl = await pollBannerResult(env.QWEN_API_KEY, taskId);

    // 下载图片
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error('Failed to download generated banner image');
    const imageBytes = await imgResp.arrayBuffer();

    // 发布前校验：坏图（截断/尺寸不足）直接判定失败，回退静态 hero 图。
    // 同时拿到真实格式 —— wanx 并不总是返回 WebP，Content-Type 必须跟着实际走，
    // 否则浏览器拿到 image/webp 声明却收到 PNG 字节。
    const { format } = validateBannerImage(imageBytes);

    // 文件名带上内容哈希。
    //
    // 图片响应由 Worker 从 R2 返回，并带 immutable 长缓存；若沿用固定的
    // `{slug}-hero.webp`，重新生成后 CDN 仍会一直吐旧图（实测 cf-cache-status: HIT，
    // 加查询参数也没用，Cloudflare 的缓存键不含 query）。文件名随内容变化后，
    // 新图天然是一条新 URL，缓存问题消失。
    const hash = (await sha256Hex(imageBytes)).slice(0, 10);
    const imageKey = `banner/${slug}-hero-${hash}.${format}`;

    // 上传到 R2（旧文件保留，供仍引用旧 URL 的历史页面使用）
    await env.IMAGES.put(imageKey, imageBytes, {
      httpMetadata: {
        contentType: imageFormatToContentType(format),
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const bannerUrl = `/images/${imageKey}`;
    console.log(`[banner-gen] Banner saved: ${bannerUrl}`);
    return bannerUrl;
  } catch (err) {
    console.error(`[banner-gen] Failed for ${slug}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
