# 橘子塔罗后端开发计划

## 📋 项目现状

### ✅ 已完成
- 前端完整流程（兑换码、提问、洗牌、抽牌、解析）
- AI 解析 API (`/api/reading.js`)
- 前端兑换码模拟（localStorage）
- 响应式 UI 优化

### ❌ 待开发
- 用户认证系统
- 真实兑换码验证和核销
- 数据持久化（Supabase）
- 兑换码管理后台
- 占卜记录存储

---

## 🎯 后端开发目标

构建一个轻量、可扩展的后端系统，实现：
1. 用户身份识别（匿名用户支持）
2. 兑换码生成、验证、核销
3. 占卜记录持久化
4. 次数管理和扣减
5. 管理员后台

---

## 🗂️ 技术栈

### 数据库
- **Supabase** (PostgreSQL)
  - 免费额度充足
  - 自带认证系统
  - Row Level Security (RLS)
  - 实时订阅（可选）

### 后端 API
- **Vercel Serverless Functions**
  - 与前端同仓库
  - 自动部署
  - 零运维成本

### 认证方案
- **Supabase Auth** + **匿名用户**
  - 优先支持匿名访问
  - 可选微信小程序登录（后续）

---

## 📊 数据库设计

### 1. users 表（用户）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(20), -- 'web' | 'miniprogram'
  openid VARCHAR(100), -- 微信 openid（可选）
  nickname VARCHAR(50),
  avatar_url TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. redemption_codes 表（兑换码）
```sql
CREATE TABLE redemption_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 兑换码
  question_limit INTEGER NOT NULL DEFAULT 1, -- 可用问题次数
  question_used INTEGER NOT NULL DEFAULT 0, -- 已用问题次数
  followup_limit_per_question INTEGER NOT NULL DEFAULT 3, -- 每题追问次数
  total_followup_limit INTEGER, -- 总追问次数（可选）
  total_followup_used INTEGER DEFAULT 0, -- 已用总追问次数
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | used | expired | disabled
  expires_at TIMESTAMPTZ, -- 过期时间
  bound_user_id UUID REFERENCES users(id), -- 绑定用户
  bound_at TIMESTAMPTZ, -- 绑定时间
  note TEXT, -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemption_codes_code ON redemption_codes(code);
CREATE INDEX idx_redemption_codes_user ON redemption_codes(bound_user_id);
CREATE INDEX idx_redemption_codes_status ON redemption_codes(status);
```

### 3. tarot_sessions 表（占卜记录）
```sql
CREATE TABLE tarot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  redemption_code_id UUID REFERENCES redemption_codes(id),
  question TEXT NOT NULL, -- 用户问题
  spread_type VARCHAR(50) DEFAULT 'three-card', -- 牌阵类型
  cards JSONB NOT NULL, -- 三张牌 [{index, name, reversed, position}]
  ai_reading TEXT, -- AI 解析结果
  angel_blessing_card JSONB, -- 天使祝福牌
  angel_blessing_text TEXT, -- 天使祝福文本
  status VARCHAR(20) DEFAULT 'completed', -- completed | in_progress
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarot_sessions_user ON tarot_sessions(user_id);
CREATE INDEX idx_tarot_sessions_code ON tarot_sessions(redemption_code_id);
CREATE INDEX idx_tarot_sessions_created ON tarot_sessions(created_at DESC);
```

### 4. tarot_followups 表（追问记录）
```sql
CREATE TABLE tarot_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES tarot_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  followup_question TEXT NOT NULL, -- 追问问题
  card JSONB NOT NULL, -- 追问牌 {index, name, reversed}
  ai_reading TEXT, -- 追问解析
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarot_followups_session ON tarot_followups(session_id);
CREATE INDEX idx_tarot_followups_user ON tarot_followups(user_id);
```

