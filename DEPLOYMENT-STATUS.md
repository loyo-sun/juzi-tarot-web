# 部署状态更新

## ✅ 已完成：API 合并优化

### 问题
Vercel 免费版提示错误：
```
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan
```

原因：项目有 17 个 API 文件，超过免费版 12 个函数限制。

### 解决方案
✅ 将 17 个 API 合并为 **9 个函数**，使用 `action` 参数区分操作

### 变更内容

#### 1. 新 API 结构（9 个函数）
```
api/
├── codes.js              # 兑换码验证
├── tarot.js              # 塔罗占卜（合并 5 个）
├── admin-auth.js         # 管理员认证（合并 2 个）
├── admin-codes.js        # 兑换码管理（合并 3 个）
├── admin-sessions.js     # 占卜记录管理（合并 2 个）
├── admin-stats.js        # 统计数据
├── reading.js            # AI 解析
└── debug/
    ├── config-check.js   # 配置检查
    └── test-query.js     # 数据库测试
```

#### 2. 前端调用已全部更新
- ✅ `public/app.js` - 用户端（5 处更新）
- ✅ `public/admin/app.js` - 管理端主应用（7 处更新）
- ✅ `public/admin/index.html` - 管理员登录页（1 处更新）

#### 3. 旧文件已清理
删除了 13 个旧 API 文件，避免混淆和冗余。

### 代码已推送
- Commit: `e0c4bf6`
- 分支: `main`
- 仓库: https://github.com/loyo-sun/juzi-tarot-web

### 下一步
Vercel 将自动检测到推送并重新部署，预计 2-3 分钟完成。

## 测试清单

部署完成后，请测试以下功能：

### 用户端功能
- [ ] 兑换码验证（输入 JUZI-TEST-0001 等测试码）
- [ ] 开始占卜流程
- [ ] 抽取 3 张牌
- [ ] AI 解析显示
- [ ] 追问功能
- [ ] 天使祝福卡

### 管理端功能
- [ ] 管理员登录（qsun@vip.qq.com）
- [ ] 查看统计数据
- [ ] 生成兑换码（使用雪花算法）
- [ ] 查看兑换码列表
- [ ] 更新兑换码状态
- [ ] 查看占卜记录列表
- [ ] 查看占卜详情

### 访问地址
- 用户端：https://juzi.loyo.work
- 管理端：https://juzi.loyo.work/admin
- 调试页：https://juzi.loyo.work/debug.html

## 技术细节

### API 调用示例

**旧方式（已废弃）：**
```javascript
fetch('/api/tarot/start', { method: 'POST', ... })
```

**新方式：**
```javascript
fetch('/api/tarot?action=start', { method: 'POST', ... })
```

### 优势
1. ✅ 符合 Vercel 免费版限制（9 < 12）
2. ✅ 所有功能完整保留
3. ✅ API 结构更清晰（按模块分组）
4. ✅ 便于未来扩展
5. ✅ 降低冷启动成本

### 兼容性
- 响应格式完全不变
- 错误处理逻辑不变
- 数据库查询不变
- 前端体验不变

## 故障排查

如果部署后仍有问题，请检查：

1. **Vercel 部署日志**
   - 访问 https://vercel.com/loyo-sun/juzi-tarot-web
   - 查看最新部署的 Build Logs

2. **环境变量**
   - 确认 `SUPABASE_URL` 已设置
   - 确认 `SUPABASE_ANON_KEY` 已设置
   - 确认 `SUPABASE_SERVICE_ROLE_KEY` 已设置

3. **API 测试**
   - 访问 https://juzi.loyo.work/debug.html
   - 查看配置检查和数据库连接状态

4. **浏览器控制台**
   - 打开开发者工具（F12）
   - 查看 Console 和 Network 标签
   - 检查是否有 404 或 500 错误

## 文档
- [API 合并说明](./API-CONSOLIDATION.md)
- [部署指南](./DEPLOYMENT-GUIDE.md)
- [故障排查](./TROUBLESHOOTING.md)
