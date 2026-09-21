/**
 * Phase 05 + 06: AI 内容 + 图片生成 Cron 任务
 *
 * 每日 04:00 UTC+8 自动执行（每天 1 个产品组 = 1 篇文章）：
 * 1. 把关键词池按产品线聚类（keyword-cluster）
 * 2. 排除已被已发布文章覆盖的组（去重）
 * 3. 选出本次要写的 1 个产品组
 * 4. 该组生成一篇支柱文章：主词 + 同组变体词
 * 5. 保存到 KV 草稿存储
 * 6. 为草稿文章生成配图（Qwen3.8-max）
 *
 * 变更记录：
 * - 旧逻辑是「1 关键词 → 1 篇文章」，同产品近义词被拆成多篇互相抢排名
 * - 新逻辑是「1 产品组 → 1 篇文章」，同组变体词合并覆盖
 * - 2026-09-21：节奏由「每周 2 组」改为「每日 1 组」
 *
 * 注意：每天一组会快速消耗关键词池。当前 10 个有词的组约 10 天就会全部
 * 覆盖一遍，之后依靠 selectGroups 的 partially-covered 回补（同组写新变体），
 * 产出质量会下降 —— 需要定期跑竞品缺口分析补充新词。
 */

import type { Env } from '../index';
import { generateFullArticle } from '../lib/deepseek';
import { generateArticleImages } from '../lib/image-gen';
import { saveDraft, listKeys, getJSON, setJSON } from '../lib/kv';
import {
  runClustering,
  selectGroups,
  pickArticleKeywords,
  type KeywordGroup,
} from '../lib/keyword-cluster';

/** 每次运行生成的文章数（等于「产品组」数，而非关键词数） */
const MAX_GROUPS_PER_RUN = 1;

export interface GeneratedGroupInfo {
  groupId: string;
  groupName: string;
  primaryKeyword: string;
  variants: string[];
  slug: string;
}

export interface GenerateResult {
  selectedKeywords: string[];
  generated: number;
  errors: string[];
  gapCount: number;
  opportunityCount: number;
  /** 本周选中的产品组（聚类后的选题结果） */
  groups: GeneratedGroupInfo[];
  /** 聚类概览，便于排查选题 */
  cluster: {
    totalGroups: number;
    coveredGroups: number;
    totalKeywords: number;
    ungroupedCount: number;
  };
}

export default async function generate(env: Env): Promise<GenerateResult> {
  const result: GenerateResult = {
    selectedKeywords: [],
    generated: 0,
    errors: [],
    gapCount: 0,
    opportunityCount: 0,
    groups: [],
    cluster: { totalGroups: 0, coveredGroups: 0, totalKeywords: 0, ungroupedCount: 0 },
  };

  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  console.log('[generate] Starting weekly content generation...');

  // ① 关键词聚类：竞品缺口 + GSC 机会 + GSC 排名 → 按产品线分组
  const clusterResult = await runClustering(env);
  result.cluster = {
    totalGroups: clusterResult.groups.length,
    coveredGroups: clusterResult.coveredGroupCount,
    totalKeywords: clusterResult.totalKeywords,
    ungroupedCount: clusterResult.ungrouped.length,
  };
  result.gapCount = clusterResult.groups.reduce((sum, g) => sum + g.gapCount, 0);
  result.opportunityCount = clusterResult.groups.reduce((sum, g) => sum + g.opportunityCount, 0);

  console.log(
    `[generate] Clustered ${clusterResult.totalKeywords} keywords into ${clusterResult.groups.length} groups ` +
    `(${clusterResult.coveredGroupCount} already covered)`,
  );

  // ② 选组：跳过已覆盖组，按权重降序
  let selectedGroups = selectGroups(clusterResult, MAX_GROUPS_PER_RUN);

  // ③ 兜底：关键词池为空时用默认产品线选题
  if (selectedGroups.length === 0) {
    console.log('[generate] No cluster candidates, falling back to default keyword groups');
    selectedGroups = buildFallbackGroups();
  }

  result.selectedKeywords = selectedGroups.map((g) => g.primaryKeyword);
  console.log(`[generate] Selected ${selectedGroups.length} keyword groups`);
  console.log(`[generate] Groups: ${selectedGroups.map((g) => `${g.id}(${g.keywords.length} kw)`).join(', ')}`);

  for (const group of selectedGroups) {
    try {
      const { primary, variants } = pickArticleKeywords(group);

      console.log(`[generate] Processing group "${group.id}"`);
      console.log(`[generate] Primary: "${primary}" | Variants: ${variants.join(', ') || '(none)'}`);

      const article = await generateFullArticle(
        {
          DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
          DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || 'deepseek-chat',
        },
        {
          keyword: primary,
          variants,
          productLine: group.productLine,
          targetAudience: 'B2B buyers, contractors, security professionals',
        },
      );

      await saveDraft(env.CONTENT_QUEUE, {
        slug: article.slug,
        title: article.title,
        metaDescription: article.metaDescription,
        html: article.html,
        keyword: article.keyword,
        groupId: group.id,
        variants: article.variants ?? variants,
        status: 'queued',
        createdAt: new Date().toISOString(),
        score: undefined,
        scoreRound: undefined,
        images: [],
      });

      result.generated++;
      result.groups.push({
        groupId: group.id,
        groupName: group.name,
        primaryKeyword: primary,
        variants,
        slug: article.slug,
      });

      console.log(`[generate] Article saved: ${article.slug} (${article.wordCount} words, covers ${variants.length + 1} keywords)`);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`group "${group.id}": ${errMsg}`);
      console.error(`[generate] Failed to generate article for group "${group.id}":`, errMsg);
    }
  }

  console.log(`[generate] Completed. Generated ${result.generated} articles. Errors: ${result.errors.length}`);

  await generateImagesForDrafts(env);

  return result;
}

