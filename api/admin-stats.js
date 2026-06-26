/**
 * 统计数据 API
 * GET /api/admin/stats
 * 
 * 功能：获取管理后台统计数据
 */

import { verifyAdmin } from '../lib/admin-auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

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

    // 计算时间范围
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. 兑换码统计
    const { data: allCodes } = await supabaseAdmin
      .from('redemption_codes')
      .select('status, question_used');

    const codeStats = {
      total: 0,
      active: 0,
      expired: 0,
      disabled: 0,
      total_questions_used: 0
    };

    if (allCodes) {
      codeStats.total = allCodes.length;
      allCodes.forEach(code => {
        codeStats[code.status]++;
        codeStats.total_questions_used += code.question_used || 0;
      });
    }

    // 2. 占卜记录统计
    const { count: totalSessions } = await supabaseAdmin
      .from('tarot_sessions')
      .select('id', { count: 'exact', head: true });

    const { count: todaySessions } = await supabaseAdmin
      .from('tarot_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: weekSessions } = await supabaseAdmin
      .from('tarot_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    const { count: monthSessions } = await supabaseAdmin
      .from('tarot_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    // 3. 追问统计
    const { count: totalFollowups } = await supabaseAdmin
      .from('tarot_followups')
      .select('id', { count: 'exact', head: true });

    // 4. 最近 7 天趋势
    const { data: recentSessions } = await supabaseAdmin
      .from('tarot_sessions')
      .select('created_at')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: true });

    const dailyStats = {};
    if (recentSessions) {
      recentSessions.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      });
    }

    // 5. 计算比率
    const avgQuestionsPerCode = codeStats.total > 0
      ? (codeStats.total_questions_used / codeStats.total).toFixed(2)
      : '0.00';

    const codeUsageRate = codeStats.total > 0
      ? ((codeStats.active / codeStats.total) * 100).toFixed(1)
      : '0.0';

    const avgFollowupsPerSession = totalSessions > 0
      ? (totalFollowups / totalSessions).toFixed(2)
      : '0.00';

    return res.status(200).json({
      success: true,
      stats: {
        // 兑换码统计
        codes: {
          total: codeStats.total,
          active: codeStats.active,
          expired: codeStats.expired,
          disabled: codeStats.disabled,
          usage_rate: parseFloat(codeUsageRate)
        },
        
        // 占卜统计
        sessions: {
          total: totalSessions || 0,
          today: todaySessions || 0,
          week: weekSessions || 0,
          month: monthSessions || 0
        },
        
        // 追问统计
        followups: {
          total: totalFollowups || 0,
          avg_per_session: parseFloat(avgFollowupsPerSession)
        },
        
        // 使用统计
        usage: {
          total_questions_used: codeStats.total_questions_used,
          avg_per_code: parseFloat(avgQuestionsPerCode)
        },
        
        // 7天趋势
        trends: {
          daily: dailyStats
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    
    const statusCode = error.message.includes('权限') || error.message.includes('认证')
      ? 401
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || '获取统计数据失败'
    });
  }
}
