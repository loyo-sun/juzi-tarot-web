/**
 * 兑换码验证 API
 * POST /api/codes/verify
 * 
 * 功能：验证兑换码有效性并返回剩余次数
 */

import { verifyRedemptionCode } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        error: '请输入兑换码'
      });
    }

    // 验证兑换码
    const codeData = await verifyRedemptionCode(code);

    // 计算剩余次数
    const questionLeft = codeData.question_limit - codeData.question_used;
    const followupPerQuestion = codeData.followup_limit_per_question;

    return res.status(200).json({
      valid: true,
      code: codeData.code,
      questionLeft,
      followupPerQuestion,
      expiresAt: codeData.expires_at,
      firstUsedAt: codeData.first_used_at,
      message: questionLeft > 0
        ? `兑换码有效，还可提问 ${questionLeft} 次`
        : '兑换码次数已用完'
    });

  } catch (error) {
    console.error('兑换码验证失败:', error);
    
    return res.status(400).json({
      valid: false,
      error: error.message || '兑换码验证失败'
    });
  }
}
