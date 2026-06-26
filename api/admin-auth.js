/**
 * 管理员认证 API（合并）
 * 
 * Actions:
 * - POST /api/admin-auth?action=login - 管理员登录
 * - GET /api/admin-auth?action=me - 获取管理员信息
 */

import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { verifyAdmin, getAdminPermissions } from '../lib/admin-auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      case 'login':
        return await handleLogin(req, res);
      case 'me':
        return await handleMe(req, res);
      default:
        return res.status(400).json({ 
          success: false,
          error: '无效的 action 参数' 
        });
    }
  } catch (error) {
    console.error('管理员认证 API 错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    });
  }
}

/**
 * 管理员登录
 */
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 POST 请求' 
    });
  }

  const { email, password } = req.body;

  // 验证输入
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '请提供邮箱和密码'
    });
  }

  // 1. 使用 Supabase Auth 验证邮箱密码
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('登录失败:', authError);
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误'
    });
  }

  const { user, session } = authData;

  if (!user || !session) {
    return res.status(401).json({
      success: false,
      error: '登录失败'
    });
  }

  // 2. 检查是否是管理员（使用 service_role 绕过 RLS）
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('email', user.email)
    .eq('is_active', true)
    .single();

  if (adminError || !admin) {
    console.error('非管理员用户尝试登录:', user.email);
    return res.status(403).json({
      success: false,
      error: '无管理员权限'
    });
  }

  // 3. 返回成功响应
  return res.status(200).json({
    success: true,
    message: '登录成功',
    token: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    }
  });
}

/**
 * 获取管理员信息
 */
async function handleMe(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 GET 请求' 
    });
  }

  // 验证管理员身份
  const admin = await verifyAdmin(req);

  // 获取权限列表
  const permissions = getAdminPermissions(admin.role);

  return res.status(200).json({
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    },
    permissions
  });
}
