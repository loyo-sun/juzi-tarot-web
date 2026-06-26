# 🎯 下一步行动清单

## ✅ 已完成（66% 进度）

### 阶段 1: 数据库和核心 API ✓
- [x] 创建 Supabase 项目
- [x] 设计数据库（4个核心表）
- [x] 兑换码验证 API
- [x] 开始占卜 API（扣除次数）
- [x] 保存解析 API
- [x] Supabase 客户端工具

### 阶段 2: 完整流程 ✓
- [x] 追问 API
- [x] 天使祝福 API
- [x] 历史记录查询 API
- [x] 7天自动清理函数
- [x] 前端完整集成
- [x] 完整文档（部署、API）

---

## ⏳ 待完成（立即开始）

### 🚀 立即行动（今天完成）

#### 步骤 1: 安装依赖
```bash
cd /Users/chingsun/Documents/juzi/juzi-tarot-web
npm install
```

#### 步骤 2: 配置 Supabase 数据库
1. 访问 https://supabase.com/dashboard
2. 进入 `juzitaluo` 项目
3. 点击 **SQL Editor** → **New Query**
4. 复制 `supabase/schema.sql` 的全部内容
5. 粘贴到编辑器，点击 **Run**

**验证成功**: 应该看到 4 个表创建成功的提示。

#### 步骤 3: 创建管理员账号
1. 在 Supabase 项目，点击 **Authentication** → **Users**
2. 点击 **Add User** → **Create new user**
3. 填写：
   - Email: `qsun@vip.qq.com`
   - Password: 设置一个强密码
   - Auto Confirm User: **勾选**
4. 点击 **Create user**

#### 步骤 4: 获取 Supabase API 密钥
1. 在 Supabase 项目，点击 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://xxxxxxxxx.supabase.co`
   - **anon / public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` ⚠️ 保密

#### 步骤 5: 配置 Vercel 环境变量
1. 访问 https://vercel.com/dashboard
2. 进入 `juzi-tarot-web` 项目
3. 点击 **Settings** → **Environment Variables**
4. 添加 3 个新变量（所有环境都选）：
   - `SUPABASE_URL` = 你的 Project URL
   - `SUPABASE_ANON_KEY` = 你的 anon key
   - `SUPABASE_SERVICE_KEY` = 你的 service_role key
5. 重新部署：**Deployments** → 最新部署 → **...** → **Redeploy**

#### 步骤 6: 测试完整流程
1. 访问你的 Vercel 网站
2. 输入测试兑换码：`JUZI-TEST-0001`
3. 完成一次占卜流程（提问 → 抽牌 → 解析 → 追问 → 天使祝福）
4. 在 Supabase 中验证数据：
   ```sql
   -- 查看兑换码状态
   SELECT * FROM redemption_codes WHERE code = 'JUZI-TEST-0001';
   
   -- 查看占卜记录
   SELECT * FROM tarot_sessions WHERE code = 'JUZI-TEST-0001';
   ```

---

## 📋 待开发功能（下一阶段）

### 阶段 3: 管理后台（预计1周）

#### 后端 API（7个）

1. **管理员登录**
   - 路径: `POST /api/admin/auth/login`
   - 输入: `{ email, password }`
   - 输出: `{ token, admin }`

2. **获取管理员信息**
   - 路径: `GET /api/admin/auth/me`
   - 需要: Authorization Token
   - 输出: `{ admin, permissions }`

3. **生成兑换码**
   - 路径: `POST /api/admin/codes/generate`
   - 输入: `{ count, question_limit, followup_limit, expires_days }`
   - 输出: `{ codes: [...] }`

4. **兑换码列表**
   - 路径: `GET /api/admin/codes?page=1&pageSize=20&status=active`
   - 输出: `{ codes: [...], total, page, pageSize }`

5. **更新兑换码**
   - 路径: `PATCH /api/admin/codes/:id`
   - 输入: `{ status?, expires_at?, note? }`
   - 输出: `{ success, code }`

6. **统计数据**
   - 路径: `GET /api/admin/stats`
   - 输出: `{ total_codes, active_codes, total_sessions, ... }`

7. **占卜记录列表**
   - 路径: `GET /api/admin/sessions?page=1&pageSize=20`
   - 输出: `{ sessions: [...], total }`

#### 前端页面（4个）

1. **登录页** (`public/admin/index.html`)
   - 邮箱密码登录
   - 记住登录状态（localStorage）

2. **仪表板** (`public/admin/dashboard.html`)
   - 统计卡片（总兑换码、活跃兑换码、占卜次数等）
   - 快速操作入口

3. **兑换码管理** (`public/admin/codes.html`)
   - 生成兑换码（批量）
   - 兑换码列表（分页、搜索、筛选）
   - 启用/禁用/备注

4. **占卜记录** (`public/admin/sessions.html`)
   - 记录列表（分页、搜索）
   - 查看详情（问题、解析、追问）

---

## 📚 文档资源

**已创建的文档**:
- ✅ `BACKEND-PLAN.md` - 后端开发完整计划
- ✅ `DEPLOYMENT-GUIDE.md` - 部署步骤和故障排查
- ✅ `API-REFERENCE.md` - API 接口详细文档
- ✅ `CHANGES.md` - 开发进度和更新日志
- ✅ `supabase/README.md` - Supabase 配置说明
- ✅ `DEPLOYMENT-CHECKLIST.md` - 部署检查清单

**阅读顺序**:
1. 先读 `DEPLOYMENT-GUIDE.md` - 了解如何部署
2. 再读 `API-REFERENCE.md` - 了解 API 使用
3. 参考 `BACKEND-PLAN.md` - 了解整体规划

---

## 🎯 本周目标

### 今天（2026-06-26）
- [ ] 安装依赖
- [ ] 配置 Supabase 数据库
- [ ] 创建管理员账号
- [ ] 配置 Vercel 环境变量
- [ ] 测试完整占卜流程

### 本周（第3周）
- [ ] 开发 7 个管理后台 API
- [ ] 创建管理后台页面
- [ ] 实现管理员登录
- [ ] 实现兑换码生成和管理
- [ ] 添加统计看板

### 预期成果
- 完整的前端 + 后端 + 管理后台系统
- 100% 功能完成
- 可以正式上线使用

---

## ⚡ 快速命令

### 开发相关
```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 检查代码
npm run check

