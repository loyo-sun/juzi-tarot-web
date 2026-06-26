/**
 * 添加追问 API
 * POST /api/tarot/followup
 * 
 * 功能：为已有占卜添加追问，验证追问次数限制
 */

import { supabase } from '../../lib/supabase.js';

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
    const { sessionId, code, question, card, reading } = req.body;

    // 验证输入
    if (!sessionId) {
      return res.status(400).json({ error: '请提供占卜会话 ID' });
    }

    if (!code) {
      return res.status(400).json({ error: '请提供兑换码' });
    }

    if (!question || question.length < 2) {
      return res.status(400).json({ error: '追问至少需要2个字符' });
    }

    if (!card) {
      return res.status(400).json({ error: '请提供追问牌' });
    }

    // 验证会话和兑换码
    const { data: session, error: sessionError } = await supabase
      .from('tarot_sessions')
      .select('id, code')
      .eq('id', sessionId)
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: '占卜会话不存在或无权访问' });
    }

    // 获取兑换码的追问限制
    const { data: codeData, error: codeError } = await supabase
      .from('redemption_codes')
      .select('followup_limit_per_question')
      .eq('code', code.toUpperCase())
      .single();

    if (codeError || !codeData) {
      return res.status(400).json({ error: '兑换码无效' });
    }

    // 检查已有追问次数
    const { count: followupCount, error: countError } = await supabase
      .from('tarot_followups')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (countError) {
      console.error('查询追问次数失败:', countError);
      throw new Error('查询追问次数失败');
    }

    if (followupCount >= codeData.followup_limit_per_question) {
      return res.status(400).json({
        error: `每题最多追问 ${codeData.followup_limit_per_question} 次`,
        followupLeft: 0
      });
    }

    // 创建追问记录
    const { data: followup, error: followupError } = await supabase
      .from('tarot_followups')
      .insert({
        session_id: sessionId,
        code: code.toUpperCase(),
        followup_question: question.trim(),
        card: card,
        ai_reading: reading || null
      })
      .select()
      .single();

    if (followupError) {
      console.error('创建追问记录失败:', followupError);
      throw new Error('创建追问记录失败');
    }

    const followupLeft = codeData.followup_limit_per_question - followupCount - 1;

    return res.status(200).json({
      success: true,
      followupId: followup.id,
      followupLeft,
      message: followupLeft > 0
        ? `追问成功，本题还可追问 ${followupLeft} 次`
        : '追问成功，本题追问次数已用完'
    });

  } catch (error) {
    console.error('添加追问失败:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || '添加追问失败'
    });
  }
}
