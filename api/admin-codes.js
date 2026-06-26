/**
 * 管理员兑换码管理 API（合并）
 * 
 * Actions:
 * - POST /api/admin-codes?action=generate - 生成兑换码
 * - GET /api/admin-codes?action=list - 兑换码列表
 * - PATCH /api/admin-codes?action=update&id=xxx - 更新兑换码
 */

import { verifyAdmin } from '../lib/admin-auth.js';
import { generateUniqueCodes } from '../lib/code-generator.js';
import { supabaseAdmin } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const action = req.query.action || req.body?.action;

  if (!action) {
    return res.status(400).json({ 
      success: false,
      error: '请提供 action 参数' 
    });
  }

  try {
    switch (action) {
      case 'generate':
        return await handleGenerate(req, res);
      case 'list':
        return await handleList(req, res);
      case 'update':
        return await handleUpdate(req, res);
      default:
        return res.status(400).json({ 
          success: false,
          error: '无效的 action 参数' 
        });
    }
  } catch (error) {
    console.error('管理员兑换码 API 错误:', error);
    
    const statusCode = error.message.includes('权限') || error.message.includes('认证')
      ? 401
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '服务器错误'
    });
  }
}

/**
 * 生成兑换码
 */
async function handleGenerate(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 POST 请求' 
    });
  }

  // 验证管理员权限
  const admin = await verifyAdmin(req);

  const { 
    count = 1, 
    question_limit = 3, 
    followup_limit_per_question = 3,
    expires_days = 30,
    note = ''
  } = req.body;

  // 验证输入
  if (count < 1 || count > 100) {
    return res.status(400).json({
      success: false,
      error: '生成数量必须在 1-100 之间'
    });
  }

  if (question_limit < 1 || question_limit > 100) {
    return res.status(400).json({
      success: false,
      error: '问题次数必须在 1-100 之间'
    });
  }

  if (followup_limit_per_question < 0 || followup_limit_per_question > 10) {
    return res.status(400).json({
      success: false,
      error: '追问次数必须在 0-10 之间'
    });
  }

  if (expires_days && (expires_days < 1 || expires_days > 365)) {
    return res.status(400).json({
      success: false,
      error: '有效期必须在 1-365 天之间'
    });
  }

  console.log(`管理员 ${admin.email} 正在生成 ${count} 个兑换码...`);

  // 1. 生成唯一的兑换码
  const codes = await generateUniqueCodes(count);

  // 2. 计算过期时间
  const expiresAt = expires_days 
    ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // 3. 批量插入数据库
  const records = codes.map(code => ({
    code,
    question_limit,
    followup_limit_per_question,
    expires_at: expiresAt,
    note: note || `由 ${admin.name || admin.email} 生成`
  }));

  const { data, error } = await supabaseAdmin
    .from('redemption_codes')
    .insert(records)
    .select();

  if (error) {
    console.error('插入兑换码失败:', error);
    throw new Error('保存兑换码失败');
  }

  console.log(`成功生成 ${data.length} 个兑换码`);

  return res.status(200).json({
    success: true,
    message: `成功生成 ${data.length} 个兑换码`,
    count: data.length,
    codes: data.map(record => ({
      code: record.code,
      question_limit: record.question_limit,
      followup_limit_per_question: record.followup_limit_per_question,
      expires_at: record.expires_at,
      created_at: record.created_at
    }))
  });
}

/**
 * 兑换码列表
 */
async function handleList(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 GET 请求' 
    });
  }

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

  // 新增：激活状态筛选
  if (req.query.is_active) {
    query = query.eq('is_active', req.query.is_active === 'true');
  }

  // 新增：使用状态筛选
  if (req.query.usage_status) {
    query = query.eq('usage_status', req.query.usage_status);
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
      is_active: code.is_active,  // 新增
      usage_status: code.usage_status,  // 新增
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
}

/**
 * 更新兑换码
 */
async function handleUpdate(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 PATCH 请求' 
    });
  }

  // 验证管理员权限
  const admin = await verifyAdmin(req);

  // 从 URL 获取 ID
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: '缺少兑换码 ID'
    });
  }

  const { status, expires_at, note } = req.body;

  // 新增：支持更新 is_active
  const { is_active } = req.body;

  // 验证至少有一个字段需要更新
  if (!status && !expires_at && note === undefined && is_active === undefined) {
    return res.status(400).json({
      success: false,
      error: '至少需要提供一个更新字段'
    });
  }

  // 验证状态值
  const validStatuses = ['active', 'expired', 'disabled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `状态必须是：${validStatuses.join(', ')}`
    });
  }

  // 验证过期时间
  if (expires_at) {
    const expiresDate = new Date(expires_at);
    if (isNaN(expiresDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: '过期时间格式无效'
      });
    }
  }

  // 构建更新数据
  const updateData = {};
  if (status) updateData.status = status;
  if (expires_at) updateData.expires_at = expires_at;
  if (note !== undefined) updateData.note = note;
  if (is_active !== undefined) updateData.is_active = is_active;

  // 执行更新
  const { data, error } = await supabaseAdmin
    .from('redemption_codes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新兑换码失败:', error);
    
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: '兑换码不存在'
      });
    }
    
    throw new Error('更新兑换码失败');
  }

  console.log(`管理员 ${admin.email} 更新了兑换码 ${data.code}`);

  return res.status(200).json({
    success: true,
    message: '更新成功',
    code: {
      id: data.id,
      code: data.code,
      question_limit: data.question_limit,
      question_used: data.question_used,
      followup_limit_per_question: data.followup_limit_per_question,
      status: data.status,
      expires_at: data.expires_at,
      note: data.note,
      updated_at: data.updated_at
    }
  });
}
