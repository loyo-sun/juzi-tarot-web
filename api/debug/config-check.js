/**
 * 配置检查 API
 * GET /api/debug/config-check
 * 
 * 用于诊断环境变量和数据库连接
 */

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

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    },
    supabase: {
      url: process.env.SUPABASE_URL ? '✓ 已配置' : '✗ 未配置',
      url_preview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'N/A',
      anon_key: process.env.SUPABASE_ANON_KEY ? '✓ 已配置' : '✗ 未配置',
      anon_key_preview: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'N/A',
      service_key: process.env.SUPABASE_SERVICE_KEY ? '✓ 已配置' : '✗ 未配置',
      service_key_preview: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'N/A',
    },
    ai: {
      api_key: process.env.AI_API_KEY ? '✓ 已配置' : '✗ 未配置',
      api_base_url: process.env.AI_API_BASE_URL ? '✓ 已配置' : '✗ 未配置',
      model: process.env.AI_MODEL || '✗ 未配置',
    }
  };

  // 尝试连接 Supabase
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // 测试数据库连接
      const { data, error } = await supabase
        .from('redemption_codes')
        .select('count', { count: 'exact', head: true });

      if (error) {
        diagnostics.database_connection = {
          status: '✗ 连接失败',
          error: error.message,
          details: error.details || 'N/A',
          hint: error.hint || 'N/A'
        };
      } else {
        diagnostics.database_connection = {
          status: '✓ 连接成功',
          message: 'Supabase 数据库连接正常'
        };
      }
    } else {
      diagnostics.database_connection = {
        status: '✗ 无法测试',
        error: '缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY'
      };
    }
  } catch (error) {
    diagnostics.database_connection = {
      status: '✗ 测试失败',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    };
  }

  // 检查测试兑换码
  try {
    if (diagnostics.database_connection.status === '✓ 连接成功') {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data: testCodes, error } = await supabase
        .from('redemption_codes')
        .select('code, question_limit, question_used, status')
        .in('code', ['JUZI-TEST-0001', 'JUZI-TEST-0002']);

      if (error) {
        diagnostics.test_codes = {
          status: '✗ 查询失败',
          error: error.message
        };
      } else {
        diagnostics.test_codes = {
          status: '✓ 查询成功',
          found: testCodes.length,
          codes: testCodes
        };
      }
    }
  } catch (error) {
    diagnostics.test_codes = {
      status: '✗ 测试失败',
      error: error.message
    };
  }

  return res.status(200).json({
    success: true,
    message: '诊断完成',
    diagnostics
  });
}
