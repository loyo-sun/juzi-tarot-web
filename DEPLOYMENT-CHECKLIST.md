# 🚀 橘子塔罗部署清单

## 阶段 1：Supabase 设置 ✅

### 步骤 1.1：创建项目
- [ ] 访问 [supabase.com](https://supabase.com)
- [ ] 创建新项目 `juzi-tarot`
- [ ] 选择区域：Northeast Asia (Seoul)
- [ ] 记录数据库密码

### 步骤 1.2：配置 Email Auth
- [ ] Authentication → Providers → Email
- [ ] 启用 Email provider
- [ ] 禁用 Email Confirmations（测试阶段）
- [ ] 保存设置

### 步骤 1.3：运行数据库脚本
- [ ] SQL Editor → New query
- [ ] 复制粘贴 `supabase/schema.sql`
- [ ] 运行脚本
- [ ] 确认看到成功提示

### 步骤 1.4：创建管理员账号
- [ ] Authentication → Users → Add user
- [ ] 邮箱：`qsun@vip.qq.com`
- [ ] 设置密码（记住它！）
- [ ] 勾选 Auto Confirm User
- [ ] 创建用户

### 步骤 1.5：获取 API 凭证
- [ ] Project Settings → API
- [ ] 复制 Project URL
- [ ] 复制 anon public key
- [ ] 复制 service_role key（敏感！）

---

## 阶段 2：本地开发环境 🛠️

### 步骤 2.1：配置环境变量
- [ ] 复制 `.env.example` 为 `.env`
- [ ] 填写 AI API 配置
- [ ] 填写 Supabase URL
- [ ] 填写 SUPABASE_ANON_KEY
- [ ] 填写 SUPABASE_SERVICE_KEY

### 步骤 2.2：验证配置
```bash
# 测试兑换码
npm run dev
# 在浏览器输入：JUZI-TEST-0001
```

- [ ] 测试兑换码验证成功
- [ ] 测试开始占卜
- [ ] 测试保存解析
- [ ] 测试追问功能

---

## 阶段 3：Vercel 部署 🌐

### 步骤 3.1：推送到 GitHub
- [ ] 确认所有代码已提交
- [ ] 确认 `.env` 在 `.gitignore` 中
- [ ] `git push` 到 main 分支

### 步骤 3.2：连接 Vercel
- [ ] 访问 [vercel.com](https://vercel.com)
- [ ] Import Project
- [ ] 选择 `loyo-sun/juzi-tarot-web`
- [ ] 点击 Deploy

### 步骤 3.3：配置 Vercel 环境变量
在 Vercel Project Settings → Environment Variables 中添加：

- [ ] `AI_API_URL`
- [ ] `AI_API_KEY`
- [ ] `AI_MODEL_NAME`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_KEY`

⚠️ **重要**：所有环境选择 `Production`, `Preview`, `Development`

### 步骤 3.4：重新部署
- [ ] Vercel Deployments → 点击最新部署 → Redeploy
- [ ] 等待部署完成

---

## 阶段 4：功能测试 ✅

### 前端测试
- [ ] 访问部署的网站
- [ ] 输入测试兑换码 `JUZI-TEST-0001`
- [ ] 提交问题
- [ ] 完成洗牌和抽牌
- [ ] 查看 AI 解析
- [ ] 测试追问功能
- [ ] 测试天使祝福
- [ ] 测试保存结果

### 管理后台测试（待开发）
- [ ] 访问 `/admin`
- [ ] 使用 `qsun@vip.qq.com` 登录
- [ ] 查看统计数据
- [ ] 生成测试兑换码
- [ ] 查看兑换码列表
- [ ] 查看占卜记录

---

## 阶段 5：监控和维护 📊

### 日常检查
- [ ] 每周检查 Supabase 数据库大小
- [ ] 每月检查 Vercel 使用额度
- [ ] 每月运行清理过期记录

### 性能监控
- [ ] Vercel Analytics 查看访问量
- [ ] Supabase Dashboard 查看 API 调用
- [ ] 检查 AI API 消耗

### 数据备份（可选）
- [ ] Supabase Dashboard → Database → Backups
- [ ] 设置自动备份
- [ ] 定期下载备份

---

## 🔒 安全检查清单

### 环境变量
- [x] `.env` 已在 `.gitignore`
- [ ] Vercel 环境变量已设置
- [ ] `SUPABASE_SERVICE_KEY` 仅用于后端
- [ ] API Key 定期轮换

### 数据库安全
- [ ] 管理员密码强度检查
- [ ] 定期审计管理员列表
- [ ] 监控异常访问

### API 安全
- [ ] 兑换码格式验证
- [ ] 输入长度限制
- [ ] Rate limiting（可选）

---

## 📝 当前状态

### ✅ 已完成
- [x] 前端完整 UI
- [x] AI 解析 API
- [x] 数据库设计
- [x] 数据库脚本

### 🚧 进行中
- [ ] 兑换码验证 API
- [ ] 占卜流程 API
- [ ] 管理员登录 API
- [ ] 管理后台界面

### 📅 待开发
- [ ] 追问和天使祝福 API
- [ ] 历史记录 API
- [ ] 兑换码生成功能
- [ ] 统计数据看板

---

## 🆘 故障排查

### 部署失败
1. 检查 Vercel 构建日志
2. 确认环境变量正确
3. 检查 `vercel.json` 配置

### 数据库连接失败
1. 确认 Supabase URL 正确
2. 检查 API Key 是否有效
3. 查看 Supabase Project Status

### AI 解析失败
1. 检查 AI_API_KEY 余额
2. 确认 API URL 正确
3. 查看 Vercel Function 日志

---

## 📞 联系信息

- **Supabase 项目**: [Dashboard](https://supabase.com/dashboard)
- **Vercel 项目**: [Dashboard](https://vercel.com/dashboard)
- **GitHub 仓库**: https://github.com/loyo-sun/juzi-tarot-web
- **管理员邮箱**: qsun@vip.qq.com

---

## ✨ 下一步

完成以上清单后，你的橘子塔罗就可以正式运行了！

接下来开发：
1. API 端点实现（第1周）
2. 管理后台（第2-3周）
3. 优化和测试

祝你开发顺利！🎉
