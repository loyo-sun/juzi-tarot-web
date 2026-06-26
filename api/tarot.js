/**
 * 塔罗相关 API（合并）
 * 
 * Actions:
 * - POST /api/tarot?action=start - 开始占卜
 * - POST /api/tarot?action=save - 保存解析结果
 * - POST /api/tarot?action=followup - 添加追问
 * - POST /api/tarot?action=angel - 保存天使祝福
 * - GET /api/tarot?action=history&code=xxx - 获取历史记录
 */

import { supabase, verifyRedemptionCode, decrementQuestionCount, updateFirstUsed } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const action = req.query.action || req.body?.action;

  if (!action) {
    return res.status(400).json({ error: '请提供 action 参数' });
  }

  try {
    switch (action) {
      case 'start':
        return await handleStart(req, res);
      case 'save':
        return await handleSave(req, res);
      case 'followup':
        return await handleFollowup(req, res);
      case 'angel':
        return await handleAngel(req, res);
      case 'history':
        return await handleHistory(req, res);
      default:
        return res.status(400).json({ error: '无效的 action 参数' });
    }
  } catch (error) {
    console.error('塔罗 API 错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    });
  }
}

/**
 * 开始占卜
 */
async function handleStart(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

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
}

/**
 * 保存解析结果
 */
async function handleSave(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { sessionId, code, reading } = req.body;

  // 验证输入
  if (!sessionId) {
    return res.status(400).json({ error: '请提供占卜会话 ID' });
  }

  if (!code) {
    return res.status(400).json({ error: '请提供兑换码' });
  }

  if (!reading) {
    return res.status(400).json({ error: '请提供解析结果' });
  }

  // 验证会话归属
  const { data: session, error: sessionError } = await supabase
    .from('tarot_sessions')
    .select('id, code')
    .eq('id', sessionId)
    .eq('code', code.toUpperCase())
    .single();

  if (sessionError || !session) {
    return res.status(404).json({ error: '占卜会话不存在或无权访问' });
  }

  // 更新解析结果
  const { error: updateError } = await supabase
    .from('tarot_sessions')
    .update({
      ai_reading: reading,
      status: 'completed'
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('保存解析失败:', updateError);
    throw new Error('保存解析失败');
  }

  return res.status(200).json({
    success: true,
    message: '解析结果已保存'
  });
}

/**
 * 添加追问
 */
async function handleFollowup(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

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
}

/**
 * 保存天使祝福
 */
async function handleAngel(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { sessionId, code, card, text } = req.body;

  // 验证输入
  if (!sessionId) {
    return res.status(400).json({ error: '请提供占卜会话 ID' });
  }

  if (!code) {
    return res.status(400).json({ error: '请提供兑换码' });
  }

  if (!card) {
    return res.status(400).json({ error: '请提供天使祝福卡' });
  }

  // 验证会话和兑换码
  const { data: session, error: sessionError } = await supabase
    .from('tarot_sessions')
    .select('id, code, angel_blessing_card')
    .eq('id', sessionId)
    .eq('code', code.toUpperCase())
    .single();

  if (sessionError || !session) {
    return res.status(404).json({ error: '占卜会话不存在或无权访问' });
  }

  // 检查是否已有天使祝福
  if (session.angel_blessing_card) {
    return res.status(400).json({ error: '已有天使祝福，不能重复添加' });
  }

  // 保存天使祝福
  const { error: updateError } = await supabase
    .from('tarot_sessions')
    .update({
      angel_blessing_card: card,
      angel_blessing_text: text || null
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('保存天使祝福失败:', updateError);
    throw new Error('保存天使祝福失败');
  }

  return res.status(200).json({
    success: true,
    message: '天使祝福已保存'
  });
}

/**
 * 获取历史记录
 */
async function handleHistory(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '仅支持 GET 请求' });
  }

  const { code } = req.query;

  // 验证输入
  if (!code) {
    return res.status(400).json({ error: '请提供兑换码' });
  }

  // 获取占卜记录（按创建时间倒序，最新的在前）
  const { data: sessions, error: sessionsError } = await supabase
    .from('tarot_sessions')
    .select(`
      id,
      question,
      cards,
      ai_reading,
      angel_blessing_card,
      angel_blessing_text,
      status,
      created_at,
      expires_at
    `)
    .eq('code', code.toUpperCase())
    .order('created_at', { ascending: false });

  if (sessionsError) {
    console.error('查询占卜记录失败:', sessionsError);
    throw new Error('查询占卜记录失败');
  }

  // 为每个 session 获取追问记录
  const sessionsWithFollowups = await Promise.all(
    sessions.map(async (session) => {
      const { data: followups, error: followupsError } = await supabase
        .from('tarot_followups')
        .select('id, followup_question, card, ai_reading, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (followupsError) {
        console.error('查询追问记录失败:', followupsError);
        return { ...session, followups: [] };
      }

      return { ...session, followups };
    })
  );

  return res.status(200).json({
    success: true,
    total: sessionsWithFollowups.length,
    sessions: sessionsWithFollowups
  });
}
