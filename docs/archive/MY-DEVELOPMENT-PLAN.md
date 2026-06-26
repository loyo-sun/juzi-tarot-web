# 🚀 我的开发计划

AI 助手开发任务清单

最后更新：2026-06-26

---

## 📊 总体进度

- ✅ **阶段 1**: 数据库和核心 API - 100% 完成
- ✅ **阶段 2**: 完整流程 - 100% 完成
- ⏳ **阶段 3**: 管理后台 - 0% 待开始

**总进度**: 70% (2.1/3 阶段完成)

---

## 🎯 阶段 3: 管理后台开发（预计 1 周）

### 模块 1: 管理员认证系统

#### 任务 1.1: 管理员登录 API
**文件**: `api/admin/auth/login.js`

**功能**:
- 使用 Supabase Auth 验证邮箱密码
- 检查 `admin_users` 表确认管理员权限
- 返回 JWT token 和管理员信息

**接口设计**:
```javascript
POST /api/admin/auth/login
Request: { email, password }
Response: { 
  success: true,
  token: "eyJhbGc...",
  admin: {
    id: "uuid",
    email: "qsun@vip.qq.com",
    name: "超级管理员",
    role: "super_admin"
  }
}
```

**预计时间**: 2 小时

---

#### 任务 1.2: 获取管理员信息 API
**文件**: `api/admin/auth/me.js`

**功能**:
- 验证 Authorization Token
- 返回当前管理员信息和权限

**接口设计**:
```javascript
GET /api/admin/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: {
  success: true,
  admin: { id, email, name, role },
  permissions: ["manage_codes", "view_sessions", "view_stats"]
}
```

**预计时间**: 1 小时

---

#### 任务 1.3: 管理员认证中间件
**文件**: `lib/admin-auth.js`

**功能**:
- 通用的管理员认证中间件
- 供其他管理员 API 复用

**代码结构**:
```javascript
export async function verifyAdmin(req) {
  // 1. 验证 Authorization header
  // 2. 验证 Supabase token
  // 3. 检查 admin_users 表
  // 4. 返回管理员信息或抛出错误
}
```

**预计时间**: 1 小时

---

### 模块 2: 兑换码管理 API

#### 任务 2.1: 生成兑换码 API
**文件**: `api/admin/codes/generate.js`

**功能**:
- 批量生成兑换码
- 自动生成格式：`JUZI-XXXX-XXXX`
- 设置次数、过期时间、备注

**接口设计**:
```javascript
POST /api/admin/codes/generate
Request: {
  count: 10,                    // 生成数量
  question_limit: 3,            // 问题次数
  followup_limit: 3,            // 追问次数
  expires_days: 30,             // 有效期（天）
  note: "首批用户"              // 备注
}
Response: {
  success: true,
  codes: ["JUZI-ABC1-XYZ9", ...],
  count: 10
}
```

**核心逻辑**:
```javascript
function generateCode() {
  // 格式：JUZI-XXXX-XXXX
  // XXXX = 4位大写字母+数字随机组合
  // 检查唯一性，如重复则重新生成
}
```

**预计时间**: 3 小时

---

#### 任务 2.2: 兑换码列表 API
**文件**: `api/admin/codes/list.js`

**功能**:
- 分页查询兑换码
- 支持筛选（状态、日期）
- 支持搜索（兑换码、备注）

**接口设计**:
```javascript
GET /api/admin/codes?page=1&pageSize=20&status=active&search=test
Response: {
  success: true,
  codes: [
    {
      id: "uuid",
      code: "JUZI-TEST-0001",
      question_limit: 3,
      question_used: 1,
      status: "active",
      expires_at: "2026-07-26",
      first_used_at: "2026-06-26",
      note: "测试兑换码"
    },
    ...
  ],
  total: 50,
  page: 1,
  pageSize: 20,
  totalPages: 3
}
```

**预计时间**: 2 小时

---

#### 任务 2.3: 更新兑换码 API
**文件**: `api/admin/codes/update.js`

**功能**:
- 更新兑换码状态（禁用/启用）
- 修改过期时间
- 修改备注

**接口设计**:
```javascript
PATCH /api/admin/codes/:id
Request: {
  status: "disabled",           // 可选
  expires_at: "2026-12-31",     // 可选
  note: "已分配给用户A"          // 可选
}
Response: {
  success: true,
  code: { /* 更新后的兑换码信息 */ }
}
```

**预计时间**: 2 小时

---

### 模块 3: 数据统计和查看 API

#### 任务 3.1: 统计数据 API
**文件**: `api/admin/stats.js`

**功能**:
- 使用 `admin_stats` 视图获取统计
- 添加时间范围统计（今日、本周、本月）

**接口设计**:
```javascript
GET /api/admin/stats
Response: {
  success: true,
  stats: {
    total_codes: 100,
    active_codes: 85,
    expired_codes: 10,
    disabled_codes: 5,
    total_sessions: 250,
    today_sessions: 15,
    week_sessions: 89,
    total_followups: 180,
    total_questions_used: 250,
    avg_questions_per_code: 2.5
  }
}
```