### 5. tarot_cards 表（塔罗牌数据）
```sql
CREATE TABLE tarot_cards (
  id SERIAL PRIMARY KEY,
  index INTEGER UNIQUE NOT NULL, -- 1-78
  name_cn VARCHAR(100) NOT NULL, -- 中文名
  name_en VARCHAR(100) NOT NULL, -- 英文名
  arcana VARCHAR(20), -- major | minor
  suit VARCHAR(20), -- wands | cups | swords | pentacles | null
  number INTEGER, -- 牌面数字
  upright_keywords TEXT[], -- 正位关键词
  reversed_keywords TEXT[], -- 逆位关键词
  upright_meaning TEXT, -- 正位含义
  reversed_meaning TEXT, -- 逆位含义
  image_url TEXT, -- 图片 URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarot_cards_index ON tarot_cards(index);
```

### 6. admin_users 表（管理员）
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'admin', -- admin | super_admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔌 API 端点设计

### 用户相关
- `POST /api/auth/anonymous` - 创建匿名用户
- `GET /api/auth/me` - 获取当前用户信息

### 兑换码相关
- `POST /api/codes/verify` - 校验兑换码
- `POST /api/codes/bind` - 绑定兑换码到用户
- `GET /api/codes/status` - 获取兑换码状态和剩余次数

### 占卜流程相关
- `POST /api/tarot/session` - 创建新占卜（扣除问题次数）
- `POST /api/tarot/session/:id/reading` - 保存解析结果
- `POST /api/tarot/session/:id/followup` - 添加追问（扣除追问次数）
- `POST /api/tarot/session/:id/angel` - 添加天使祝福
- `GET /api/tarot/session/:id` - 获取占卜详情
- `GET /api/tarot/sessions` - 获取用户的占卜历史

### 管理后台相关
- `POST /api/admin/codes/create` - 生成兑换码
- `POST /api/admin/codes/batch` - 批量生成兑换码
- `GET /api/admin/codes` - 兑换码列表（分页、筛选）
- `PATCH /api/admin/codes/:id` - 更新兑换码状态
- `GET /api/admin/stats` - 统计数据

---

## 🚀 开发阶段

### 阶段 1：基础设施（第1周）
**目标：** 搭建 Supabase 并完成基本配置

#### 任务清单
- [ ] 创建 Supabase 项目
- [ ] 创建所有数据表
- [ ] 配置 Row Level Security (RLS) 策略
- [ ] 设置环境变量
- [ ] 创建数据库迁移脚本

#### 输出
- `supabase/migrations/` - 数据库迁移文件
- `.env` 配置模板更新
- 数据库访问测试通过

---

### 阶段 2：用户认证（第2周）
**目标：** 实现匿名用户系统

#### 任务清单
- [ ] 实现匿名用户创建 API
- [ ] 前端集成用户创建逻辑
- [ ] 用户 ID 持久化到 localStorage
- [ ] 用户信息获取 API
- [ ] 测试用户流程

#### 输出
- `api/auth/anonymous.js`
- `api/auth/me.js`
- 前端 `auth.js` 工具模块
- 用户认证测试通过

---

### 阶段 3：兑换码系统（第3周）
**目标：** 实现兑换码验证、绑定、次数管理

#### 任务清单
- [ ] 兑换码验证 API
- [ ] 兑换码绑定 API
- [ ] 兑换码状态查询 API
- [ ] 前端集成兑换码逻辑
- [ ] 替换 localStorage 模拟
- [ ] 次数扣减和校验

#### 输出
- `api/codes/verify.js`
- `api/codes/bind.js`
- `api/codes/status.js`
- 前端兑换码模块更新
- 次数管理测试通过

---

### 阶段 4：占卜记录持久化（第4周）
**目标：** 保存所有占卜数据

#### 任务清单
- [ ] 创建占卜 session API
- [ ] 保存 AI 解析结果
- [ ] 追问记录保存
- [ ] 天使祝福保存
- [ ] 获取占卜详情
- [ ] 占卜历史列表

#### 输出
- `api/tarot/session.js`
- `api/tarot/followup.js`
- `api/tarot/angel.js`
- `api/tarot/history.js`
- 数据持久化测试通过

---

### 阶段 5：管理后台（第5周）
**目标：** 兑换码生成和管理界面

