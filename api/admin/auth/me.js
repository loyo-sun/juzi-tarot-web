/**
 * 获取管理员信息 API
 * GET /api/admin/auth/me
 * 
 * 功能：验证 Token 并返回当前管理员信息
 */

import { verifyAdmin, getAdminPermissions } from '../../../lib/admin-auth.js';

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

  } catch (error) {
    console.error('获取管理员信息失败:', error);
    
    const statusCode = error.message.includes('未提供') || error.message.includes('无效') 
      ? 401 
      : 403;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '获取管理员信息失败'
    });
  }
}
