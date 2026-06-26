/**
 * 统计数据 API
 * GET /api/admin/stats
 * 
 * 功能：获取管理后台统计数据
 */

import { verifyAdmin } from '../../lib/admin-auth.js';
import { supabaseAdmin } from '../../lib/supabase.js';

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

    // 1. 使用视图获取基础统计
    const { data: baseStats, error: statsError } = await supabaseAdmin
      .from('admin_stats')
      .select('*')
      .single();

    if (statsError) {
      console.error('查询统计视图失败:', statsError);
      throw new Error('查询统计数据失败');
    }

    // 2. 额外查询：本月统计
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: monthSessions } = await supabaseAdmin
      .from('tarot_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    // 3. 额外查询：按状态分组的兑换码
    const { data: codesByStatus } = await supabaseAdmin
      .from('redemption_codes')
      .select('status');

    const statusCounts = {
      active: 0,
      expired: 0,
      disabled: 0
    };

    if (codesByStatus) {
      codesByStatus.forEach(code => {
        if (statusCounts[code.status] !== undefined) {
          statusCounts[code.status]++;
        }
      });
    }

    // 4. 额外查询：最近 7 天的占卜趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSessions } = await supabaseAdmin
      .from('tarot_sessions')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // 按日期分组
    const dailyStats = {};
    if (recentSessions) {
      recentSessions.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      });
    }

    // 5. 计算平均值和使用率
    const avgQuestionsPerCode = baseStats.total_codes > 0
      ? (baseStats.total_questions_used / baseStats.total_codes).toFixed(2)
      : 0;

    const codeUsageRate = baseStats.total_codes > 0
      ? ((statusCounts.active / baseStats.total_codes) * 100).toFixed(1)
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        // 兑换码统计
        codes: {
          total: baseStats.total_codes || 0,
          active: statusCounts.active,
          expired: statusCounts.expired,
          disabled: statusCounts.disabled,
          usage_rate: parseFloat(codeUsageRate)
        },
        
        // 占卜统计
        sessions: {
          total: baseStats.total_sessions || 0,
          today: baseStats.today_sessions || 0,
          week: baseStats.week_sessions || 0,
          month: monthSessions || 0
        },
        
        // 追问统计
        followups: {
          total: baseStats.total_followups || 0,
          avg_per_session: baseStats.total_sessions > 0
            ? (baseStats.total_followups / baseStats.total_sessions).toFixed(2)
            : 0
        },
        
        // 使用统计
        usage: {
          total_questions_used: baseStats.total_questions_used || 0,
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
