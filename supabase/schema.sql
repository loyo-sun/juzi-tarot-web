-- 橘子塔罗数据库初始化脚本
-- 创建日期: 2026-06-25
-- 说明: 包含4个核心表 + 索引 + 初始管理员

-- ============================================
-- 1. 兑换码表 (前端唯一认证方式)
-- ============================================
CREATE TABLE IF NOT EXISTS redemption_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  question_limit INTEGER NOT NULL DEFAULT 1,
  question_used INTEGER NOT NULL DEFAULT 0,
  followup_limit_per_question INTEGER NOT NULL DEFAULT 3,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  first_used_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 兑换码表索引
CREATE INDEX idx_redemption_codes_code ON redemption_codes(code);
CREATE INDEX idx_redemption_codes_status ON redemption_codes(status);
CREATE INDEX idx_redemption_codes_created ON redemption_codes(created_at DESC);

-- 兑换码表注释
COMMENT ON TABLE redemption_codes IS '兑换码表，用户唯一认证凭证';
COMMENT ON COLUMN redemption_codes.code IS '兑换码，格式：JUZI-XXXX-XXXX';
COMMENT ON COLUMN redemption_codes.question_limit IS '可用问题次数';
COMMENT ON COLUMN redemption_codes.question_used IS '已用问题次数';
COMMENT ON COLUMN redemption_codes.followup_limit_per_question IS '每题追问次数';
COMMENT ON COLUMN redemption_codes.status IS '状态：active | expired | disabled';

-- ============================================
-- 2. 占卜记录表 (7天自动过期)
-- ============================================
CREATE TABLE IF NOT EXISTS tarot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  spread_type VARCHAR(50) DEFAULT 'three-card',
  cards JSONB NOT NULL,
  ai_reading TEXT,
  angel_blessing_card JSONB,
  angel_blessing_text TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 占卜记录表索引
CREATE INDEX idx_tarot_sessions_code ON tarot_sessions(code);
CREATE INDEX idx_tarot_sessions_expires ON tarot_sessions(expires_at);
CREATE INDEX idx_tarot_sessions_created ON tarot_sessions(created_at DESC);

-- 占卜记录表注释
COMMENT ON TABLE tarot_sessions IS '占卜记录表，7天后自动过期';
COMMENT ON COLUMN tarot_sessions.code IS '兑换码';
COMMENT ON COLUMN tarot_sessions.cards IS '三张牌，JSON格式：[{index, name, reversed, position}]';
COMMENT ON COLUMN tarot_sessions.expires_at IS '过期时间，创建后7天';

-- ============================================
-- 3. 追问记录表 (级联删除)
-- ============================================
CREATE TABLE IF NOT EXISTS tarot_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES tarot_sessions(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  followup_question TEXT NOT NULL,
  card JSONB NOT NULL,
  ai_reading TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 追问记录表索引
CREATE INDEX idx_tarot_followups_session ON tarot_followups(session_id);
CREATE INDEX idx_tarot_followups_code ON tarot_followups(code);
CREATE INDEX idx_tarot_followups_created ON tarot_followups(created_at DESC);

-- 追问记录表注释
COMMENT ON TABLE tarot_followups IS '追问记录表，随占卜记录自动删除';
COMMENT ON COLUMN tarot_followups.card IS '追问牌，JSON格式：{index, name, reversed}';

-- ============================================
-- 4. 管理员表 (后台认证)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(50),
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理员表索引
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- 管理员表注释
COMMENT ON TABLE admin_users IS '管理员表，用于后台认证';
COMMENT ON COLUMN admin_users.email IS '管理员邮箱，需在 Supabase Auth 中创建对应账号';
COMMENT ON COLUMN admin_users.role IS '角色：admin | super_admin';

-- ============================================
-- 5. 自动更新时间戳触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER update_redemption_codes_updated_at
  BEFORE UPDATE ON redemption_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tarot_sessions_updated_at
  BEFORE UPDATE ON tarot_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 定时清理过期记录函数
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 删除过期的占卜记录（追问记录会级联删除）
  DELETE FROM tarot_sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions IS '清理过期的占卜记录，返回删除数量';

-- ============================================
-- 7. 统计数据视图
-- ============================================
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM redemption_codes) AS total_codes,
  (SELECT COUNT(*) FROM redemption_codes WHERE status = 'active') AS active_codes,
  (SELECT COUNT(*) FROM redemption_codes WHERE status = 'expired') AS expired_codes,
  (SELECT COUNT(*) FROM tarot_sessions) AS total_sessions,
  (SELECT COUNT(*) FROM tarot_sessions WHERE created_at >= NOW() - INTERVAL '1 day') AS today_sessions,
  (SELECT COUNT(*) FROM tarot_sessions WHERE created_at >= NOW() - INTERVAL '7 days') AS week_sessions,
  (SELECT COUNT(*) FROM tarot_followups) AS total_followups,
  (SELECT SUM(question_used) FROM redemption_codes) AS total_questions_used;

