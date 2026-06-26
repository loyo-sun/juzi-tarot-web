# 橘子塔塔部署指南

## 📋 部署前检查清单

### ✅ 已完成
- [x] 前端完整流程
- [x] AI 解析 API
- [x] 6个后端 API（兑换码、占卜、追问、天使祝福、历史记录）
- [x] Supabase 数据库设计
- [x] GitHub 仓库配置

### ⏳ 待完成
- [ ] 安装 npm 依赖
- [ ] 在 Supabase 运行数据库脚本
- [ ] 创建管理员账号
- [ ] 配置环境变量
- [ ] 在 Vercel 配置环境变量
- [ ] 测试完整流程

---

## 🚀 部署步骤

### 步骤 1: 安装依赖

```bash
cd /Users/chingsun/Documents/juzi/juzi-tarot-web
npm install
```

这将安装 `@supabase/supabase-js` 依赖。

---

### 步骤 2: 配置 Supabase 数据库

#### 2.1 进入 Supabase 项目
1. 访问 https://supabase.com/dashboard
2. 进入 `juzitaluo` 项目
3. 点击左侧 **SQL Editor**

#### 2.2 运行数据库脚本
1. 点击 **New Query**
2. 将 `supabase/schema.sql` 的全部内容复制粘贴到编辑器
3. 点击 **Run** 执行

**预期结果:**
```
✅ 橘子塔塔数据库初始化完成！
📊 创建了 4 个表：redemption_codes, tarot_sessions, tarot_followups, admin_users
🔑 初始管理员邮箱：qsun@vip.qq.com
⏰ 占卜记录将在 7 天后自动过期
```

#### 2.3 验证表创建
在 SQL Editor 中运行：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('redemption_codes', 'tarot_sessions', 'tarot_followups', 'admin_users');
```

应该看到 4 个表。

---

### 步骤 3: 创建管理员账号

#### 3.1 在 Supabase Auth 创建用户
1. 在 Supabase 项目中，点击左侧 **Authentication**
2. 点击 **Users** 标签页
3. 点击 **Add User** → **Create new user**
4. 填写信息：
   - Email: `qsun@vip.qq.com`
   - Password: 设置一个强密码（至少8位）
   - Auto Confirm User: **勾选**（跳过邮箱验证）
5. 点击 **Create user**

#### 3.2 验证管理员
在 SQL Editor 中运行：
```sql
SELECT * FROM admin_users WHERE email = 'qsun@vip.qq.com';
```

应该看到一条记录（数据库脚本已自动创建）。

---

### 步骤 4: 获取 Supabase API 密钥

#### 4.1 获取项目 URL
1. 在 Supabase 项目中，点击左侧 **Settings** → **API**
2. 复制 **Project URL**
   - 格式: `https://xxxxxxxxx.supabase.co`

#### 4.2 获取 API Keys
在同一页面复制以下两个 Key：
- **anon / public key** - 用于前端功能
- **service_role key** - 用于管理后台（⚠️ 保密，不要泄露）

---

### 步骤 5: 配置本地环境变量

#### 5.1 创建 .env 文件
在项目根目录创建 `.env` 文件：

```bash
# AI API 配置（已配置）
AI_API_KEY=你的AI密钥
AI_API_BASE_URL=你的AI服务地址
AI_MODEL=你的模型名称

# Supabase 配置（需要填写）
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_KEY=你的_service_role_key
```

#### 5.2 测试本地运行
```bash
npm run dev
```

访问 `http://localhost:3000`，测试占卜流程。

---

### 步骤 6: 在 Vercel 配置环境变量

#### 6.1 进入 Vercel 项目设置
1. 访问 https://vercel.com/dashboard
2. 进入 `juzi-tarot-web` 项目
3. 点击 **Settings** → **Environment Variables**

#### 6.2 添加环境变量
添加以下 6 个环境变量（所有环境都选择：Production, Preview, Development）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `AI_API_KEY` | 你的AI密钥 | AI API 密钥 |
| `AI_API_BASE_URL` | 你的AI服务地址 | AI API 基础 URL |
| `AI_MODEL` | 你的模型名称 | AI 模型名称 |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | eyJhbGc... | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | eyJhbGc... | Supabase service key ⚠️ |

#### 6.3 重新部署
环境变量配置后，需要重新部署：
1. 在 Vercel 项目页面点击 **Deployments**
2. 找到最新的部署，点击右侧 **...** → **Redeploy**
3. 勾选 **Use existing Build Cache**
4. 点击 **Redeploy**

---

## 🧪 测试流程

### 测试 1: 兑换码验证

1. 访问部署后的网站
2. 输入测试兑换码：`JUZI-TEST-0001`
3. 应该显示：**兑换码有效，还可提问 3 次**

