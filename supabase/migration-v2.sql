-- ============================================
-- 橘子塔塔数据库迁移脚本 v2
-- 更新时间：2026-06-26
-- 说明：更新兑换码状态字段，适配新的管理后台需求
-- ============================================

-- 1. 添加激活状态字段
ALTER TABLE redemption_codes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. 添加使用状态字段
ALTER TABLE redemption_codes 
ADD COLUMN IF NOT EXISTS usage_status VARCHAR(20) DEFAULT 'unused';

-- 3. 迁移现有数据：根据旧的 status 字段填充新字段
-- 旧 status: active, expired, disabled
-- 新逻辑：
--   - is_active: active → true, disabled → false, expired → true
--   - usage_status: 根据 question_used 和 question_limit 判断

UPDATE redemption_codes
SET 
  is_active = CASE 
    WHEN status = 'disabled' THEN false
    ELSE true
  END,
  usage_status = CASE
    WHEN question_used = 0 THEN 'unused'
    WHEN question_used >= question_limit THEN 'used'
    ELSE 'in_use'
  END
WHERE usage_status = 'unused'; -- 只更新未设置的记录

-- 4. 添加字段索引
CREATE INDEX IF NOT EXISTS idx_redemption_codes_is_active ON redemption_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_usage_status ON redemption_codes(usage_status);

-- 5. 添加字段注释
COMMENT ON COLUMN redemption_codes.is_active IS '激活状态：true=启用, false=停用';
COMMENT ON COLUMN redemption_codes.usage_status IS '使用状态：unused=未使用, in_use=使用中, used=已使用';

-- 6. 创建触发器：自动更新 usage_status
CREATE OR REPLACE FUNCTION update_usage_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 当 question_used 更新时，自动计算 usage_status
  IF NEW.question_used = 0 THEN
    NEW.usage_status = 'unused';
  ELSIF NEW.question_used >= NEW.question_limit THEN
    NEW.usage_status = 'used';
  ELSE
    NEW.usage_status = 'in_use';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
DROP TRIGGER IF EXISTS auto_update_usage_status ON redemption_codes;
CREATE TRIGGER auto_update_usage_status
  BEFORE INSERT OR UPDATE OF question_used, question_limit ON redemption_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_status();

-- 7. 更新 RLS 策略（如果需要）
-- redemption_codes 表的策略保持不变，因为使用 service_role key 访问

-- ============================================
-- 验证脚本
-- ============================================

-- 查看更新后的数据
SELECT 
  code,
  is_active,
  usage_status,
  question_used,
  question_limit,
  status as old_status,
  created_at
FROM redemption_codes
ORDER BY created_at DESC
LIMIT 10;

-- 查看字段定义
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'redemption_codes' 
  AND column_name IN ('is_active', 'usage_status', 'status')
ORDER BY ordinal_position;

-- ============================================
-- 回滚脚本（如果需要）
-- ============================================

/*
-- 删除新字段
ALTER TABLE redemption_codes DROP COLUMN IF EXISTS is_active;
ALTER TABLE redemption_codes DROP COLUMN IF EXISTS usage_status;

-- 删除触发器
DROP TRIGGER IF EXISTS auto_update_usage_status ON redemption_codes;
DROP FUNCTION IF EXISTS update_usage_status();

-- 删除索引
DROP INDEX IF EXISTS idx_redemption_codes_is_active;
DROP INDEX IF EXISTS idx_redemption_codes_usage_status;
*/
