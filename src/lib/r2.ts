/**
 * Cloudflare R2 封装 — 图片存储操作
 * 用于 AI 生成图片的二进制存储和读取
 */

/** 上传图片到 R2 */
export async function putImage(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | ReadableStream,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<void> {
  await bucket.put(key, data, {
    httpMetadata: { contentType },
    customMetadata: metadata,
  });
}

/** 从 R2 读取图片 */
export async function getImage(
  bucket: R2Bucket,
  key: string,
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

/** 获取图片元信息（不下载内容） */
export async function getImageMeta(
  bucket: R2Bucket,
  key: string,
): Promise<R2Object | null> {
  return bucket.head(key);
}

/** 删除图片 */
export async function deleteImage(
  bucket: R2Bucket,
  key: string,
): Promise<void> {
  await bucket.delete(key);
}

/** 列出指定前缀下的所有图片 */
export async function listImages(
  bucket: R2Bucket,
  prefix: string,
  limit = 100,
): Promise<R2Object[]> {
  const result = await bucket.list({ prefix, limit });
  return result.objects;
}

/** 生成图片的公开访问 URL（通过 Worker 路由代理） */
export function imageUrl(key: string): string {
  return `/api/images/${key}`;
}

/**
 * 将 R2 图片作为 HTTP Response 返回
 * 设置正确的 Content-Type 和缓存头
 */
export async function serveImage(
  bucket: R2Bucket,
  key: string,
): Promise<Response> {
  const obj = await bucket.get(key);
  if (!obj) {
    return new Response('Image not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType ?? 'image/webp');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', obj.httpEtag);

  return new Response(obj.body, { headers });
}
