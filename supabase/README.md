# Supabase 数据库配置指南

## 📋 快速开始

### 1. 创建 Supabase 项目

访问 [supabase.com](https://supabase.com) 并登录：

1. 点击 "New Project"
2. 选择组织（或创建新组织）
3. 填写项目信息：
   - **Name**: `juzi-tarot` 或你喜欢的名字
   - **Database Password**: 设置一个强密码（记住它！）
   - **Region**: 选择 `Northeast Asia (Seoul)` 或最近的区域
   - **Pricing Plan**: Free（免费版）
4. 点击 "Create new project"
5. 等待 2-3 分钟，项目创建完成

---

### 2. 配置 Email Auth

在项目创建完成后：

1. 左侧菜单点击 **Authentication** → **Providers**
2. 找到 **Email**，点击编辑
3. 确保以下设置：
   - ✅ **Enable Email provider** - 已启用
   - ✅ **Enable Email Confirmations** - 禁用（方便测试）
   - ✅ **Enable Email OTP** - 可选
4. 点击 **Save**

---

### 3. 运行数据库脚本

1. 左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 复制 `schema.sql` 的全部内容
4. 粘贴到编辑器
5. 点击 **Run** 按钮（或按 Cmd+Enter）
6. 等待执行完成，看到成功提示：
   ```
   ✅ 橘子塔罗数据库初始化完成！
   📊 创建了 4 个表
   🔑 初始管理员邮箱：qsun@vip.qq.com
   ```

---

### 4. 创建管理员账号

在 Supabase Dashboard 中：

1. 左侧菜单点击 **Authentication** → **Users**
2. 点击 **Add user** → **Create new user**
3. 填写信息：
   - **Email**: `qsun@vip.qq.com`
   - **Password**: 设置管理员密码（至少6位）
   - **Auto Confirm User**: ✅ 勾选
4. 点击 **Create user**

现在这个邮箱既是 Auth 用户，也在 admin_users 表中，可以登录管理后台。

---

### 5. 获取 API 凭证

1. 左侧菜单点击 **Project Settings** (齿轮图标)
2. 点击 **API** 标签
3. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: 用于前端
   - **service_role** key: 用于后端（敏感！）

---

### 6. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# AI API 配置
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=your-openai-api-key
AI_MODEL_NAME=gpt-4o-mini

# Supabase 配置
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

⚠️ **注意**：
- `SUPABASE_ANON_KEY` 用于前端和占卜 API
- `SUPABASE_SERVICE_KEY` 仅用于管理后台 API（敏感！）

---

## 📊 验证安装

### 检查表是否创建成功

在 SQL Editor 中运行：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 应该看到：
-- redemption_codes
-- tarot_sessions
-- tarot_followups
-- admin_users
```

### 检查管理员是否创建

```sql
SELECT * FROM admin_users;

-- 应该看到：qsun@vip.qq.com
```

### 检查测试兑换码

```sql
SELECT code, question_limit, followup_limit_per_question, status 
FROM redemption_codes;

-- 应该看到两个测试兑换码
```

### 查看统计数据

```sql
SELECT * FROM admin_stats;

-- 会显示所有统计信息
```

---

## 🧹 定期维护

### 手动清理过期记录

在 SQL Editor 中运行：

```sql
SELECT cleanup_expired_sessions();

-- 返回删除的记录数量
```

### 设置自动清理（可选）

使用 Supabase Edge Functions 或 pg_cron 扩展：

```sql
-- 安装 pg_cron（需要在 Database 设置中启用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天凌晨 2 点清理
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 2 * * *',
  'SELECT cleanup_expired_sessions();'
);
```

---

## 🔐 安全配置

### Row Level Security (RLS)

目前表没有启用 RLS，因为：
- **前端**：通过 API 验证兑换码，不直接访问数据库
- **管理后台**：使用 service_role key，绕过 RLS

如果需要更高安全性，可以启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE tarot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_followups ENABLE ROW LEVEL SECURITY;

-- 创建策略（示例）
CREATE POLICY "Sessions accessible by code"
  ON tarot_sessions FOR SELECT
  USING (code = current_setting('app.current_code', true));
```

---

## 📈 监控和调试

### 查看最近的占卜记录

```sql
SELECT 
  code,
  question,
  created_at,
  expires_at
FROM tarot_sessions
ORDER BY created_at DESC
LIMIT 10;
```

### 查看兑换码使用情况

```sql
SELECT 
  code,
  question_limit,
  question_used,
  status,
  first_used_at,
  last_used_at
FROM redemption_codes
ORDER BY last_used_at DESC NULLS LAST;
```

### 查看追问统计

```sql
SELECT 
  s.code,
  s.question,
  COUNT(f.id) as followup_count
FROM tarot_sessions s
LEFT JOIN tarot_followups f ON s.id = f.session_id
GROUP BY s.id, s.code, s.question
HAVING COUNT(f.id) > 0
ORDER BY followup_count DESC;
```

---

## 🆘 常见问题

### Q: 执行 schema.sql 报错？
**A**: 检查是否在正确的数据库上执行，确认没有权限问题。

### Q: 管理员登录失败？
**A**: 确认邮箱在两个地方都存在：
1. Authentication → Users 中
2. admin_users 表中

### Q: 测试兑换码在哪里？
**A**: schema.sql 自动创建了两个测试码：
- `JUZI-TEST-0001` (3个问题，每题3次追问)
- `JUZI-TEST-0002` (5个问题，每题3次追问)

### Q: 如何批量生成兑换码？
**A**: 等待管理后台 API 完成，或手动执行：

```sql
-- 生成10个兑换码
INSERT INTO redemption_codes (code, question_limit, followup_limit_per_question)
SELECT 
  'JUZI-' || UPPER(substring(md5(random()::text) from 1 for 4)) || 
  '-' || UPPER(substring(md5(random()::text) from 1 for 4)),
  3,
  3
FROM generate_series(1, 10);
```

---

## ✅ 下一步

数据库配置完成后，你可以：

1. ✅ 复制 API 凭证到 `.env`
2. ✅ 开始开发 API 端点
3. ✅ 使用测试兑换码测试前端
4. ✅ 开发管理后台登录

祝你开发顺利！🚀
