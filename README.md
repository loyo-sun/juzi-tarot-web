# 🍊 橘子塔罗 Web 端

一个优雅的在线塔罗占卜应用，集成 AI 智能解读和完善的管理后台。

**线上地址**：https://juzi.loyo.work  
**管理后台**：https://juzi.loyo.work/admin

---

## ✨ 核心特性

- 🎴 完整塔罗占卜流程（兑换码 → 提问 → 抽牌 → AI 解析）
- 🤖 AI 驱动的智能牌面解读
- 💭 支持追问功能（每题 3 次）
- 👼 天使祝福卡（每题 1 次）-0000
- 📊 管理后台（统计、兑换码管理、记录查询）
- 🎫 雪花算法生成唯一兑换码
- 📱 响应式设计，完美支持移动端

---

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run dev

# 访问应用
# 用户端：http://localhost:3000
# 管理端：http://localhost:3000/admin/login.html
```

### 部署到 Vercel

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 配置环境变量（见下方）
4. 部署完成！

详细步骤请参考：[部署指南](./DEPLOYMENT-GUIDE.md)

---

## 🔧 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

```bash
# AI API 配置
AI_API_URL=https://api.openai-hub.com/v1
AI_API_KEY=你的_API_KEY
AI_MODEL_NAME=deepseek-v4-flash

# Supabase 配置
SUPABASE_URL=https://你的项目.supabase.co/rest/v1/
SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

---

## 🗄️ 数据库设置

### 1. 创建 Supabase 项目

访问 [supabase.com](https://supabase.com) 创建新项目。

### 2. 运行初始化脚本

在 Supabase SQL Editor 中运行 `supabase/schema.sql`，这会创建：

- 数据库表（兑换码、占卜记录、追问记录、管理员）
- RLS 安全策略
- 自动清理函数
- 初始管理员账号

### 3. 创建管理员

在 Supabase Auth 中创建管理员用户，确保邮箱与 `admin_users` 表中的记录一致。

详细步骤请参考：`supabase/README.md`

---

## 📚 文档导航

### 必读文档
- **[部署指南](./DEPLOYMENT-GUIDE.md)** - 完整的部署流程
- **[API 参考](./API-REFERENCE.md)** - 所有 API 接口说明
- **[故障排查](./TROUBLESHOOTING.md)** - 常见问题解决方案

### 归档文档
- 历史开发记录、优化记录等归档文档位于 [`docs/archive/`](./docs/archive/)

---

## 🎯 技术架构

| 层级 | 技术栈 |
|------|--------|
| **前端** | HTML/CSS/JavaScript（原生，无框架） |
| **后端** | Vercel Serverless Functions（Node.js） |
| **数据库** | Supabase（PostgreSQL + RLS） |
| **认证** | Supabase Auth + JWT |
| **AI** | DeepSeek V4（通过 OpenAI Hub） |
| **部署** | Vercel（自动部署） |

---

## 📊 API 架构（9 个函数）

符合 Vercel 免费版 12 函数限制：

### 用户端 API
- `/api/codes.js` - 兑换码验证
- `/api/tarot.js` - 塔罗占卜（5 个操作合并）
- `/api/reading.js` - AI 解析

### 管理端 API
- `/api/admin-auth.js` - 管理员认证（2 个操作合并）
- `/api/admin-codes.js` - 兑换码管理（3 个操作合并）
- `/api/admin-sessions.js` - 占卜记录管理（2 个操作合并）
- `/api/admin-stats.js` - 统计数据

### 调试工具
- `/api/debug-admin.js` - 管理员诊断
- `/api/debug/config-check.js` - 配置检查

详细 API 文档：[API-REFERENCE.md](./API-REFERENCE.md)

---

## 🔐 管理员登录

**默认管理员账号**（需在部署后创建）：
- 邮箱：在 `supabase/schema.sql` 中配置
- 密码：在 Supabase Auth 中设置

**功能权限**：
- 📊 查看统计数据
- 🎫 生成和管理兑换码
- 🔮 查看所有占卜记录
- 🔍 搜索和筛选功能

---

## 🧪 测试

### 测试兑换码

部署后运行初始化脚本会自动创建测试兑换码：

```
JUZI-TEST-0001 - 3 次提问，3 次追问
JUZI-TEST-0002 - 5 次提问，3 次追问
```

### 诊断工具

访问 `/debug.html` 进行系统诊断：
- ✅ 环境变量检查
- ✅ 数据库连接测试
- ✅ 兑换码查询测试

---

## 🔒 安全特性

- ✅ 兑换码验证（用户唯一认证方式）
- ✅ JWT Token 认证（管理员）
- ✅ Row Level Security（数据库权限隔离）
- ✅ API 权限验证
- ✅ 雪花算法（无规律兑换码）
- ✅ 自动清理过期数据（7 天）

---

## 📝 开发状态

| 模块 | 状态 |
|------|------|
| 用户端占卜流程 | ✅ 完成 |
| AI 解析集成 | ✅ 完成 |
| 管理后台 | ✅ 完成 |
| 数据库设计 | ✅ 完成 |
| API 开发 | ✅ 完成 |
| Vercel 部署 | ✅ 完成 |
| 文档完善 | ✅ 完成 |

**项目状态**：🎉 生产环境稳定运行

---

## 📞 支持

遇到问题？

1. 查看 [故障排查指南](./TROUBLESHOOTING.md)
2. 查看 [API 文档](./API-REFERENCE.md)
3. 提交 [GitHub Issue](https://github.com/loyo-sun/juzi-tarot-web/issues)

---

## 📄 许可证

MIT License

---

**© 2026 橘子塔罗 · 用科技连接心灵** ✨