/**
 * 关键词池为空时的兜底选题：用默认种子词构造两个产品组
 */
function buildFallbackGroups(): KeywordGroup[] {
  const mk = (id: string, name: string, productLine: string, primary: string, variants: string[]): KeywordGroup => {
    const keywords = [primary, ...variants].map((keyword, index) => ({
      keyword,
      source: 'gsc_ranking' as const,
      impressions: 0,
      clicks: 0,
      position: 100,
      competitorCount: 0,
      weight: 100 - index * 5,
    }));
    return {
      id,
      name,
      productLine,
      primaryKeyword: primary,
      keywords,
      totalWeight: keywords.reduce((s, k) => s + k.weight, 0),
      totalImpressions: 0,
      gapCount: 0,
      opportunityCount: 0,
      covered: false,
      coveredBy: null,
      coveredKeywords: [],
    };
  };

  return [
    mk(
      'chain-link',
      'Chain Link Fence / 勾花网',
      'chain-link',
      'galvanized chain link fence',
      ['chain link fence supplier', 'chain link fence price', 'chain link mesh roll'],
    ),
    mk(
      'gabion',
      'Gabion / 石笼网',
      'gabion',
      'gabion boxes supplier',
      ['gabion basket manufacturer', 'welded gabion box', 'gabion retaining wall'],
    ),
  ];
}

async function generateImagesForDrafts(env: Env): Promise<void> {
  console.log('[generate] Starting image generation for drafts...');

  const keys = await listKeys(env.CONTENT_QUEUE, 'draft:');

  if (keys.length === 0) {
    console.log('[generate] No drafts found for image generation');
    return;
  }

  let processed = 0;

  for (const key of keys) {
    const draft = await getJSON<{
      slug: string;
      keyword: string;
      status: string;
      images?: string[];
    }>(env.CONTENT_QUEUE, key.name);

    if (!draft || draft.status !== 'queued' || (draft.images && draft.images.length > 0)) {
      continue;
    }

    try {
      console.log(`[generate] Generating images for: ${draft.slug}`);

      const images = await generateArticleImages(
        {
          QWEN_API_KEY: env.QWEN_API_KEY,
          QWEN_MODEL: env.QWEN_MODEL,
          IMAGES: env.IMAGES,
        },
        draft.keyword,
        draft.slug,
      );

      await setJSON(env.CONTENT_QUEUE, key.name, {
        ...draft,
        status: 'image_gen',
        images: images.map((img) => img.url),
        imageKeys: images.map((img) => img.key),
      });

      processed++;
      console.log(`[generate] Generated ${images.length} images for ${draft.slug}`);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`[generate] Failed to generate images for ${draft.slug}:`, err);
    }
  }

  console.log(`[generate] Image generation completed. Processed ${processed} drafts.`);
}
