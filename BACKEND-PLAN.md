# 橘子塔罗后端开发计划

## 📋 项目现状

### ✅ 已完成
- 前端完整流程（兑换码、提问、洗牌、抽牌、解析）
- AI 解析 API (`/api/reading.js`)
- 前端兑换码模拟（localStorage）
- 响应式 UI 优化

### ❌ 待开发
- 真实兑换码验证和核销
- 数据持久化（Supabase）
- 兑换码管理后台
- 占卜记录存储（7天自动清理）

---

## 🎯 后端开发目标

构建一个极简、无用户系统的后端，实现：
1. **唯一认证：兑换码** - 不需要用户注册/登录
2. 兑换码生成、验证、核销
3. 占卜记录持久化（7天后自动删除）
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
- **仅使用兑换码认证** - 无用户系统
  - 兑换码即身份凭证
  - 前端存储兑换码到 localStorage
  - 所有 API 通过兑换码鉴权

---

## 📊 数据库设计

### 1. redemption_codes 表（兑换码）⭐️ 核心表
```sql
CREATE TABLE redemption_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 兑换码（唯一身份凭证）
  question_limit INTEGER NOT NULL DEFAULT 1, -- 可用问题次数
  question_used INTEGER NOT NULL DEFAULT 0, -- 已用问题次数
  followup_limit_per_question INTEGER NOT NULL DEFAULT 3, -- 每题追问次数
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | expired | disabled
  expires_at TIMESTAMPTZ, -- 过期时间
  first_used_at TIMESTAMPTZ, -- 首次使用时间
  last_used_at TIMESTAMPTZ, -- 最后使用时间
  note TEXT, -- 管理员备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemption_codes_code ON redemption_codes(code);
CREATE INDEX idx_redemption_codes_status ON redemption_codes(status);
CREATE INDEX idx_redemption_codes_created ON redemption_codes(created_at DESC);
```

### 2. tarot_sessions 表（占卜记录）⏰ 7天自动删除
```sql
CREATE TABLE tarot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL, -- 兑换码（直接存储，不用外键）
  question TEXT NOT NULL, -- 用户问题
  spread_type VARCHAR(50) DEFAULT 'three-card', -- 牌阵类型
  cards JSONB NOT NULL, -- 三张牌 [{index, name, reversed, position}]
  ai_reading TEXT, -- AI 解析结果
  angel_blessing_card JSONB, -- 天使祝福牌
  angel_blessing_text TEXT, -- 天使祝福文本
  status VARCHAR(20) DEFAULT 'completed', -- completed | in_progress
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days', -- 7天后过期
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarot_sessions_code ON tarot_sessions(code);
CREATE INDEX idx_tarot_sessions_expires ON tarot_sessions(expires_at);
CREATE INDEX idx_tarot_sessions_created ON tarot_sessions(created_at DESC);
```

### 3. tarot_followups 表（追问记录）⏰ 随 session 自动删除
```sql
CREATE TABLE tarot_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES tarot_sessions(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL, -- 兑换码
  followup_question TEXT NOT NULL, -- 追问问题
  card JSONB NOT NULL, -- 追问牌 {index, name, reversed}
  ai_reading TEXT, -- 追问解析
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarot_followups_session ON tarot_followups(session_id);
CREATE INDEX idx_tarot_followups_code ON tarot_followups(code);
```

### 4. tarot_cards 表（塔罗牌数据）📚 可选，用于后续功能
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

### 5. admin_users 表（管理员）🔑 简化版
```sql
-- 方案：直接使用 Supabase Dashboard 管理
-- 或者使用环境变量配置的 ADMIN_KEY
-- 不需要单独的表
```

---

## 🔌 API 端点设计（简化版）

### 兑换码相关（核心）
- `POST /api/codes/verify` - 校验兑换码并返回状态
  - 输入：`{ code }`
  - 输出：`{ valid, question_left, followup_per_question, expires_at }`

### 占卜流程相关
- `POST /api/tarot/start` - 开始新占卜（扣除问题次数）
  - 输入：`{ code, question, cards }`
  - 输出：`{ session_id, success }`
  
- `POST /api/tarot/save-reading` - 保存 AI 解析结果
  - 输入：`{ session_id, code, reading }`
  - 输出：`{ success }`

- `POST /api/tarot/followup` - 添加追问（校验次数）
  - 输入：`{ session_id, code, question, card }`
  - 输出：`{ followup_id, followup_left, success }`

- `POST /api/tarot/angel` - 保存天使祝福
  - 输入：`{ session_id, code, card, text }`
  - 输出：`{ success }`

- `GET /api/tarot/history?code=xxx` - 获取兑换码的占卜历史（7天内）
  - 输出：`{ sessions: [...] }`

### 管理后台相关
- `POST /api/admin/codes/generate` - 生成兑换码
  - 需要 `ADMIN_KEY` 验证
  - 输入：`{ count, question_limit, followup_limit, expires_days }`
  - 输出：`{ codes: [...] }`

- `GET /api/admin/codes` - 兑换码列表
  - 需要 `ADMIN_KEY` 验证
  - 输出：`{ codes: [...], total }`