#### 任务清单
- [ ] 兑换码生成 API
- [ ] 批量生成功能
- [ ] 兑换码列表查询（分页）
- [ ] 兑换码状态管理
- [ ] 管理员认证
- [ ] 管理后台页面
- [ ] 数据统计看板

#### 输出
- `api/admin/codes.js`
- `api/admin/stats.js`
- `pages/admin.html` - 管理后台页面
- 管理功能测试通过

---

### 阶段 6：集成测试与优化（第6周）
**目标：** 端到端测试和性能优化

#### 任务清单
- [ ] 完整流程测试
- [ ] 并发测试
- [ ] 错误处理优化
- [ ] API 性能优化
- [ ] 安全审计
- [ ] 文档完善

#### 输出
- 测试报告
- 性能优化记录
- API 文档
- 部署检查清单

---

## 🔒 安全考虑

### 1. Row Level Security (RLS)
```sql
-- 用户只能查看自己的占卜记录
ALTER TABLE tarot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON tarot_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- 兑换码只能被绑定用户查看
ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bound codes"
  ON redemption_codes FOR SELECT
  USING (auth.uid() = bound_user_id);
```

### 2. API 限流
- 使用 Vercel Edge Config 或 Upstash Redis
- 限制：10 次/分钟 per IP
- 防止恶意刷取次数

### 3. 输入验证
- 所有用户输入进行 sanitize
- 问题长度限制：10-200 字
- 兑换码格式校验

### 4. 敏感操作
- 管理员 API 需要验证 Supabase Admin Key
- 兑换码生成需要管理员权限
- 次数扣减使用数据库事务

---

## 💰 成本估算

### Supabase 免费额度
- 数据库：500MB
- 每月请求：500万
- 认证用户：50,000
- 存储：1GB

**预计可支撑：**
- 1000+ 日活用户
- 10,000+ 占卜记录
- 完全免费

### Vercel 免费额度
- Serverless 调用：1000 万次/月
- 带宽：100GB/月
- 完全足够使用

---

## 📝 开发优先级

### P0 - 核心功能（必须）
1. ✅ 数据库设计和创建
2. ✅ 匿名用户系统
3. ✅ 兑换码验证和绑定
4. ✅ 次数扣减逻辑
5. ✅ 占卜记录保存

### P1 - 重要功能（应该有）
1. 兑换码生成 API
2. 简单管理后台
3. 占卜历史查询
4. 错误处理和日志

### P2 - 增强功能（可以有）
1. 数据统计看板
2. 导出功能
3. 批量操作
4. 性能监控

---

## 🎯 里程碑

### Milestone 1：MVP 后端（2周）
- 数据库完成
- 用户系统完成
- 兑换码基本功能完成

### Milestone 2：完整功能（4周）
- 占卜记录持久化
- 管理后台完成
- 前后端完全集成

### Milestone 3：生产就绪（6周）
- 测试完成
- 文档完成
- 性能优化
- 正式上线

---

## 📚 技术文档

需要创建的文档：
1. `DATABASE.md` - 数据库设计详解
2. `API.md` - API 接口文档
3. `DEPLOYMENT.md` - 部署指南
4. `SECURITY.md` - 安全策略说明

---

## 🤔 待决策问题

1. **兑换码格式？**
   - 建议：`JUZI-XXXX-XXXX` (16位)
   - 使用 nanoid 或 uuid 生成

2. **兑换码是否可复用？**
   - 建议：一码一用，绑定后不可转移
   - 或：支持多设备，不绑定用户

3. **追问次数规则？**
   - 方案A：每题固定 3 次追问
   - 方案B：总共 10 次追问，自由分配

4. **天使祝福是否扣次数？**
   - 建议：不扣，每个主问题免费 1 次

5. **管理员登录方式？**
   - 方案A：Supabase Admin 邮箱密码
   - 方案B：环境变量配置的 Admin Key

---

## 下一步行动

**立即开始：**
1. 创建 Supabase 项目
2. 运行数据库迁移
3. 实现第一个 API (匿名用户)

**需要你确认：**
- 是否同意这个开发计划？
- 上述待决策问题的选择
- 是否有其他需求要补充？

确认后我们就开始阶段 1 的开发！🚀
