# 🔧 故障排查指南

## 🎯 快速诊断

### 步骤 1: 访问诊断页面

部署后，访问：
```
https://你的域名.vercel.app/debug.html
```

这个页面会自动检查：
- ✅ 环境变量配置
- ✅ Supabase 连接
- ✅ 数据库表是否存在
- ✅ 测试兑换码是否可用
- ✅ API 是否正常工作

### 步骤 2: 查看诊断结果

根据诊断结果，找到对应的解决方案。

---

## 🚨 常见问题和解决方案

### 问题 1: 环境变量未配置

**症状:**
- 诊断页面显示 `✗ 未配置`
- API 返回 `缺少环境变量 SUPABASE_URL`

**原因:**
Vercel 环境变量未正确设置

**解决方法:**

1. 登录 Vercel Dashboard: https://vercel.com/dashboard
2. 进入你的项目 `juzi-tarot-web`
3. 点击 **Settings** → **Environment Variables**
4. 确认以下变量都已添加（注意大小写）：

| 变量名 | 值从哪里获取 |
|--------|-------------|
| `SUPABASE_URL` | Supabase 项目 Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase 项目 Settings → API → anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase 项目 Settings → API → service_role key |
| `AI_API_KEY` | 你的 AI API 密钥 |
| `AI_API_BASE_URL` | 你的 AI API 地址 |
| `AI_MODEL` | 你的 AI 模型名称 |

5. **重要**: 每个变量都要勾选 **Production**, **Preview**, **Development**
6. 添加完成后，点击 **Deployments**，找到最新部署，点击 **...** → **Redeploy**

---

### 问题 2: 数据库连接失败

**症状:**
- 诊断页面显示 `✗ 连接失败`
- 错误信息: `relation "redemption_codes" does not exist`

**原因:**
数据库表未创建

**解决方法:**

1. 访问 Supabase Dashboard: https://supabase.com/dashboard
2. 进入 `juzitaluo` 项目
3. 点击左侧 **SQL Editor**
4. 点击 **New Query**
5. 打开本地文件 `supabase/schema.sql`，复制全部内容
6. 粘贴到 SQL Editor
7. 点击 **Run** 按钮（或按 Ctrl+Enter）
8. 等待执行完成，应该看到成功提示

**验证表是否创建成功:**
在 SQL Editor 中运行：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('redemption_codes', 'tarot_sessions', 'tarot_followups', 'admin_users');
```

应该返回 4 行数据。

---

### 问题 3: API Key 错误

**症状:**
- 诊断页面显示 `✓ 已配置`，但连接失败
- 错误信息: `Invalid API key` 或 `Unauthorized`

**原因:**
复制的 API Key 不正确或有多余的空格

**解决方法:**

1. 重新获取 Supabase API Keys：
   - 访问 Supabase → Settings → API
   - 点击 **anon key** 右侧的复制按钮（确保复制完整）
   - 点击 **service_role key** 右侧的复制按钮

2. 更新 Vercel 环境变量：
   - 删除旧的 `SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_KEY`
   - 重新添加，确保没有前后空格
   - 重新部署

---

### 问题 4: 测试兑换码不存在

**症状:**
- 诊断页面显示找到 0 个测试兑换码
- 测试验证 API 返回 `无效的兑换码`

**原因:**
数据库脚本中的测试兑换码未插入成功

**解决方法:**

在 Supabase SQL Editor 中手动插入：
```sql
INSERT INTO redemption_codes (code, question_limit, followup_limit_per_question, note)
VALUES 
  ('JUZI-TEST-0001', 3, 3, '测试兑换码1'),
  ('JUZI-TEST-0002', 5, 3, '测试兑换码2')
