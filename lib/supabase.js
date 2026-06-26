/**
 * Supabase 客户端工具
 * 用于后端 API 访问数据库
 */

import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error('缺少环境变量 SUPABASE_URL');
}

if (!supabaseAnonKey && !supabaseServiceKey) {
  throw new Error('缺少环境变量 SUPABASE_ANON_KEY 或 SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * 普通客户端 - 用于前端功能（兑换码验证、占卜记录等）
 * 使用 anon key，有 RLS 限制（如果启用）
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 管理员客户端 - 用于管理后台
 * 使用 service_role key，绕过 RLS，拥有完全权限
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * 验证兑换码并返回详细信息
 * @param {string} code - 兑换码
 * @returns {Promise<Object>} 兑换码信息
 */
export async function verifyRedemptionCode(code) {
  if (!code) {
    throw new Error('兑换码不能为空');
  }

  const { data, error } = await supabase
    .from('redemption_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    throw new Error('无效的兑换码');
  }

  // 检查状态
  if (data.status !== 'active') {
    if (data.status === 'expired') {
      throw new Error('兑换码已过期');
    } else if (data.status === 'disabled') {
      throw new Error('兑换码已被禁用');
    }
    throw new Error('兑换码不可用');
  }

  // 检查过期时间
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // 自动更新状态为 expired
    await supabase
      .from('redemption_codes')
      .update({ status: 'expired' })
      .eq('id', data.id);
    throw new Error('兑换码已过期');
  }

  // 检查次数
  if (data.question_used >= data.question_limit) {
    throw new Error('兑换码次数已用完');
  }

  return data;
}

/**
 * 扣减问题次数
 * @param {string} codeId - 兑换码 ID
 * @returns {Promise<boolean>}
 */
export async function decrementQuestionCount(codeId) {
  const { error } = await supabase.rpc('use_question_count', {
    code_id: codeId
  });

  if (error) {
    // 如果函数不存在，使用备用方法
    const { data: current } = await supabase
      .from('redemption_codes')
      .select('question_used')
      .eq('id', codeId)
      .single();

    if (!current) {
      throw new Error('兑换码不存在');
    }

    const { error: updateError } = await supabase
      .from('redemption_codes')
      .update({
        question_used: current.question_used + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', codeId);

    if (updateError) {
      throw new Error('扣减次数失败');
    }
  }

  return true;
}

/**
 * 更新首次使用时间
 * @param {string} codeId - 兑换码 ID
 */
export async function updateFirstUsed(codeId) {
  await supabase
    .from('redemption_codes')
    .update({ first_used_at: new Date().toISOString() })
    .eq('id', codeId)
    .is('first_used_at', null);
}
