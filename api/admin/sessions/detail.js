/**
 * 占卜详情 API
 * GET /api/admin/sessions/detail?id=xxx
 * 
 * 功能：获取单个占卜的完整信息（包含追问）
 */

import { verifyAdmin } from '../../../lib/admin-auth.js';
import { supabaseAdmin } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 GET 请求' 
    });
  }

  try {
    // 验证管理员权限
    await verifyAdmin(req);

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: '缺少占卜记录 ID'
      });
    }

    // 1. 查询占卜记录
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('tarot_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError) {
      console.error('查询占卜记录失败:', sessionError);
      
      if (sessionError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: '占卜记录不存在'
        });
      }
      
      throw new Error('查询占卜记录失败');
    }

    // 2. 查询追问记录
    const { data: followups, error: followupsError } = await supabaseAdmin
      .from('tarot_followups')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (followupsError) {
      console.error('查询追问记录失败:', followupsError);
      throw new Error('查询追问记录失败');
    }

    // 3. 查询兑换码信息
    const { data: codeInfo } = await supabaseAdmin
      .from('redemption_codes')
      .select('code, question_limit, followup_limit_per_question')
      .eq('code', session.code)
      .single();

    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        code: session.code,
        question: session.question,
        spread_type: session.spread_type,
        cards: session.cards,
        ai_reading: session.ai_reading,
        angel_blessing_card: session.angel_blessing_card,
        angel_blessing_text: session.angel_blessing_text,
        status: session.status,
        created_at: session.created_at,
        updated_at: session.updated_at,
        expires_at: session.expires_at,
        
        // 追问记录
        followups: followups.map(f => ({
          id: f.id,
          question: f.followup_question,
          card: f.card,
          ai_reading: f.ai_reading,
          created_at: f.created_at
        })),
        
        // 兑换码信息
        code_info: codeInfo || null,
        
        // 统计
        stats: {
          cards_count: session.cards ? session.cards.length : 0,
          followups_count: followups.length,
          has_ai_reading: !!session.ai_reading,
          has_angel_blessing: !!session.angel_blessing_card
        }
      }
    });

  } catch (error) {
    console.error('获取占卜详情失败:', error);
    
    const statusCode = error.message.includes('权限') || error.message.includes('认证')
      ? 401
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '获取占卜详情失败'
    });
  }
}