**预计时间**: 2 小时

---

#### 任务 3.2: 占卜记录列表 API
**文件**: `api/admin/sessions/list.js`

**功能**:
- 分页查询占卜记录
- 支持按兑换码筛选
- 支持按日期筛选

**接口设计**:
```javascript
GET /api/admin/sessions?page=1&pageSize=20&code=JUZI-TEST-0001
Response: {
  success: true,
  sessions: [
    {
      id: "uuid",
      code: "JUZI-TEST-0001",
      question: "我的事业发展方向？",
      cards: [...],
      ai_reading: "解析内容...",
      followups_count: 2,
      has_angel_blessing: true,
      created_at: "2026-06-26T10:00:00Z",
      expires_at: "2026-07-03T10:00:00Z"
    },
    ...
  ],
  total: 250,
  page: 1,
  pageSize: 20
}
```

**预计时间**: 2 小时

---

#### 任务 3.3: 占卜详情 API
**文件**: `api/admin/sessions/detail.js`

**功能**:
- 查看单个占卜的完整信息
- 包含所有追问记录

**接口设计**:
```javascript
GET /api/admin/sessions/:id
Response: {
  success: true,
  session: {
    id: "uuid",
    code: "JUZI-TEST-0001",
    question: "我的事业发展方向？",
    cards: [...],
    ai_reading: "详细解析...",
    angel_blessing_card: {...},
    angel_blessing_text: "祝福内容...",
    followups: [
      {
        id: "uuid",
        question: "如何提升？",
        card: {...},
        ai_reading: "追问解析...",
        created_at: "2026-06-26T10:05:00Z"
      }
    ],
    created_at: "2026-06-26T10:00:00Z"
  }
}
```

**预计时间**: 1.5 小时

---

### 模块 4: 管理后台前端页面

#### 任务 4.1: 登录页面
**文件**: `public/admin/index.html`, `public/admin/login.js`, `public/admin/styles.css`

**功能**:
- 简洁的登录表单（邮箱、密码）
- 记住登录状态（localStorage）
- 错误提示

**页面结构**:
```html
- 橘子塔罗管理后台 LOGO
- 邮箱输入框
- 密码输入框
- 登录按钮
- 错误提示区域
```

**预计时间**: 2 小时

---

#### 任务 4.2: 管理后台主框架
**文件**: `public/admin/dashboard.html`, `public/admin/app.js`

**功能**:
- 顶部导航栏（LOGO、管理员名称、退出）
- 左侧菜单（统计、兑换码、占卜记录）
- 右侧内容区（动态加载）

**页面布局**:
```
┌─────────────────────────────────────────┐
│  Logo    橘子塔罗管理后台    admin@xx.com  退出  │
├──────────┬──────────────────────────────┤
│  统计    │  统计数据内容区                │
│  兑换码  │                              │
│  记录    │                              │
└──────────┴──────────────────────────────┘
```

**预计时间**: 3 小时

---

#### 任务 4.3: 统计看板页面
**文件**: `public/admin/components/stats.js`

**功能**:
- 显示统计卡片（总兑换码、活跃码、占卜次数等）
- 简单的图表（可选）

**页面内容**:
```
┌─────────────┬─────────────┬─────────────┐
│ 总兑换码    │ 活跃兑换码  │ 总占卜次数  │
│    100      │     85      │    250      │
└─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┬─────────────┐
│ 今日占卜    │ 本周占卜    │ 总追问      │
│     15      │     89      │    180      │
└─────────────┴─────────────┴─────────────┘
```

**预计时间**: 2 小时

---

#### 任务 4.4: 兑换码管理页面
**文件**: `public/admin/components/codes.js`

**功能**:
- 生成兑换码表单（批量生成）
- 兑换码列表（表格）
- 搜索和筛选
- 操作按钮（禁用、启用、编辑备注）

**页面结构**:
```
┌──────────────────────────────────────┐
│ [生成兑换码] 按钮                     │
├──────────────────────────────────────┤
│ 搜索: [____] 状态: [全部▼]  [搜索]  │
├──────────────────────────────────────┤
│ 兑换码         │ 次数  │ 状态 │ 操作 │
│ JUZI-TEST-0001│ 1/3   │ 活跃 │ 编辑 │
│ JUZI-TEST-0002│ 0/5   │ 活跃 │ 编辑 │
└──────────────────────────────────────┘
```

**预计时间**: 4 小时

---

#### 任务 4.5: 占卜记录页面
**文件**: `public/admin/components/sessions.js`

**功能**:
- 占卜记录列表（表格）
- 查看详情（弹窗或跳转）
- 按兑换码筛选

**页面结构**:
```
┌────────────────────────────────────────────┐
│ 兑换码: [____]  日期: [____]  [搜索]       │
├────────────────────────────────────────────┤
│ 时间         │ 兑换码     │ 问题    │ 操作 │
│ 2026-06-26  │ JUZI-001   │ 事业... │ 详情 │
│ 2026-06-26  │ JUZI-002   │ 感情... │ 详情 │
└────────────────────────────────────────────┘
```

