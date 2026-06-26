/**
 * 测试数据库查询 API
 * GET /api/debug/test-query
 * 
 * 详细测试各种查询方式
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    // 测试 1: 使用 anon key
    try {
      const supabaseAnon = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data, error, count } = await supabaseAnon
        .from('redemption_codes')
        .select('*', { count: 'exact' })
        .like('code', 'JUZI-TEST%');

      results.tests.push({
        name: '测试 1: anon key 查询 LIKE JUZI-TEST%',
        success: !error,
        error: error?.message,
        count: count,
        dataLength: data?.length,
        data: data
      });
    } catch (err) {
      results.tests.push({
        name: '测试 1: anon key 查询',
        success: false,
        error: err.message
      });
    }

    // 测试 2: 使用 service key
    if (process.env.SUPABASE_SERVICE_KEY) {
      try {
        const supabaseService = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        const { data, error, count } = await supabaseService
          .from('redemption_codes')
          .select('*', { count: 'exact' })
          .like('code', 'JUZI-TEST%');

        results.tests.push({
          name: '测试 2: service key 查询 LIKE JUZI-TEST%',
          success: !error,
          error: error?.message,
          count: count,
          dataLength: data?.length,
          data: data
        });
      } catch (err) {
        results.tests.push({
          name: '测试 2: service key 查询',
          success: false,
          error: err.message
        });
      }
    }

    // 测试 3: 查询所有兑换码
    try {
      const supabaseAnon = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data, error, count } = await supabaseAnon
        .from('redemption_codes')
        .select('*', { count: 'exact' });

      results.tests.push({
        name: '测试 3: 查询所有兑换码 (anon key)',
        success: !error,
        error: error?.message,
        count: count,
        dataLength: data?.length,
        codes: data?.map(d => d.code)
      });
    } catch (err) {
      results.tests.push({
        name: '测试 3: 查询所有兑换码',
        success: false,
        error: err.message
      });
    }

    // 测试 4: 使用 IN 查询
    try {
      const supabaseAnon = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabaseAnon
        .from('redemption_codes')
        .select('*')
        .in('code', ['JUZI-TEST-0001', 'JUZI-TEST-0002', 'JUZI-TEST-0003']);

      results.tests.push({
        name: '测试 4: IN 查询 (anon key)',
        success: !error,
        error: error?.message,
        dataLength: data?.length,
        data: data
      });
    } catch (err) {
      results.tests.push({
        name: '测试 4: IN 查询',
        success: false,
        error: err.message
      });
    }

    // 测试 5: 检查 RLS 策略
    try {
      const supabaseAnon = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // 尝试查询单个已知的兑换码
      const { data, error } = await supabaseAnon
        .from('redemption_codes')
        .select('*')
        .eq('code', 'JUZI-TEST-0001')
        .single();

      results.tests.push({
        name: '测试 5: 查询单个兑换码 JUZI-TEST-0001',
        success: !error,
        error: error?.message,
        hint: error?.hint,
        details: error?.details,
        data: data
      });
    } catch (err) {
      results.tests.push({
        name: '测试 5: 查询单个兑换码',
        success: false,
        error: err.message
      });
    }

  } catch (error) {
    results.error = error.message;
    results.stack = error.stack;
  }

  return res.status(200).json(results);
}
