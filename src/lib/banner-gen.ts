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
 * 关键词 → Banner 提示词映射
 * 根据关键词生成对应的工业风格 Banner 描述
 */
function buildBannerPrompt(keyword: string): string {
  const kw = keyword.toLowerCase();

  // 产品类关键词
  if (kw.includes('gabion')) {
    return 'gabion wire mesh cages filled with natural stones, retaining wall construction site, industrial landscape, golden hour lighting, professional commercial photography, wide angle, cinematic, dark moody tones, 8k resolution';
  }
  if (kw.includes('chain link') || kw.includes('chain-link')) {
    return 'galvanized chain link fence installation, metallic steel mesh, industrial security perimeter, construction site background, dramatic lighting, professional commercial photography, wide angle, cinematic, 8k resolution';
  }
  if (kw.includes('razor wire') || kw.includes('razor-wire')) {
    return 'razor wire concertina coil on security fence, industrial perimeter protection, dramatic sunset lighting, professional commercial photography, wide angle, cinematic, dark industrial tones, 8k resolution';
  }
  if (kw.includes('barbed wire') || kw.includes('barbed-wire')) {
    return 'barbed wire fence line, rural agricultural boundary, golden hour backlight, professional commercial photography, wide angle, cinematic, warm industrial tones, 8k resolution';
  }
  if (kw.includes('welded wire') || kw.includes('welded-wire')) {
    return 'welded wire mesh panels, modern industrial fencing, clean geometric patterns, factory setting, professional commercial photography, wide angle, cinematic, 8k resolution';
  }
  if (kw.includes('hexagonal') || kw.includes('hexagonal wire')) {
    return 'hexagonal wire mesh chicken netting, agricultural fencing, green countryside background, professional commercial photography, wide angle, cinematic, 8k resolution';
  }
  if (kw.includes('security fence') || kw.includes('high security')) {
    return 'high security fence system with anti-climb mesh, industrial facility perimeter, dramatic lighting, professional commercial photography, wide angle, cinematic, dark tones, 8k resolution';
  }
  if (kw.includes('fence post') || kw.includes('post')) {
    return 'metal fence posts installation, steel Y-post and T-post, construction site, professional commercial photography, wide angle, cinematic, industrial tones, 8k resolution';
  }
  if (kw.includes('wire mesh')) {
    return 'wire mesh manufacturing, steel wire grid panels, industrial factory setting, professional commercial photography, wide angle, cinematic, metallic tones, 8k resolution';
  }
  if (kw.includes('galvanized')) {
    return 'galvanized steel wire products, shiny metallic surface, industrial manufacturing, professional commercial photography, wide angle, cinematic, silver tones, 8k resolution';
  }
  if (kw.includes('358') || kw.includes('anti-climb')) {
    return '358 high security anti-climb fence, prison grade security fencing, industrial facility, professional commercial photography, wide angle, cinematic, dark tones, 8k resolution';
  }
  if (kw.includes('manufacturer') || kw.includes('supplier') || kw.includes('factory')) {
    return 'metal fencing manufacturing facility, large-scale industrial production, wire mesh factory interior, professional commercial photography, wide angle, cinematic, industrial tones, 8k resolution';
  }
  if (kw.includes('guide') || kw.includes('buying') || kw.includes('b2b')) {
    return 'industrial metal fencing products showcase, professional B2B catalog style, clean composition, dramatic lighting, professional commercial photography, wide angle, cinematic, 8k resolution';
  }

  // 通用工业风格 Banner
  return 'industrial metal fencing and wire mesh products, professional B2B photography, wide angle composition, dramatic lighting, dark moody industrial tones, cinematic quality, 8k resolution, photorealistic';
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
  const imageKey = `banner/${slug}-hero.webp`;

  console.log(`[banner-gen] Generating banner for: ${slug} (keyword: ${keyword})`);

  try {
    const taskId = await submitBannerTask(env.QWEN_API_KEY, prompt);
    console.log(`[banner-gen] Submitted task ${taskId} for ${slug}`);

    const imageUrl = await pollBannerResult(env.QWEN_API_KEY, taskId);

    // 下载图片
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error('Failed to download generated banner image');
    const imageBytes = await imgResp.arrayBuffer();

    // 上传到 R2
    await env.IMAGES.put(imageKey, imageBytes, {
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
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
