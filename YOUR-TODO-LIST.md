# 📋 你的待办事项清单

最后更新：2026-06-26

---

## ✅ 已完成的任务

- [x] 创建 Supabase 项目（juzitaluo）
- [x] 运行数据库脚本（schema.sql）
- [x] 插入测试兑换码（JUZI-TEST-0001, 0002, 0003）
- [x] 配置 RLS 策略
- [x] 配置 Vercel 环境变量（Supabase 相关）
- [x] 测试数据库连接成功
- [x] 验证完整占卜流程可用

---

## 🎯 当前需要做的事情

### 任务 1: 配置 AI API（可选但推荐）⭐

**目的**: 让 AI 解析功能正常工作，而不是显示演示文本

**步骤**:
1. 准备你的 AI API 配置信息：
   - API Key（密钥）
   - API Base URL（服务地址）
   - Model Name（模型名称）

2. 在 Vercel 中添加环境变量：
   - 访问 https://vercel.com/dashboard
   - 进入 `juzi-tarot-web` 项目
   - 点击 **Settings** → **Environment Variables**
   - 添加以下 3 个变量（勾选所有环境）：
     - `AI_API_KEY` = 你的 API Key
     - `AI_API_BASE_URL` = 你的 API 地址
     - `AI_MODEL` = 你的模型名称

3. 重新部署：
   - 在 Vercel 项目页面点击 **Deployments**
   - 找到最新部署，点击 **...** → **Redeploy**
   - 等待部署完成（约 1-2 分钟）

4. 测试：
   - 使用测试兑换码完成一次占卜
   - 检查是否显示真实的 AI 解析

**预计时间**: 5-10 分钟

**优先级**: ⭐⭐⭐ 高（用户体验核心功能）

---

### 任务 2: 创建管理员账号

**目的**: 为后续管理后台做准备

**步骤**:
1. 访问 https://supabase.com/dashboard
2. 进入 `juzitaluo` 项目
3. 点击左侧 **Authentication** → **Users**
4. 点击 **Add User** → **Create new user**
5. 填写信息：
   - Email: `qsun@vip.qq.com`（或你的邮箱）
   - Password: 设置一个强密码（至少 8 位，记住它！）
   - **勾选** Auto Confirm User
6. 点击 **Create user**
7. **记录密码**（后续登录管理后台需要）

**预计时间**: 3 分钟

**优先级**: ⭐⭐ 中（管理后台开发前需要完成）

---

### 任务 3: 生产环境测试

**目的**: 确保所有功能在生产环境正常工作

**步骤**:
1. **完整流程测试**：
   - 访问 https://juzi.loyo.work/
   - 使用 `JUZI-TEST-0002`（这个还有 5 次）
   - 完整走一遍：兑换码 → 提问 → 抽牌 → 解析 → 追问 → 天使祝福
   - 记录任何问题或 bug

2. **多次测试**（测试次数扣减）：
   - 使用同一个兑换码连续占卜多次
   - 验证次数是否正确扣减
   - 验证次数用完后的提示

3. **性能测试**：
   - 测试抽牌动画是否流畅
   - 测试 AI 解析响应速度
   - 测试追问功能响应

4. **移动端测试**：
   - 用手机访问网站
   - 测试所有功能是否正常
   - 检查页面是否一屏显示

**预计时间**: 20-30 分钟

**优先级**: ⭐⭐⭐ 高（确保质量）

---

### 任务 4: 准备正式兑换码数据

**目的**: 为正式上线准备真实的兑换码

**选项 A - 手动生成（推荐在管理后台完成前）**：
```sql
-- 在 Supabase SQL Editor 中运行
INSERT INTO redemption_codes (code, question_limit, followup_limit_per_question, note, expires_at)
VALUES 
  ('JUZI-2026-ABCD', 3, 3, '首批用户-小明', NOW() + INTERVAL '30 days'),
  ('JUZI-2026-EFGH', 5, 3, '首批用户-小红', NOW() + INTERVAL '30 days'),
  ('JUZI-2026-IJKL', 10, 3, 'VIP用户', NOW() + INTERVAL '90 days');
  
-- 查看生成的兑换码
SELECT code, question_limit, expires_at, note 
FROM redemption_codes 
WHERE code LIKE 'JUZI-2026%';
```

**选项 B - 等待管理后台**：
等我开发完管理后台的兑换码生成功能（更方便，推荐）。

**预计时间**: 5 分钟（手动）或 等待

**优先级**: ⭐ 低（有测试码就够用，正式上线前再做）

---

### 任务 5: 域名和 SEO 优化（可选）

**目的**: 提升用户体验和搜索引擎排名

**步骤**:
1. **自定义域名**（如果需要）：
   - 在 Vercel 项目设置中添加自定义域名
   - 配置 DNS 记录
   
2. **添加网站描述和关键词**：
   - 我可以帮你更新 `index.html` 的 meta 标签
   - 添加 favicon
   
3. **添加分享卡片**：
   - 添加 Open Graph 标签
   - 分享到社交媒体时显示漂亮的预览

**预计时间**: 30 分钟 - 1 小时

**优先级**: ⭐ 低（锦上添花，不影响功能）

---

## 📱 日常维护任务

### 每周检查（5-10 分钟）

1. **查看使用情况**：
```sql
-- 在 Supabase SQL Editor 运行
SELECT * FROM admin_stats;
```

2. **检查兑换码状态**：
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(question_used) as total_used
FROM redemption_codes
GROUP BY status;
```

3. **清理过期记录**（可选，系统会自动清理）：
```sql
SELECT cleanup_expired_sessions();
```

### 遇到问题时

1. **查看诊断页面**：
   - 访问 https://juzi.loyo.work/debug.html
   - 检查所有配置是否正常

2. **查看 Vercel 日志**：
   - Vercel 项目 → Functions
   - 查看出错的 API 日志

3. **查看 Supabase 日志**：
   - Supabase 项目 → Logs
   - 查看数据库查询日志

---

## 🎯 你的优先级建议

### 这周完成：
1. ✅ 配置 AI API（任务 1）- 最重要
2. ✅ 创建管理员账号（任务 2）
3. ✅ 生产环境测试（任务 3）

### 下周完成：
4. 等待管理后台开发完成
5. 使用管理后台生成正式兑换码

### 有空时做：
6. 域名和 SEO 优化

---

## 💡 提示

- **测试兑换码别用完了**：`JUZI-TEST-0002` 和 `JUZI-TEST-0003` 还有很多次数，测试时用这些
- **密码记牢**：管理员账号密码一定要记住，后续登录管理后台需要
- **有问题随时问**：任何步骤遇到问题都可以问我

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 `TROUBLESHOOTING.md` - 故障排查指南
2. 访问诊断页面看具体错误
3. 截图或复制错误信息告诉我

---

最后更新：2026-06-26