**预计时间**: 3 小时

---

## 📦 需要创建的新文件

### 后端 API（8 个文件）
```
api/
├── admin/
│   ├── auth/
│   │   ├── login.js           ← 管理员登录
│   │   └── me.js              ← 获取管理员信息
│   ├── codes/
│   │   ├── generate.js        ← 生成兑换码
│   │   ├── list.js            ← 兑换码列表
│   │   └── update.js          ← 更新兑换码
│   ├── sessions/
│   │   ├── list.js            ← 占卜记录列表
│   │   └── detail.js          ← 占卜详情
│   └── stats.js               ← 统计数据
```

### 工具库（1 个文件）
```
lib/
└── admin-auth.js              ← 管理员认证中间件
```

### 前端页面（10+ 个文件）
```
public/
└── admin/
    ├── index.html             ← 登录页面
    ├── dashboard.html         ← 管理后台主页
    ├── styles.css             ← 样式文件
    ├── login.js               ← 登录逻辑
    ├── app.js                 ← 主应用逻辑
    └── components/
        ├── stats.js           ← 统计看板组件
        ├── codes.js           ← 兑换码管理组件
        └── sessions.js        ← 占卜记录组件
```

---

## ⏱️ 时间估算

| 模块 | 任务数 | 预计时间 |
|------|--------|----------|
| 管理员认证系统 | 3 | 4 小时 |
| 兑换码管理 API | 3 | 7 小时 |
| 数据统计和查看 API | 3 | 5.5 小时 |
| 管理后台前端页面 | 5 | 14 小时 |
| **总计** | **14** | **30.5 小时** |

**考虑测试和调试**: 约 **35-40 小时**

**按每天工作 5 小时计算**: **7-8 天完成**

---

## 🎯 开发优先级

### 第一天（核心认证）
- ✅ 管理员认证中间件
- ✅ 登录 API
- ✅ 获取管理员信息 API
- ✅ 登录页面

### 第二天（兑换码生成）
- ✅ 生成兑换码 API
- ✅ 兑换码列表 API
- ✅ 管理后台主框架

### 第三天（兑换码管理）
- ✅ 更新兑换码 API
- ✅ 兑换码管理页面

### 第四天（统计功能）
- ✅ 统计数据 API
- ✅ 统计看板页面

### 第五天（占卜记录）
- ✅ 占卜记录列表 API
- ✅ 占卜详情 API

### 第六天（记录查看）
- ✅ 占卜记录页面
- ✅ 详情查看功能

### 第七天（测试和优化）
- ✅ 完整功能测试
- ✅ UI 优化
- ✅ Bug 修复

---

## 🛠️ 技术栈

### 后端
- Vercel Serverless Functions
- Supabase Auth（JWT 验证）
- Supabase Database（数据查询）

### 前端
- 原生 HTML/CSS/JavaScript
- 无框架（保持简单）
- Fetch API（HTTP 请求）
- localStorage（Token 存储）

---

## 📝 开发规范

### API 响应格式统一
```javascript
// 成功
{
  success: true,
  data: { ... },
  message: "操作成功"
}

// 失败
{
  success: false,
  error: "错误信息",
  code: "ERROR_CODE"
}
```

### 错误处理
- 所有 API 都有 try-catch
- 返回友好的错误信息
- 记录详细的错误日志（console.error）

### 安全考虑
- 所有管理员 API 都需要 Token 验证
- Token 存储在 localStorage
- API 返回时不暴露敏感信息
- 输入验证和 SQL 注入防护

---

## 🧪 测试计划

### 单元测试
- 每个 API 独立测试
- 使用 curl 或 Postman 测试

### 集成测试
- 完整流程测试（登录 → 生成码 → 查看统计）
- 权限测试（未登录访问管理 API）

### 用户体验测试
- 响应速度测试
- 错误提示是否友好
- 操作流程是否顺畅

---

## 📚 需要的额外文档

### 开发完成后创建：
1. `ADMIN-API-REFERENCE.md` - 管理员 API 文档
2. `ADMIN-USER-GUIDE.md` - 管理后台使用指南
3. 更新 `DEPLOYMENT-GUIDE.md` - 添加管理后台部分

---

## 🎉 完成标准

### 功能完整性
- ✅ 管理员可以登录
- ✅ 可以批量生成兑换码
- ✅ 可以查看和管理兑换码
- ✅ 可以查看统计数据
- ✅ 可以查看占卜记录

### 质量标准
- ✅ 所有 API 经过测试
- ✅ 前端页面响应式设计
- ✅ 错误处理完善
- ✅ 文档完整

---

## 🚀 开始开发

我会按照以上计划逐步开发，每完成一个模块就推送到 GitHub。

你只需要：
1. 等待我完成开发
2. 测试功能
3. 提供反馈和建议

**准备好了吗？我现在就开始！** 🎯

---

最后更新：2026-06-26
