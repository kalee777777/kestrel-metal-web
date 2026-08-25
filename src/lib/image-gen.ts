/**
 * Phase 06: AI 图片生成管线
 *
 * 功能：
 * - 生成 Hero 大图（1280×720px）
 * - 生成内容配图（800×600px ×2-4 张）
 * - 上传到 R2 存储
 * - 返回图片 URL
 *
 * 注意：当前为占位实现，需要用户提供真实的图片生成 API Token
 */

export interface ImageGenEnv {
  IMG_API_KEY?: string;
  IMAGES?: R2Bucket;
}

export interface ImageRequest {
  keyword: string;
  productLine?: string;
  style?: 'industrial' | 'product' | 'scene' | 'detail';
  width?: number;
  height?: number;
}

export interface GeneratedImage {
  key: string;
  url: string;
  width: number;
  height: number;
  type: 'hero' | 'content' | 'thumbnail';
}

const PLACEHOLDER_RESPONSE: GeneratedImage = {
  key: 'placeholder.jpg',
  url: '/images/placeholder.jpg',
  width: 1280,
  height: 720,
  type: 'hero',
};

async function generateSingleImage(
  env: ImageGenEnv,
  request: ImageRequest,
): Promise<GeneratedImage> {
  if (!env.IMG_API_KEY) {
    console.log(`[image-gen] No API key configured, using placeholder`);
    return {
      ...PLACEHOLDER_RESPONSE,
      key: `placeholders/${request.keyword.replace(/\s+/g, '-')}-${Date.now()}.jpg`,
    };
  }

  const prompt = buildPrompt(request);

  const resp = await fetch('https://api.example.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.IMG_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      width: request.width ?? 1280,
      height: request.height ?? 720,
      format: 'webp',
      quality: 80,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Image generation failed (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as { image_url: string; image_base64?: string };

  let imageBytes: ArrayBuffer;

  if (data.image_base64) {
    const binaryStr = atob(data.image_base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    imageBytes = bytes.buffer;
  } else {
    const imgResp = await fetch(data.image_url);
    if (!imgResp.ok) throw new Error('Failed to download generated image');
    imageBytes = await imgResp.arrayBuffer();
  }

  const imageKey = `blog/${request.keyword.replace(/\s+/g, '-')}-${Date.now()}.webp`;

  if (env.IMAGES) {
    await env.IMAGES.put(imageKey, imageBytes, {
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      },
    });
  }

  return {
    key: imageKey,
    url: `/images/${imageKey}`,
    width: request.width ?? 1280,
    height: request.height ?? 720,
    type: 'hero',
  };
}

function buildPrompt(request: ImageRequest): string {
  const baseStyle = 'professional industrial photography, high-end commercial product photography';
  const lighting = 'studio lighting with dramatic shadows, warm industrial tones';
  const quality = '8k resolution, photorealistic, sharp focus, depth of field';

  const productPrompts: Record<string, string> = {
    'chain-link': 'galvanized chain link fence installation, metallic silver steel mesh, industrial security fencing',
    'gabion': 'gabion box wire mesh cage filled with natural stone, landscape retaining wall, erosion control',
    'razor': 'razor wire concertina coil on top of security fence, industrial perimeter protection',
    'welded': 'welded wire mesh panel fence, double wire construction, modern industrial fencing',
    'high-security': 'high-security fence with barbed wire topping, anti-climb mesh, perimeter protection system',
  };

  const productDesc = productPrompts[request.productLine ?? ''] ?? 'metal fencing products, industrial security solutions';

  const styleModifiers: Record<string, string> = {
    industrial: 'factory background, warehouse setting, large-scale installation',
    product: 'product showcase, clean background, detailed close-up',
    scene: 'real-world installation, outdoor setting, natural environment',
    detail: 'extreme close-up, texture detail, material quality focus',
  };

  const styleDesc = styleModifiers[request.style ?? 'industrial'] ?? styleModifiers.industrial;

  return `${productDesc}, ${styleDesc}, ${baseStyle}, ${lighting}, ${quality}, kestrel metal brand quality`;
}

export async function generateArticleImages(
  env: ImageGenEnv,
  keyword: string,
  productLine?: string,
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];

  const heroImage = await generateSingleImage(env, {
    keyword,
    productLine,
    style: 'industrial',
    width: 1280,
    height: 720,
  });
  heroImage.type = 'hero';
  images.push(heroImage);

  const contentStyles: Array<{ style: ImageRequest['style']; width: number; height: number }> = [
    { style: 'product', width: 800, height: 600 },
    { style: 'scene', width: 800, height: 600 },
  ];

  for (const contentStyle of contentStyles) {
    const contentImage = await generateSingleImage(env, {
      keyword,
      productLine,
      style: contentStyle.style,
      width: contentStyle.width,
      height: contentStyle.height,
    });
    contentImage.type = 'content';
    images.push(contentImage);
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
