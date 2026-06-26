/**
 * 管理员认证中间件
 * 用于验证管理员 Token 和权限
 */

import { supabase, supabaseAdmin } from './supabase.js';

/**
 * 验证管理员身份
 * @param {Request} req - HTTP 请求对象
 * @returns {Promise<Object>} 管理员信息
 * @throws {Error} 认证失败时抛出错误
 */
export async function verifyAdmin(req) {
  // 1. 获取 Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader) {
    throw new Error('未提供认证令牌');
  }

  // 2. 提取 Token
  const token = authHeader.replace('Bearer ', '').trim();
  
  if (!token) {
    throw new Error('认证令牌格式错误');
  }

  // 3. 验证 Supabase Token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    throw new Error('认证令牌无效或已过期');
  }

  // 4. 检查是否是管理员（使用 service_role 绕过 RLS）
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('email', user.email)
    .eq('is_active', true)
    .single();

  if (adminError || !admin) {
    throw new Error('无管理员权限');
  }

  // 5. 返回管理员信息
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    userId: user.id
  };
}

/**
 * 获取管理员权限列表
 * @param {string} role - 管理员角色
 * @returns {Array<string>} 权限列表
 */
export function getAdminPermissions(role) {
  const permissions = {
    super_admin: [
      'manage_codes',      // 生成、管理兑换码
      'view_codes',        // 查看兑换码
      'view_sessions',     // 查看占卜记录
      'view_stats',        // 查看统计数据
      'manage_admins'      // 管理管理员（仅超级管理员）
    ],
    admin: [
      'manage_codes',
      'view_codes',
      'view_sessions',
      'view_stats'
    ]
  };

  return permissions[role] || [];
}
