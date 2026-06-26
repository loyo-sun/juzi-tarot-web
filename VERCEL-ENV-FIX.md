# Vercel 环境变量修复说明

## 问题
管理员登录失败，错误信息：
```json
{
  "success": false,
  "error": "无管理员权限"
}
```

实际原因是 Supabase Service Role Key 的环境变量名不正确导致 API 请求失败。

## 根本原因
代码中使用了错误的环境变量名：
- ❌ `SUPABASE_SERVICE_KEY`（旧）
- ✅ `SUPABASE_SERVICE_ROLE_KEY`（正确）

## 修复步骤

### 1. 更新 Vercel 环境变量

请访问 Vercel 项目设置：
1. 打开 https://vercel.com/loyo-sun/juzi-tarot-web/settings/environment-variables
2. 找到 `SUPABASE_SERVICE_KEY` 变量
3. 重命名为 `SUPABASE_SERVICE_ROLE_KEY`（或者新建一个正确名称的变量）
4. 保存后重新部署

### 2. 环境变量清单

确保以下环境变量已正确配置：

```bash
# AI API 配置
AI_API_URL=https://api.openai-hub.com/v1
AI_API_KEY=sk-bAfWBRFG4uwnV3D7tttXxNHWXgMbtX1Kf3tyQeVeoqZnEBgY
AI_MODEL_NAME=deepseek-v4-flash

# Supabase 配置
SUPABASE_URL=https://ejptyknksfmjeplxjqqf.supabase.co/rest/v1/
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 anon key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 service_role key）
```

**重要提示**：
- `SUPABASE_URL` 应该是完整的 URL（包含 `/rest/v1/`）
- `SUPABASE_ANON_KEY` 用于前端功能（有 RLS 限制）
- `SUPABASE_SERVICE_ROLE_KEY` 用于管理后台（绕过 RLS，完全权限）

### 3. 代码已修复

代码已更新为兼容两种环境变量名：
```javascript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
```

这样即使你之前使用了错误的名称，也能继续工作。

## 验证修复

修复后，可以通过以下方式验证：

### 1. 诊断 API
访问：https://juzi.loyo.work/api/debug-admin?email=qsun@vip.qq.com

**期望响应**（找到管理员）：
```json
{
  "success": true,
  "message": "找到管理员",
  "admin": {
    "id": "...",
    "email": "qsun@vip.qq.com",
    "name": "超级管理员",
    "role": "super_admin",
    "is_active": true,
    "created_at": "..."
  }
}
```

**如果返回"管理员不存在"**：
需要在 Supabase SQL Editor 中手动插入管理员记录：
```sql
INSERT INTO admin_users (email, name, role)
VALUES ('qsun@vip.qq.com', '超级管理员', 'super_admin')
ON CONFLICT (email) DO NOTHING;
```

### 2. 登录测试
访问：https://juzi.loyo.work/admin
- 邮箱：qsun@vip.qq.com
- 密码：sunqing1990930

应该能够成功登录到管理后台。

## 检查 Supabase Auth

如果还是无法登录，需要确认 Supabase Auth 中是否已创建该用户：

1. 访问 https://supabase.com/dashboard/project/ejptyknksfmjeplxjqqf/auth/users
2. 查找 `qsun@vip.qq.com` 用户
3. 如果不存在，创建新用户：
   - Email: qsun@vip.qq.com
   - Password: sunqing1990930
   - Auto Confirm: ✅（勾选，跳过邮箱验证）

## 常见问题

### Q: 为什么需要两个表？
A: 
- **Supabase Auth Users** - 存储登录凭证（邮箱、密码哈希）
- **admin_users 表** - 存储管理员权限信息（角色、状态）

### Q: RLS 是什么？
A: Row Level Security（行级安全），Supabase 的权限控制机制。
- `anon` key 受 RLS 限制
- `service_role` key 绕过 RLS（完全权限）

### Q: 为什么管理后台需要 service_role？
A: 管理后台需要：
- 查询所有兑换码（不受限制）
- 查询所有占卜记录（不受限制）
- 生成兑换码、更新状态等管理操作

## 下一步

修复环境变量后：
1. ✅ 重新部署（Vercel 自动触发）
2. ✅ 测试诊断 API
3. ✅ 测试管理员登录
4. ✅ 测试管理后台功能

如有问题，请查看：
- Vercel 部署日志
- 浏览器控制台（F12 -> Console & Network）
- Supabase 项目日志
