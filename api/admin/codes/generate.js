/**
 * 生成兑换码 API
 * POST /api/admin/codes/generate
 * 
 * 功能：批量生成兑换码（使用雪花算法）
 */

import { verifyAdmin } from '../../../lib/admin-auth.js';
import { generateUniqueCodes } from '../../../lib/code-generator.js';
import { supabaseAdmin } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: '仅支持 POST 请求' 
    });
  }

  try {
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

  } catch (error) {
    console.error('生成兑换码失败:', error);
    
    const statusCode = error.message.includes('权限') || error.message.includes('认证')
      ? 401
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '生成兑换码失败'
    });
  }
}