### 测试 2: 完整占卜流程

1. **输入兑换码**: `JUZI-TEST-0001`
2. **输入问题**: "我的事业发展方向是什么？"
3. **洗牌和切牌**: 观察动画效果
4. **抽取3张牌**: 点击任意3张牌
5. **查看解析**: 等待 AI 解析结果
6. **追问**: 输入追问内容，点击"追问"
7. **天使祝福**: 点击"请橘子抽天使祝福"

### 测试 3: 次数扣减

1. 完成一次占卜后，查看右上角次数显示
2. 应该从 3 变为 2
3. 重新开始占卜，验证次数继续扣减

### 测试 4: 追问限制

1. 在一个占卜中，连续追问 3 次
2. 第 4 次追问应该被禁用
3. 提示: "每题最多追问 3 次"

### 测试 5: 历史记录 API

使用浏览器或 curl 测试历史记录 API：

```bash
curl "https://你的域名/api/tarot/history?code=JUZI-TEST-0001"
```

应该返回该兑换码的所有占卜记录（JSON 格式）。

---

## 🔍 数据验证

### 验证兑换码状态
在 Supabase SQL Editor 中运行：
```sql
SELECT code, question_limit, question_used, first_used_at, last_used_at 
FROM redemption_codes 
WHERE code = 'JUZI-TEST-0001';
```

### 验证占卜记录
```sql
SELECT id, question, created_at, expires_at 
FROM tarot_sessions 
WHERE code = 'JUZI-TEST-0001'
ORDER BY created_at DESC;
```

### 验证追问记录
```sql
SELECT tf.followup_question, ts.question as main_question, tf.created_at
FROM tarot_followups tf
JOIN tarot_sessions ts ON tf.session_id = ts.id
WHERE tf.code = 'JUZI-TEST-0001'
ORDER BY tf.created_at DESC;
```

### 查看统计数据
```sql
SELECT * FROM admin_stats;
```

---

## 🐛 故障排查

### 问题 1: "无效的兑换码"

**可能原因:**
- Supabase 数据库脚本未运行
- 测试兑换码未插入

**解决方法:**
```sql
-- 手动插入测试兑换码
INSERT INTO redemption_codes (code, question_limit, followup_limit_per_question, note)
VALUES ('JUZI-TEST-0001', 3, 3, '测试兑换码1')
ON CONFLICT (code) DO NOTHING;
```

### 问题 2: "创建占卜会话失败"

**可能原因:**
- 环境变量未配置
- Supabase API Key 错误

**解决方法:**
1. 检查 Vercel 环境变量是否正确
2. 在 Vercel 的 **Deployments** 中查看日志
3. 确认 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 正确

### 问题 3: "解析请求失败"

**可能原因:**
- AI API 配置错误
- AI API 额度用完

**解决方法:**
1. 检查 `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL` 环境变量
2. 测试 AI API 是否可用：
```bash
curl -X POST https://你的AI服务地址/chat/completions \
  -H "Authorization: Bearer 你的AI密钥" \
  -H "Content-Type: application/json" \
  -d '{"model":"你的模型","messages":[{"role":"user","content":"test"}]}'
```

### 问题 4: 500 Internal Server Error

**查看错误日志:**
1. 在 Vercel 项目中点击 **Functions**
2. 找到报错的 API 函数（如 `/api/tarot/start`）
3. 查看 **Logs** 中的详细错误信息

---

## 📊 监控和维护

### 定期清理过期记录

在 Supabase SQL Editor 中运行：
```sql
SELECT cleanup_expired_sessions();
```

建议设置 **pg_cron** 定时任务（每天凌晨2点）：
```sql
-- 需要 pg_cron 扩展（Supabase Pro 计划支持）
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 2 * * *',
  'SELECT cleanup_expired_sessions()'
);
```

### 监控占卜记录数量
```sql
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as today,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week
FROM tarot_sessions;
```

### 监控兑换码使用情况
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(question_used) as total_used
FROM redemption_codes
GROUP BY status;
```

---

## 🎯 下一步：管理后台

当前已完成前端用户占卜功能（66% 进度），下一步将开发管理后台：

1. 管理员登录界面
2. 兑换码生成功能
3. 兑换码管理（列表、禁用、备注）
4. 占卜记录查看
5. 数据统计看板

详见 `BACKEND-PLAN.md` 中的 **阶段 3：管理后台**。

---

## 📞 技术支持

遇到问题？检查以下资源：

1. **Supabase 文档**: https://supabase.com/docs
2. **Vercel 文档**: https://vercel.com/docs
3. **项目文档**:
   - `BACKEND-PLAN.md` - 后端开发计划
   - `CHANGES.md` - 开发进度和更新日志
   - `README.md` - 项目概述

---

最后更新：2026-06-26
