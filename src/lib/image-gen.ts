/**
 * Phase 06: AI 图片生成管线
 *
 * 使用阿里云 DashScope 万相 wanx-v1 文生图 API
 * 功能：
 * - 生成 Hero 大图（1024×1024px）
 * - 生成内容配图（1024×1024px ×2 张）
 * - 上传到 R2 存储
 * - 返回图片 URL
 */

export interface ImageGenEnv {
  QWEN_API_KEY?: string;
  QWEN_MODEL?: string;
  IMAGES?: R2Bucket;
}

export interface ImageRequest {
  keyword: string;
  productLine?: string;
  style?: 'industrial' | 'product' | 'scene' | 'detail';
  width?: number;
  height?: number;
  keyOverride?: string;
}

export interface GeneratedImage {
  key: string;
  url: string;
  width: number;
  height: number;
  type: 'hero' | 'content' | 'thumbnail';
}

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 30; // 最多等 150 秒

async function submitImageTask(
  apiKey: string,
  prompt: string,
  size: string,
): Promise<string> {
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
        size,
        n: 1,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`DashScope submit error (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as { output: { task_id: string } };
  const taskId = data.output?.task_id;
  if (!taskId) throw new Error('No task_id in response');
  return taskId;
}

async function pollTaskResult(
  apiKey: string,
  taskId: string,
): Promise<string[]> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const resp = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`DashScope poll error (${resp.status}): ${errText}`);
    }

    const data = (await resp.json()) as {
      output: {
        task_status: string;
        results?: Array<{ url: string }>;
        message?: string;
      };
    };

    const status = data.output.task_status;
    console.log(`[image-gen] Task ${taskId}: ${status} (attempt ${i + 1})`);

    if (status === 'SUCCEEDED') {
      const urls = data.output.results?.map((r) => r.url) ?? [];
      if (urls.length === 0) throw new Error('Task succeeded but no image URLs returned');
      return urls;
    }

    if (status === 'FAILED') {
      throw new Error(`Task failed: ${data.output.message ?? 'unknown error'}`);
    }

    // PENDING / RUNNING: continue polling
  }

  throw new Error(`Task ${taskId} timed out after ${MAX_POLL_ATTEMPTS} polls`);
}

async function generateSingleImage(
  env: ImageGenEnv,
  request: ImageRequest,
): Promise<GeneratedImage> {
  if (!env.QWEN_API_KEY) {
    console.log(`[image-gen] No API key configured, using placeholder`);
    return {
      key: `placeholders/${request.keyword.replace(/\s+/g, '-')}-${Date.now()}.jpg`,
      url: '/images/placeholder.jpg',
      width: request.width ?? 1024,
      height: request.height ?? 1024,
      type: 'hero',
    };
  }

  const prompt = buildPrompt(request);
  const size = '1024*1024';

  console.log(`[image-gen] Submitting task for: ${request.keyword}`);
  const taskId = await submitImageTask(env.QWEN_API_KEY, prompt, size);

  console.log(`[image-gen] Polling task ${taskId}...`);
  const imageUrls = await pollTaskResult(env.QWEN_API_KEY, taskId);

  // Download the first image
  const imgResp = await fetch(imageUrls[0]);
  if (!imgResp.ok) throw new Error('Failed to download generated image');
  const imageBytes = await imgResp.arrayBuffer();

  const imageKey =
    request.keyOverride ||
    `blog/${request.keyword.replace(/\s+/g, '-')}-${Date.now()}.jpg`;

  if (env.IMAGES) {
    await env.IMAGES.put(imageKey, imageBytes, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      },
    });
  }

  return {
    key: imageKey,
    url: `/images/${imageKey}`,
    width: request.width ?? 1024,
    height: request.height ?? 1024,
    type: 'hero',
  };
}

function buildPrompt(request: ImageRequest): string {
  const productPrompts: Record<string, string> = {
    'chain-link':
      'galvanized chain link fence installation, metallic silver steel mesh, industrial security fencing on a construction site',
    gabion:
      'gabion box wire mesh cage filled with natural stone, landscape retaining wall, erosion control in outdoor setting',
    razor:
      'razor wire concertina coil on top of security fence, industrial perimeter protection, bright daylight',
    welded:
      'welded wire mesh panel fence, double wire construction, modern industrial fencing, clean professional look',
    'high-security':
      'high-security fence with barbed wire topping, anti-climb mesh, perimeter protection system at industrial facility',
  };

  const productDesc =
    productPrompts[request.productLine ?? ''] ??
    'metal fencing products, industrial security solutions, wire mesh manufacturing';

  const styleModifiers: Record<string, string> = {
    industrial: 'factory background, warehouse setting, large-scale installation, bright even lighting',
    product: 'product showcase, clean white background, detailed close-up, studio lighting',
    scene: 'real-world installation, outdoor setting, natural environment, bright daylight',
    detail: 'extreme close-up, texture detail, material quality focus, macro photography',
  };

  const styleDesc =
    styleModifiers[request.style ?? 'industrial'] ?? styleModifiers.industrial;

  return `${productDesc}, ${styleDesc}, professional industrial photography, high-end commercial product photography, studio lighting, warm industrial tones, 8k resolution, photorealistic, sharp focus, depth of field`;
}

export async function generateArticleImages(
  env: ImageGenEnv,
  keyword: string,
  slug?: string,
  productLine?: string,
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];

  // Generate hero image
  const heroKey = slug ? `blog/${slug}-hero.webp` : undefined;
  try {
    const heroImage = await generateSingleImage(env, {
      keyword,
      productLine,
      style: 'industrial',
      width: 1280,
      height: 720,
      keyOverride: heroKey,
    });
    heroImage.type = 'hero';
    images.push(heroImage);
  } catch (err) {
    console.error(`[image-gen] Hero image failed for ${keyword}:`, err);
  }

  // Generate content images
  const contentStyles: Array<{ style: ImageRequest['style']; width: number; height: number }> = [
    { style: 'product', width: 800, height: 600 },
    { style: 'scene', width: 800, height: 600 },
  ];

  for (const contentStyle of contentStyles) {
    try {
      const contentImage = await generateSingleImage(env, {
        keyword,
        productLine,
        style: contentStyle.style,
        width: contentStyle.width,
        height: contentStyle.height,
      });
      contentImage.type = 'content';
      images.push(contentImage);
    } catch (err) {
      console.error(`[image-gen] Content image failed for ${keyword}:`, err);
    }
  }

  return images;
}

export async function uploadImageToR2(
  env: ImageGenEnv,
  key: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<string> {
  if (!env.IMAGES) {
    throw new Error('R2 bucket not configured');
  }

  await env.IMAGES.put(key, data, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  return `/images/${key}`;
}

export async function getImageUrl(
  env: ImageGenEnv,
  key: string,
): Promise<string | null> {
  if (!env.IMAGES) return null;

  const head = await env.IMAGES.head(key);
  if (!head) return null;

  return `/images/${key}`;
}

export async function deleteImage(
  env: ImageGenEnv,
  key: string,
): Promise<void> {
  if (!env.IMAGES) return;

  await env.IMAGES.delete(key);
}
