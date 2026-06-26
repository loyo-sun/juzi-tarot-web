/**
 * 开始占卜 API
 * POST /api/tarot/start
 * 
 * 功能：创建新占卜记录并扣减问题次数
 */

import { supabase, verifyRedemptionCode, decrementQuestionCount, updateFirstUsed } from '../../lib/supabase.js';

export default async function handler(req, res) {
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
    const { code, question, cards } = req.body;

    // 验证输入
    if (!code) {
      return res.status(400).json({ error: '请提供兑换码' });
    }

    if (!question || question.length < 5) {
      return res.status(400).json({ error: '问题至少需要5个字符' });
    }

    if (!cards || !Array.isArray(cards) || cards.length !== 3) {
      return res.status(400).json({ error: '必须提供3张牌' });
    }

    // 验证兑换码
    const codeData = await verifyRedemptionCode(code);

    // 创建占卜记录
    const { data: session, error: sessionError } = await supabase
      .from('tarot_sessions')
      .insert({
        code: codeData.code,
        question: question.trim(),
        cards: cards,
        status: 'in_progress'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('创建占卜记录失败:', sessionError);
      throw new Error('创建占卜记录失败');
    }

    // 扣减问题次数
    await decrementQuestionCount(codeData.id);

    // 更新首次使用时间（如果是第一次）
    await updateFirstUsed(codeData.id);

    // 计算剩余次数
    const questionLeft = codeData.question_limit - codeData.question_used - 1;
    const followupLeft = codeData.followup_limit_per_question;

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      questionLeft,
      followupLeft,
      message: '占卜开始成功'
    });

  } catch (error) {
    console.error('开始占卜失败:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || '开始占卜失败'
    });
  }
}