# Git 操作
git add .
git commit -m "your message"
git push
```

### Supabase SQL 快捷命令
```sql
-- 查看统计数据
SELECT * FROM admin_stats;

-- 查看测试兑换码
SELECT * FROM redemption_codes WHERE code LIKE 'JUZI-TEST%';

-- 清理过期记录
SELECT cleanup_expired_sessions();

-- 查看今日占卜数
SELECT COUNT(*) FROM tarot_sessions 
WHERE created_at >= CURRENT_DATE;
```

### 测试 API（curl）
```bash
# 验证兑换码
curl -X POST https://你的域名/api/codes/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"JUZI-TEST-0001"}'

# 获取历史记录
curl "https://你的域名/api/tarot/history?code=JUZI-TEST-0001"
```

---

## 💡 提示和建议

1. **按顺序完成**: 先完成今天的任务，确保基础功能可用，再开发管理后台
2. **及时测试**: 每完成一个 API 就立即测试，不要积累问题
3. **查看日志**: 如果遇到问题，在 Vercel 的 Functions 中查看日志
4. **保护密钥**: `SUPABASE_SERVICE_KEY` 是敏感信息，不要泄露
5. **备份数据**: 在 Supabase 中定期导出数据作为备份

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看 `DEPLOYMENT-GUIDE.md` 的故障排查章节
2. 在 Supabase 的 SQL Editor 中查看数据
3. 在 Vercel 的 Functions 中查看日志
4. 检查环境变量是否正确配置

---

## 🎉 完成后的成果

完成所有步骤后，你将拥有：

✅ 一个完整的塔罗占卜 Web 应用
✅ 兑换码系统（验证、次数管理）
✅ AI 解析功能（主解析、追问、天使祝福）
✅ 7天数据保留（自动清理）
✅ 管理后台（兑换码生成、统计看板）
✅ 完整的文档和 API

**项目地址**: https://github.com/loyo-sun/juzi-tarot-web
**线上地址**: https://你的域名.vercel.app

---

祝部署顺利！🚀

最后更新：2026-06-26