ON CONFLICT (code) DO NOTHING;
```

验证插入成功：
```sql
SELECT code, question_limit, question_used, status 
FROM redemption_codes 
WHERE code LIKE 'JUZI-TEST%';
```

---

### 问题 5: @supabase/supabase-js 未安装

**症状:**
- API 返回 500 错误
- Vercel Function Logs 显示 `Cannot find module '@supabase/supabase-js'`

**原因:**
依赖未正确安装或未提交到 Git

**解决方法:**

1. 在本地项目目录运行：
```bash
cd /Users/chingsun/Documents/juzi/juzi-tarot-web
npm install
```

2. 确认 `package.json` 包含：
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

3. 提交并推送：
```bash
git add package.json package-lock.json
git commit -m "确保 Supabase 依赖已安装"
git push
```

4. Vercel 会自动重新部署

---

### 问题 6: CORS 错误

**症状:**
- 浏览器控制台显示 `Access-Control-Allow-Origin` 错误
- API 调用失败

**原因:**
CORS 配置问题（不太可能，因为已经配置了）

**解决方法:**

检查 `vercel.json` 是否存在并包含：
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

---

### 问题 7: 兑换码验证成功，但开始占卜失败

**症状:**
- `/api/codes/verify` 返回成功
- `/api/tarot/start` 返回错误

**可能原因和解决方法:**

#### 原因 A: RPC 函数未创建
在 Supabase SQL Editor 中运行：
```sql
-- 检查函数是否存在
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'use_question_count';
```

如果没有结果，重新运行 `supabase/schema.sql` 中的 RPC 函数部分。

#### 原因 B: 次数已用完
检查兑换码状态：
```sql
SELECT code, question_limit, question_used 
FROM redemption_codes 
WHERE code = 'JUZI-TEST-0001';
```

如果 `question_used >= question_limit`，重置次数：
```sql
UPDATE redemption_codes 
SET question_used = 0 
WHERE code = 'JUZI-TEST-0001';
```

---

## 🔍 高级诊断

### 查看 Vercel Function Logs

1. 访问 Vercel Dashboard
2. 进入项目 → **Functions**
3. 点击有问题的函数（如 `/api/tarot/start`）
4. 查看 **Logs** 标签页
5. 查找错误信息

### 查看 Supabase Logs

1. 访问 Supabase Dashboard
2. 进入项目 → **Logs**
3. 选择 **API** 或 **Database**
4. 查看最近的错误

### 测试 API 直接调用

使用 curl 测试：
```bash
# 测试配置检查
curl https://你的域名.vercel.app/api/debug/config-check

# 测试兑换码验证
curl -X POST https://你的域名.vercel.app/api/codes/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"JUZI-TEST-0001"}'

# 测试开始占卜
curl -X POST https://你的域名.vercel.app/api/tarot/start \
  -H "Content-Type: application/json" \
  -d '{
    "code": "JUZI-TEST-0001",
    "question": "测试问题",
    "cards": [
      {"index": 1, "name": "魔术师", "reversed": false, "position": "过去"},
      {"index": 2, "name": "女祭司", "reversed": false, "position": "现在"},
      {"index": 3, "name": "女皇", "reversed": false, "position": "未来"}
    ]
  }'
```

---

## 📋 完整检查清单

逐项检查以下内容：

### Supabase 配置
- [ ] 项目已创建（名称：juzitaluo）
- [ ] 数据库脚本已运行（`supabase/schema.sql`）
- [ ] 4个表已创建（redemption_codes, tarot_sessions, tarot_followups, admin_users）
- [ ] 测试兑换码已插入（JUZI-TEST-0001, JUZI-TEST-0002）
- [ ] 管理员账号已创建（qsun@vip.qq.com）

### Vercel 配置
- [ ] 项目已部署
- [ ] 6个环境变量已添加：
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_KEY
  - [ ] AI_API_KEY
  - [ ] AI_API_BASE_URL
  - [ ] AI_MODEL
- [ ] 环境变量已勾选所有环境（Production, Preview, Development）
- [ ] 添加变量后已重新部署

### 代码和依赖
- [ ] `npm install` 已运行
- [ ] `package.json` 包含 `@supabase/supabase-js`
- [ ] `package-lock.json` 已提交到 Git
- [ ] 代码已推送到 GitHub

### 测试
- [ ] 诊断页面可以访问（/debug.html）
- [ ] 所有诊断项显示 ✓
- [ ] 测试兑换码验证成功
- [ ] 测试开始占卜成功

---

## 💬 需要提供的信息

如果以上都无法解决问题，请提供以下信息：

1. **诊断页面截图**: 访问 `/debug.html` 的完整截图
2. **Vercel Function Logs**: 
   - 进入 Vercel → Functions → 点击出错的 API
   - 复制最近的错误日志
3. **Supabase SQL 查询结果**:
   ```sql
   -- 表是否存在
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- 测试兑换码
   SELECT * FROM redemption_codes WHERE code LIKE 'JUZI-TEST%';
   ```
4. **环境变量配置截图**: Vercel → Settings → Environment Variables（隐藏敏感值）
5. **错误信息**: 前端控制台的完整错误信息

---

## 🆘 紧急联系方式

如果问题紧急且以上方法都不行：

1. 检查 GitHub 仓库的 Issues: https://github.com/loyo-sun/juzi-tarot-web/issues
2. 查看项目文档:
   - `DEPLOYMENT-GUIDE.md`
   - `API-REFERENCE.md`
   - `BACKEND-PLAN.md`

---

最后更新：2026-06-26
