# API 合并优化（Vercel 免费版适配）

## 问题
Vercel 免费版（Hobby plan）限制最多 12 个 Serverless Functions，原项目有 17 个 API 文件超过限制。

## 解决方案
将相关 API 合并为单个文件，通过 `action` 参数区分不同操作。

## 最终 API 结构（9 个函数）

### 1. `/api/codes.js` - 兑换码验证
- `POST /api/codes?action=verify` - 验证兑换码

### 2. `/api/tarot.js` - 塔罗占卜（合并 5 个 API）
- `POST /api/tarot?action=start` - 开始占卜
- `POST /api/tarot?action=save` - 保存解析结果
- `POST /api/tarot?action=followup` - 添加追问
- `POST /api/tarot?action=angel` - 保存天使祝福
- `GET /api/tarot?action=history&code=xxx` - 获取历史记录

### 3. `/api/admin-auth.js` - 管理员认证（合并 2 个 API）
- `POST /api/admin-auth?action=login` - 管理员登录
- `GET /api/admin-auth?action=me` - 获取管理员信息

### 4. `/api/admin-codes.js` - 兑换码管理（合并 3 个 API）
- `POST /api/admin-codes?action=generate` - 生成兑换码
- `GET /api/admin-codes?action=list` - 兑换码列表
- `PATCH /api/admin-codes?action=update&id=xxx` - 更新兑换码

### 5. `/api/admin-sessions.js` - 占卜记录管理（合并 2 个 API）
- `GET /api/admin-sessions?action=list` - 占卜记录列表
- `GET /api/admin-sessions?action=detail&id=xxx` - 占卜详情

### 6. `/api/admin-stats.js` - 统计数据
- `GET /api/admin-stats` - 获取管理后台统计数据

### 7. `/api/reading.js` - AI 解析（独立）
- `POST /api/reading` - AI 塔罗牌解析

### 8. `/api/debug/config-check.js` - 配置检查（调试用）
- `GET /api/debug/config-check` - 检查环境配置

### 9. `/api/debug/test-query.js` - 数据库测试（调试用）
- `GET /api/debug/test-query` - 测试数据库查询

## 迁移说明

### 前端调用变更
**用户端 (`public/app.js`)**:
```javascript
// 旧: /api/codes/verify
// 新: /api/codes?action=verify

// 旧: /api/tarot/start
// 新: /api/tarot?action=start

// 旧: /api/tarot/save-reading
// 新: /api/tarot?action=save

// 旧: /api/tarot/followup
// 新: /api/tarot?action=followup

// 旧: /api/tarot/angel
// 新: /api/tarot?action=angel
```

**管理端 (`public/admin/app.js` 和 `public/admin/index.html`)**:
```javascript
// 旧: /api/admin/auth/login
// 新: /api/admin-auth?action=login

// 旧: /api/admin/auth/me
// 新: /api/admin-auth?action=me

// 旧: /api/admin/codes/generate
// 新: /api/admin-codes?action=generate

// 旧: /api/admin/codes/list
// 新: /api/admin-codes?action=list

// 旧: /api/admin/codes/update
// 新: /api/admin-codes?action=update&id=xxx

// 旧: /api/admin/sessions/list
// 新: /api/admin-sessions?action=list

// 旧: /api/admin/sessions/detail
// 新: /api/admin-sessions?action=detail&id=xxx

// 旧: /api/admin/stats
// 新: /api/admin-stats
```

## 已删除的旧文件
- `api/codes/verify.js`
- `api/tarot/start.js`
- `api/tarot/save-reading.js`
- `api/tarot/followup.js`
- `api/tarot/angel.js`
- `api/tarot/history.js`
- `api/admin/auth/login.js`
- `api/admin/auth/me.js`
- `api/admin/codes/generate.js`
- `api/admin/codes/list.js`
- `api/admin/codes/update.js`
- `api/admin/sessions/list.js`
- `api/admin/sessions/detail.js`
- `api/admin/stats.js` (移动到 `api/admin-stats.js`)

## 测试清单
- [ ] 用户端兑换码验证
- [ ] 用户端占卜流程（开始、保存、追问、天使祝福）
- [ ] 管理员登录
- [ ] 管理员生成兑换码
- [ ] 管理员查看兑换码列表
- [ ] 管理员更新兑换码状态
- [ ] 管理员查看占卜记录列表
- [ ] 管理员查看占卜详情
- [ ] 管理员查看统计数据

## 优势
1. ✅ 符合 Vercel 免费版限制（9 < 12）
2. ✅ 保留所有功能
3. ✅ API 结构更清晰（按模块分组）
4. ✅ 便于未来扩展（每个模块内可以继续添加 action）
5. ✅ 降低冷启动成本（函数数量减少）

## 注意事项
- 所有前端调用已更新完成
- 旧 API 文件已删除，避免混淆
- 响应格式保持不变，向后兼容
- 错误处理统一在合并 API 中处理
