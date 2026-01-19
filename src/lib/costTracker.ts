/**
 * API Cost Tracker
 * 
 * Tracks API usage and estimated costs for AI services.
 * Provides alerts when approaching budget limits.
 */

import { logger } from './logger';
import { createClient } from './supabase/server';

// Cost estimates (as of Jan 2026 - update these periodically)
const COST_ESTIMATES = {
  openai: {
    'gpt-5-nano-2025-08-07': {
      input: 0.0001, // per 1K tokens
      output: 0.0002, // per 1K tokens
    },
  },
  gemini: {
    'gemini-3-pro-image-preview': {
      perImage: 0.05, // per image generation
    },
  },
} as const;

// Budget limits (configurable)
const BUDGET_LIMITS = {
  daily: 10.0, // $10/day
  weekly: 50.0, // $50/week
  monthly: 150.0, // $150/month
};

export type AIService = 'openai' | 'gemini';

interface UsageMetrics {
  service: AIService;
  tokensUsed?: number;
  imagesGenerated?: number;
  estimatedCost: number;
}

/**
 * Track AI API usage and cost
 */
export async function trackCost(metrics: UsageMetrics): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase.from('cost_tracking').insert({
      service: metrics.service,
      tokens_used: metrics.tokensUsed || null,
      images_generated: metrics.imagesGenerated || null,
      estimated_cost: metrics.estimatedCost,
      timestamp: new Date().toISOString(),
    });
    
    logger.debug('Cost tracked', {
      service: metrics.service,
      cost: metrics.estimatedCost,
      tokens: metrics.tokensUsed,
      images: metrics.imagesGenerated,
    });
    
    // Check if we're approaching limits
    await checkBudgetLimits(metrics.service);
  } catch (error) {
    logger.warn('Failed to track cost', { error, service: metrics.service });
  }
}

/**
 * Estimate cost for OpenAI call
 */
export function estimateOpenAICost(inputTokens: number, outputTokens: number): number {
  const costs = COST_ESTIMATES.openai['gpt-5-nano-2025-08-07'];
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  return inputCost + outputCost;
}

/**
 * Estimate cost for Gemini image generation
 */
export function estimateGeminiCost(imageCount: number = 1): number {
  return imageCount * COST_ESTIMATES.gemini['gemini-3-pro-image-preview'].perImage;
}

/**
 * Check if we're approaching budget limits
 */
async function checkBudgetLimits(service: AIService): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get daily spending
    const { data: dailyData } = await supabase
      .from('cost_tracking')
      .select('estimated_cost')
      .eq('service', service)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    const dailySpending = dailyData?.reduce((sum, row) => sum + Number(row.estimated_cost), 0) || 0;
    
    // Get weekly spending
    const { data: weeklyData } = await supabase
      .from('cost_tracking')
      .select('estimated_cost')
      .eq('service', service)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const weeklySpending = weeklyData?.reduce((sum, row) => sum + Number(row.estimated_cost), 0) || 0;
    
    // Check thresholds
    if (dailySpending > BUDGET_LIMITS.daily * 0.9) {
      logger.warn('Approaching daily budget limit', {
        service,
        currentSpending: dailySpending,
        limit: BUDGET_LIMITS.daily,
        percentUsed: (dailySpending / BUDGET_LIMITS.daily) * 100,
      });
    }
    
    if (weeklySpending > BUDGET_LIMITS.weekly * 0.9) {
      logger.warn('Approaching weekly budget limit', {
        service,
        currentSpending: weeklySpending,
        limit: BUDGET_LIMITS.weekly,
        percentUsed: (weeklySpending / BUDGET_LIMITS.weekly) * 100,
      });
    }
    
    // Hard limit: stop if exceeded
    if (dailySpending > BUDGET_LIMITS.daily) {
      throw new Error(`Daily budget limit exceeded for ${service}. Current: $${dailySpending.toFixed(2)}, Limit: $${BUDGET_LIMITS.daily}`);
    }
  } catch (error) {
    logger.error('Budget check failed', error as Error, { service });
    // Don't throw - allow the request to proceed but log the error
  }
}

/**
 * Get spending summary
 */
export async function getSpendingSummary(
  service?: AIService,
  period: 'day' | 'week' | 'month' = 'day'
): Promise<{
  totalCost: number;
  totalTokens: number;
  totalImages: number;
  requestCount: number;
}> {
  try {
    const supabase = await createClient();
    
    const periodMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    }[period];
    
    const since = new Date(Date.now() - periodMs).toISOString();
    
    let query = supabase
      .from('cost_tracking')
      .select('*')
      .gte('timestamp', since);
    
    if (service) {
      query = query.eq('service', service);
    }
    
    const { data } = await query;
    
    if (!data || data.length === 0) {
      return { totalCost: 0, totalTokens: 0, totalImages: 0, requestCount: 0 };
    }
    
    const summary = data.reduce(
      (acc, row) => ({
        totalCost: acc.totalCost + Number(row.estimated_cost),
        totalTokens: acc.totalTokens + (row.tokens_used || 0),
        totalImages: acc.totalImages + (row.images_generated || 0),
        requestCount: acc.requestCount + 1,
      }),
      { totalCost: 0, totalTokens: 0, totalImages: 0, requestCount: 0 }
    );
    
    return summary;
  } catch (error) {
    logger.error('Failed to get spending summary', error as Error);
    return { totalCost: 0, totalTokens: 0, totalImages: 0, requestCount: 0 };
  }
}

/**
 * Get budget status
 */
export async function getBudgetStatus(): Promise<{
  daily: { used: number; limit: number; percentUsed: number; remaining: number };
  weekly: { used: number; limit: number; percentUsed: number; remaining: number };
}> {
  const dailySummary = await getSpendingSummary(undefined, 'day');
  const weeklySummary = await getSpendingSummary(undefined, 'week');
  
  return {
    daily: {
      used: dailySummary.totalCost,
      limit: BUDGET_LIMITS.daily,
      percentUsed: (dailySummary.totalCost / BUDGET_LIMITS.daily) * 100,
      remaining: Math.max(0, BUDGET_LIMITS.daily - dailySummary.totalCost),
    },
    weekly: {
      used: weeklySummary.totalCost,
      limit: BUDGET_LIMITS.weekly,
      percentUsed: (weeklySummary.totalCost / BUDGET_LIMITS.weekly) * 100,
      remaining: Math.max(0, BUDGET_LIMITS.weekly - weeklySummary.totalCost),
    },
  };
}
