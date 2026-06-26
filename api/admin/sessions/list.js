/**
 * 占卜记录列表 API
 * GET /api/admin/sessions/list
 * 
 * 功能：分页查询占卜记录，支持筛选
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

    // 获取查询参数
    const {
      page = 1,
      pageSize = 20,
      code = '',         // 按兑换码筛选
      startDate = '',    // 开始日期
      endDate = '',      // 结束日期
      hasAngel = '',     // 是否有天使祝福：'true', 'false' 或空
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    // 验证分页参数
    if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
      return res.status(400).json({
        success: false,
        error: '分页参数无效'
      });
    }

    // 构建查询
    let query = supabaseAdmin
      .from('tarot_sessions')
      .select('*', { count: 'exact' });

    // 兑换码筛选
    if (code) {
      query = query.eq('code', code.toUpperCase());
    }

    // 日期筛选
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateTime.toISOString());
    }

    // 天使祝福筛选
    if (hasAngel === 'true') {
      query = query.not('angel_blessing_card', 'is', null);
    } else if (hasAngel === 'false') {
      query = query.is('angel_blessing_card', null);
    }

    // 排序
    const validSortFields = ['created_at', 'code'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    // 分页
    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;
    query = query.range(from, to);

    // 执行查询
    const { data, error, count } = await query;

    if (error) {
      console.error('查询占卜记录失败:', error);
      throw new Error('查询占卜记录失败');
    }

    // 为每个 session 查询追问数量
    const sessionsWithStats = await Promise.all(
      data.map(async (session) => {
        const { count: followupCount } = await supabaseAdmin
          .from('tarot_followups')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', session.id);

        return {
          id: session.id,
          code: session.code,
          question: session.question,
          question_preview: session.question.length > 50 
            ? session.question.substring(0, 50) + '...'
            : session.question,
          cards_count: session.cards ? session.cards.length : 0,
          has_ai_reading: !!session.ai_reading,
          has_angel_blessing: !!session.angel_blessing_card,
          followups_count: followupCount || 0,
          status: session.status,
          created_at: session.created_at,
          expires_at: session.expires_at
        };
      })
    );

    const totalPages = Math.ceil(count / pageSizeNum);

    return res.status(200).json({
      success: true,
      sessions: sessionsWithStats,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: count,
        totalPages,
        hasMore: pageNum < totalPages
      }
    });

  } catch (error) {
    console.error('获取占卜记录列表失败:', error);
    
    const statusCode = error.message.includes('权限') || error.message.includes('认证')
      ? 401
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '获取占卜记录列表失败'
    });
  }
}
