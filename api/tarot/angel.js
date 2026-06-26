/**
 * 保存天使祝福 API
 * POST /api/tarot/angel
 * 
 * 功能：为占卜添加天使祝福卡（不扣次数）
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

  } catch (error) {
    console.error('保存天使祝福失败:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || '保存天使祝福失败'
    });
  }
}
