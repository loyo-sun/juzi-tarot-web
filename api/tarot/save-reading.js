/**
 * 保存 AI 解析结果 API
 * POST /api/tarot/save-reading
 * 
 * 功能：保存 AI 对塔罗牌的解析结果
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

  } catch (error) {
    console.error('保存解析失败:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || '保存解析失败'
    });
  }
}
