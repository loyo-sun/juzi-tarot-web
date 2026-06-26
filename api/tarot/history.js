/**
 * 获取占卜历史 API
 * GET /api/tarot/history?code=JUZI-XXXX-XXXX
 * 
 * 功能：获取指定兑换码的所有占卜记录（7天内）
 */

import { supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '仅支持 GET 请求' });
  }

  try {
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

  } catch (error) {
    console.error('获取历史记录失败:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || '获取历史记录失败'
    });
  }
}
