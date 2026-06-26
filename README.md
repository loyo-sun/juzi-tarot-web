# 🍊 橘子塔罗 Web 端

一个优雅的塔罗占卜 Web 应用，包含完整的前端占卜流程和管理后台。

## ✨ 特性

### 用户端
- 🎴 完整的塔罗牌占卜流程（兑换码→提问→洗牌→抽牌→解析）
- 🤖 AI 驱动的智能牌面解读
- 💭 支持追问功能（每题最多3次）
- 👼 天使祝福卡（每题1次）
- 💫 流畅的动画效果（洗牌、切牌、抽牌）
- 📱 完美的响应式设计（手机端一屏显示）
- 🔒 兑换码验证系统

### 管理后台
- 📊 实时统计数据看板
- 🎫 兑换码批量生成（雪花算法）
- 📝 兑换码管理（搜索、筛选、禁用）
- 🔮 占卜记录查看
- 🔐 管理员认证系统

## 🎯 技术栈

### 前端
- 原生 HTML/CSS/JavaScript（无框架依赖）
- 响应式设计（支持移动端）
- LocalStorage（兑换码存储）

### 后端
- Vercel Serverless Functions
- Supabase（数据库 + 认证）
- AI API 集成（智能解读）

### 数据库
- PostgreSQL（Supabase）
- Row Level Security（数据安全）
- 自动清理（7天过期）

## 🚀 快速开始

### 1. 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
# 用户端：http://localhost:3000
# 管理后台：http://localhost:3000/admin
```

### 2. 部署到 Vercel

项目使用 Vercel 自动部署，推送到 main 分支即可触发部署。

### 3. 配置 Supabase

1. 创建 Supabase 项目
2. 运行 `supabase/schema.sql` 初始化数据库
3. 创建管理员账号
4. 配置环境变量

详细步骤见 `DEPLOYMENT-GUIDE.md`

## 🔧 环境变量

需要在 Vercel 中配置以下环境变量：

```bash
# AI API 配置
AI_API_KEY=你的AI密钥
AI_API_BASE_URL=你的AI服务地址
AI_MODEL=你的模型名称

# Supabase 配置
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_KEY=你的service_role_key
```

## 📚 文档

- **部署指南**: `DEPLOYMENT-GUIDE.md` - 完整的部署步骤
- **API 文档**: `API-REFERENCE.md` - 所有 API 接口说明
- **管理后台使用**: `ADMIN-USER-GUIDE.md` - 管理后台操作指南
- **故障排查**: `TROUBLESHOOTING.md` - 常见问题解决方案
- **开发计划**: `BACKEND-PLAN.md` - 完整的开发规划
- **你的任务**: `YOUR-TODO-LIST.md` - 用户待办事项

## 🎮 功能概览

### 用户端流程

1. **输入兑换码** → 验证并显示剩余次数
2. **输入问题** → 至少5个字符
3. **洗牌动画** → 3秒动画效果
4. **抽取3张牌** → 多行密集布局
5. **AI 解析** → 智能解读牌面
6. **追问** → 每题最多3次
7. **天使祝福** → 每题1次免费

### 管理后台功能

1. **统计看板** → 实时数据展示
2. **生成兑换码** → 批量生成（雪花算法）
3. **管理兑换码** → 查看、搜索、禁用
4. **占卜记录** → 查看所有占卜

## 📊 数据库设计

### 核心表

- `redemption_codes` - 兑换码表
- `tarot_sessions` - 占卜记录（7天自动清理）
- `tarot_followups` - 追问记录
- `admin_users` - 管理员表

详见 `supabase/schema.sql`

## 🔐 安全特性

- 兑换码验证（唯一认证方式）
- 管理员 JWT 认证
- Row Level Security（RLS）
- API 权限验证
- 雪花算法生成码（无规律）

## 🧪 测试

### 诊断工具

访问 `/debug.html` 进行系统诊断：
- 检查环境变量配置
- 测试数据库连接
- 验证 API 功能
- 查看测试兑换码

### 测试兑换码

```
JUZI-TEST-0001 - 3次问题
JUZI-TEST-0002 - 5次问题
JUZI-TEST-0003 - 10次问题
```

## 📈 项目进度

- ✅ 前端完整流程（100%）
- ✅ 后端核心 API（100%）
- ✅ 管理后台（100%）
- ✅ 文档完善（100%）

**总进度**: 100% 🎉

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

---

© 2026 橘子塔罗 · 用科技连接心灵
