/**
 * 管理员表诊断 API
 * GET /api/debug-admin?email=xxx
 * 
 * 用于检查管理员账号是否存在
 */

import { supabaseAdmin } from '../lib/supabase.js';

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
    const { email } = req.query;

    // 1. 检查是否传入邮箱
    if (!email) {
      // 查询所有管理员
      const { data: allAdmins, error: allError } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, name, role, is_active, created_at');

      if (allError) {
        return res.status(500).json({
          success: false,
          error: '查询失败',
          details: allError.message,
          code: allError.code
        });
      }

      return res.status(200).json({
        success: true,
        message: '所有管理员列表',
        total: allAdmins.length,
        admins: allAdmins
      });
    }

    // 2. 查询特定邮箱
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (adminError) {
      if (adminError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '管理员不存在',
          email,
          hint: '请在 Supabase SQL Editor 中运行以下命令：',
          sql: `INSERT INTO admin_users (email, name, role) VALUES ('${email}', '管理员', 'super_admin');`
        });
      }

      return res.status(500).json({
        success: false,
        error: '查询失败',
        details: adminError.message,
        code: adminError.code
      });
    }

    return res.status(200).json({
      success: true,
      message: '找到管理员',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        is_active: admin.is_active,
        created_at: admin.created_at
      }
    });

  } catch (error) {
    console.error('诊断失败:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误',
      message: error.message
    });
  }
}
