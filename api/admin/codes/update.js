/**
 * 更新兑换码 API
 * PATCH /api/admin/codes/:id
 * 
 * 功能：更新兑换码状态、过期时间、备注
 */

import { verifyAdmin } from '../../../lib/admin-auth.js';
import { supabaseAdmin } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 PATCH 请求' 
    });
  }

  try {
    // 验证管理员权限
    const admin = await verifyAdmin(req);

    // 从 URL 获取 ID（Vercel 路由参数）
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: '缺少兑换码 ID'
      });
    }

    const { status, expires_at, note } = req.body;

    // 验证至少有一个字段需要更新
    if (!status && !expires_at && note === undefined) {
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

  } catch (error) {
    console.error('更新兑换码失败:', error);
    
    const statusCode = error.message.includes('权限') || error.message.includes('认证')
      ? 401
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '更新兑换码失败'
    });
  }
}
