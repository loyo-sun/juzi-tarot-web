/**
 * 兑换码列表 API
 * GET /api/admin/codes
 * 
 * 功能：分页查询兑换码，支持筛选和搜索
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
      status = '',       // active, expired, disabled 或空（全部）
      search = '',       // 搜索兑换码或备注
      sortBy = 'created_at',  // created_at, code, question_used
      sortOrder = 'desc'      // asc, desc
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
      .from('redemption_codes')
      .select('*', { count: 'exact' });

    // 状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    // 搜索
    if (search) {
      query = query.or(`code.ilike.%${search}%,note.ilike.%${search}%`);
    }

    // 排序
    const validSortFields = ['created_at', 'code', 'question_used', 'last_used_at'];
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
      console.error('查询兑换码失败:', error);
      throw new Error('查询兑换码失败');
    }

    // 计算统计信息
    const totalPages = Math.ceil(count / pageSizeNum);

    return res.status(200).json({
      success: true,
      codes: data.map(code => ({
        id: code.id,
        code: code.code,
        question_limit: code.question_limit,
        question_used: code.question_used,
        question_left: code.question_limit - code.question_used,
        followup_limit_per_question: code.followup_limit_per_question,
        status: code.status,
        expires_at: code.expires_at,
        first_used_at: code.first_used_at,
        last_used_at: code.last_used_at,
        note: code.note,
        created_at: code.created_at
      })),
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: count,
        totalPages,
        hasMore: pageNum < totalPages
      }
    });

  } catch (error) {
    console.error('获取兑换码列表失败:', error);
    
    const statusCode = error.message.includes('权限') || error.message.includes('认证')
      ? 401
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '获取兑换码列表失败'
    });
  }
}