- `GET /api/admin/stats` - 统计数据
  - 需要 `ADMIN_KEY` 验证
  - 输出：`{ total_codes, active_codes, total_sessions, ... }`

---

## 🚀 开发阶段（简化到3周）

### 阶段 1：数据库和核心 API（第1周）⭐️
**目标：** 搭建 Supabase 并实现核心功能

#### 任务清单
- [ ] 创建 Supabase 项目
- [ ] 创建3个核心表（codes, sessions, followups）
- [ ] 兑换码验证 API
- [ ] 开始占卜 API（扣除次数）
- [ ] 保存解析 API
- [ ] 前端集成兑换码验证

#### 输出
- `supabase/schema.sql` - 数据库脚本
- `api/codes/verify.js` - 兑换码验证
- `api/tarot/start.js` - 开始占卜
- `api/tarot/save-reading.js` - 保存解析
- 前端兑换码模块更新

---

### 阶段 2：追问和历史记录（第2周）
**目标：** 完成占卜完整流程

#### 任务清单
- [ ] 追问 API（校验次数）
- [ ] 天使祝福 API
- [ ] 历史记录查询 API
- [ ] 7天自动清理定时任务
- [ ] 前端完整集成
- [ ] 端到端测试

#### 输出
- `api/tarot/followup.js` - 追问
- `api/tarot/angel.js` - 天使祝福
- `api/tarot/history.js` - 历史记录
- `supabase/functions/cleanup.sql` - 清理函数
- 完整流程测试通过

---

### 阶段 3：管理后台和上线（第3周）
**目标：** 管理功能和生产部署

#### 任务清单
- [ ] 兑换码生成 API（带 ADMIN_KEY）
- [ ] 兑换码列表 API
- [ ] 统计数据 API
- [ ] 简单管理页面
- [ ] 安全审计
- [ ] 性能优化
- [ ] 文档完善

#### 输出
- `api/admin/codes/generate.js`
- `api/admin/codes/list.js`
- `api/admin/stats.js`
- `public/admin.html` - 管理后台
- 生产环境配置完成

---

## 🔒 安全考虑

### 1. API 认证
```javascript
// 所有占卜相关 API 都需要验证兑换码
function verifyCode(code) {
  const result = await supabase
    .from('redemption_codes')
    .select('*')
    .eq('code', code)
    .eq('status', 'active')
    .single();
  
  if (!result.data) throw new Error('无效的兑换码');
  if (result.data.expires_at && new Date(result.data.expires_at) < new Date()) {
    throw new Error('兑换码已过期');
  }
  return result.data;
}
```

### 2. 管理员认证
```javascript
// 管理员 API 需要验证 ADMIN_KEY
function verifyAdmin(req) {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    throw new Error('无权限');
  }
}
```

### 3. API 限流
- 使用 Vercel Edge Config 或 Upstash Redis
- 限制：10 次/分钟 per IP
- 防止恶意刷取次数

### 4. 输入验证
- 所有用户输入进行 sanitize
- 问题长度限制：10-200 字
- 兑换码格式校验：`^JUZI-[A-Z0-9]{4}-[A-Z0-9]{4}$`

### 5. 数据清理
```sql
-- 定时清理7天前的占卜记录
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM tarot_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 每天凌晨2点执行
-- 使用 Supabase Edge Functions 或 pg_cron
```

### 6. 敏感操作
- 管理员 API 需要 ADMIN_KEY 验证
- 次数扣减使用数据库事务保证原子性

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

## 🎯 里程碑（3周完成）

### Milestone 1：核心功能（1周）
- ✅ 数据库建表
- ✅ 兑换码验证
- ✅ 开始占卜并扣次数
- ✅ 前端集成

### Milestone 2：完整流程（2周）
- ✅ 追问功能
- ✅ 天使祝福
- ✅ 历史记录
- ✅ 7天自动清理

### Milestone 3：上线就绪（3周）
- ✅ 管理后台
- ✅ 兑换码生成
- ✅ 测试和优化
- ✅ 正式上线

---

## 📚 技术文档

需要创建的文档：
1. `DATABASE.md` - 数据库设计详解
2. `API.md` - API 接口文档
3. `DEPLOYMENT.md` - 部署指南
4. `SECURITY.md` - 安全策略说明

---

## 🤔 已确认的设计决策 ✅

1. **兑换码格式** - `JUZI-XXXX-XXXX` (16字符，简洁易读)
2. **无用户系统** - 仅使用兑换码作为身份凭证
3. **追问次数** - 每题固定 3 次追问
4. **天使祝福** - 不扣次数，每个主问题免费 1 次
5. **管理员认证** - 使用环境变量 `ADMIN_KEY` 简单验证
6. **数据保留** - 占卜记录仅保留 7 天，自动清理

---

## 下一步行动 🚀

**立即开始阶段 1：**
1. ✅ 创建 Supabase 项目
2. ✅ 运行数据库脚本（3个核心表）
3. ✅ 实现兑换码验证 API
4. ✅ 实现开始占卜 API

**需要你提供：**
- Supabase 项目 URL 和 API Key（创建后）

准备开始了吗？我们现在就可以创建数据库脚本！ 🎯