COMMENT ON VIEW admin_stats IS '管理后台统计数据';

-- ============================================
-- 8. RPC 函数：原子性扣减问题次数
-- ============================================
CREATE OR REPLACE FUNCTION use_question_count(code_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_used INTEGER;
  current_limit INTEGER;
BEGIN
  -- 获取当前次数（加行锁防止并发问题）
  SELECT question_used, question_limit 
  INTO current_used, current_limit
  FROM redemption_codes
  WHERE id = code_id
  FOR UPDATE;
  
  -- 检查是否还有次数
  IF current_used >= current_limit THEN
    RAISE EXCEPTION '兑换码次数已用完';
  END IF;
  
  -- 扣减次数
  UPDATE redemption_codes
  SET 
    question_used = question_used + 1,
    last_used_at = NOW(),
    first_used_at = COALESCE(first_used_at, NOW())
  WHERE id = code_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION use_question_count IS '原子性扣减问题次数，防止并发问题';

-- ============================================
-- 9. 初始化数据
-- ============================================

-- 插入第一个管理员
INSERT INTO admin_users (email, name, role)
VALUES ('qsun@vip.qq.com', '超级管理员', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 插入测试兑换码（可选，用于测试）
INSERT INTO redemption_codes (code, question_limit, followup_limit_per_question, note)
VALUES 
  ('JUZI-TEST-0001', 3, 3, '测试兑换码1'),
  ('JUZI-TEST-0002', 5, 3, '测试兑换码2')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 10. Row Level Security (RLS) 策略
-- ============================================

-- 注意：Supabase 默认启用 RLS，需要创建策略来允许访问

-- redemption_codes 表策略（允许匿名读取和更新）
ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许匿名读取兑换码"
ON redemption_codes
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "允许匿名更新兑换码"
ON redemption_codes
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- tarot_sessions 表策略（允许匿名完全访问）
ALTER TABLE tarot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许匿名操作占卜记录"
ON tarot_sessions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- tarot_followups 表策略（允许匿名完全访问）
ALTER TABLE tarot_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许匿名操作追问记录"
ON tarot_followups
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- admin_users 表策略（仅允许 service_role 访问）
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "仅管理员可读取"
ON admin_users
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

COMMENT ON POLICY "允许匿名读取兑换码" ON redemption_codes IS '前端需要验证兑换码';
COMMENT ON POLICY "允许匿名更新兑换码" ON redemption_codes IS '前端需要扣减次数和更新使用时间';
COMMENT ON POLICY "允许匿名操作占卜记录" ON tarot_sessions IS '前端需要创建和查询占卜记录';
COMMENT ON POLICY "允许匿名操作追问记录" ON tarot_followups IS '前端需要创建追问记录';

-- ============================================
-- 11. 完成提示
-- ============================================
-- ============================================
-- 11. 完成提示
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 橘子塔罗数据库初始化完成！';
  RAISE NOTICE '📊 创建了 4 个表：redemption_codes, tarot_sessions, tarot_followups, admin_users';
  RAISE NOTICE '🔒 已启用 RLS 并配置访问策略';
  RAISE NOTICE '🔑 初始管理员邮箱：qsun@vip.qq.com';
  RAISE NOTICE '⏰ 占卜记录将在 7 天后自动过期';
  RAISE NOTICE '🧹 使用 SELECT cleanup_expired_sessions(); 手动清理过期记录';
  RAISE NOTICE '📈 使用 SELECT * FROM admin_stats; 查看统计数据';
END $$;
