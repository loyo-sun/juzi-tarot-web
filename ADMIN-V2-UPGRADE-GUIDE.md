# 🔄 管理后台 V2 升级指南

**版本**: V2.0  
**更新时间**: 2026-06-26  
**UI 框架**: Element Plus

---

## 📋 更新概述

### 🎨 UI 升级
- ✅ 采用 Element Plus UI 框架
- ✅ 现代化的界面设计
- ✅ 更好的交互体验
- ✅ 响应式布局

### 🏗️ 功能重构

#### 1. 兑换码管理（一级菜单）
**二级菜单：**
- **创建兑换码** - 批量生成兑换码
  - 生成数量（默认 1，必填）
  - 提问次数（默认 1，必填）
  - 追问次数（默认 10，必填）
  - 有效期（可选永久有效，默认永久）
  - 备注（选填）
  
- **兑换码管理** - 查看和管理兑换码
  - 支持筛选：兑换码、激活状态、使用状态、过期时间、备注
  - **激活状态**：启用/停用（新增）
  - **使用状态**：未使用/使用中/已使用（新增）
  - **操作**：启用/禁用兑换码

#### 2. 占卜记录（一级菜单）
- 查看所有占卜记录
- **详情页**（新增）：
  - 显示完整问题
  - 显示卡牌图片（非纯文字）
  - 显示AI解析
  - 显示追问记录
  - 显示天使祝福

---

## 🗄️ 数据库变更

### 必须执行的 SQL 迁移

**文件位置**: `supabase/migration-v2.sql`

**变更内容**:

1. **添加 `is_active` 字段**（激活状态）
   ```sql
   ALTER TABLE redemption_codes 
   ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
   ```

2. **添加 `usage_status` 字段**（使用状态）
   ```sql
   ALTER TABLE redemption_codes 
   ADD COLUMN IF NOT EXISTS usage_status VARCHAR(20) DEFAULT 'unused';
   ```

3. **迁移现有数据**
   ```sql
   UPDATE redemption_codes
   SET 
     is_active = CASE 
       WHEN status = 'disabled' THEN false
       ELSE true
     END,
     usage_status = CASE
       WHEN question_used = 0 THEN 'unused'
       WHEN question_used >= question_limit THEN 'used'
       ELSE 'in_use'
     END;
   ```

4. **创建自动更新触发器**
   - 当 `question_used` 更新时，自动计算 `usage_status`

5. **添加索引**
   ```sql
   CREATE INDEX idx_redemption_codes_is_active ON redemption_codes(is_active);
   CREATE INDEX idx_redemption_codes_usage_status ON redemption_codes(usage_status);
   ```

---

## 🚀 部署步骤

### 第一步：数据库迁移

1. 登录 Supabase 控制台
   - 访问：https://supabase.com/dashboard
   - 进入你的项目：`juzitaluo`

2. 打开 SQL Editor
   - 左侧菜单点击 "SQL Editor"

3. 执行迁移脚本
   - 复制 `supabase/migration-v2.sql` 的全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 执行

4. 验证结果
   - 查看输出，确保没有错误
   - 执行验证查询（脚本中包含）

### 第二步：代码部署

代码已更新，推送到 GitHub 后 Vercel 会自动部署。

**新增文件**:
- `public/admin-v2/index.html` - 主页面
- `public/admin-v2/login.html` - 登录页
- `public/admin-v2/app.js` - 应用逻辑
- `supabase/migration-v2.sql` - 数据库迁移脚本

**更新文件**:
- `api/admin-codes.js` - 支持新字段

### 第三步：访问新后台

**登录地址**: https://juzi.loyo.work/admin-v2/login.html

**默认账号**:
- 邮箱：qsun@vip.qq.com
- 密码：（你设置的密码）

---

## 📊 字段对照表

### `redemption_codes` 表

| 旧字段 | 新字段 | 说明 | 值域 |
|--------|--------|------|------|
| `status` | 保留 | 原状态字段 | active, expired, disabled |
| - | `is_active` | 激活状态（新增） | true=启用, false=停用 |
| - | `usage_status` | 使用状态（新增） | unused, in_use, used |

### 状态逻辑

**激活状态 (`is_active`)**:
- `true` (启用) - 兑换码可以正常使用
- `false` (停用) - 兑换码被管理员禁用

**使用状态 (`usage_status`)**:
- `unused` (未使用) - `question_used = 0`
- `in_use` (使用中) - `0 < question_used < question_limit`
- `used` (已使用) - `question_used >= question_limit`

**旧状态 (`status`)** 仍然保留，用于向后兼容：
- `active` - 正常激活
- `expired` - 已过期
- `disabled` - 已禁用

---

## 🔄 迁移逻辑

### 旧数据迁移规则

| 旧 status | 新 is_active | 新 usage_status |
|-----------|--------------|-----------------|
| active | true | 根据使用情况自动判断 |
| disabled | false | 根据使用情况自动判断 |
| expired | true | 根据使用情况自动判断 |

### 自动更新规则

触发器会自动更新 `usage_status`：
- 当 `question_used` 或 `question_limit` 更新时
- 根据使用次数自动计算状态

---

## 🧪 测试清单

### 数据库测试

- [ ] 执行迁移脚本无错误
- [ ] 新字段已创建（`is_active`, `usage_status`）
- [ ] 现有数据已正确迁移
- [ ] 索引已创建
- [ ] 触发器正常工作

### 功能测试

#### 创建兑换码
- [ ] 设置生成数量（1-100）
- [ ] 设置提问次数（必填）
- [ ] 设置追问次数（默认10）
- [ ] 选择永久有效
- [ ] 选择自定义天数
- [ ] 填写备注
- [ ] 生成成功并显示结果
- [ ] 复制兑换码功能
- [ ] 导出文本功能

#### 兑换码管理
- [ ] 按兑换码搜索
- [ ] 按激活状态筛选（启用/停用）
- [ ] 按使用状态筛选（未使用/使用中/已使用）
- [ ] 按过期时间筛选
- [ ] 按备注搜索
- [ ] 启用兑换码
- [ ] 停用兑换码
- [ ] 分页功能正常

#### 占卜记录
- [ ] 查看记录列表
- [ ] 按兑换码搜索
- [ ] 按日期筛选
- [ ] 点击查看详情
- [ ] 详情页显示问题
- [ ] 详情页显示卡牌图片
- [ ] 详情页显示AI解析
- [ ] 详情页显示追问记录
- [ ] 详情页显示天使祝福
- [ ] 分页功能正常

#### 基础功能
- [ ] 登录功能正常
- [ ] 退出登录正常
- [ ] 菜单切换正常
- [ ] 响应式布局正常
- [ ] 所有图标正常显示

---

## 🔧 API 更新

### 新增查询参数

**`GET /api/admin-codes?action=list`**:
- 新增 `is_active`: true/false（激活状态筛选）
- 新增 `usage_status`: unused/in_use/used（使用状态筛选）

**`PATCH /api/admin-codes?action=update&id=xxx`**:
- 新增支持更新 `is_active` 字段

### 响应数据变化

**兑换码列表返回**:
```json
{
  "id": "uuid",
  "code": "JUZI-XXXX-XXXX",
  "is_active": true,           // 新增
  "usage_status": "in_use",    // 新增
  "status": "active",          // 保留
  "question_used": 2,
  "question_limit": 5,
  ...
}
```

---

## ⚠️ 注意事项

### 向后兼容

1. **旧字段保留**
   - `status` 字段仍然保留
   - 旧的 API 仍然可用
   - 旧管理后台（`/admin`）仍可访问

2. **渐进式升级**
   - 可以同时运行新旧管理后台
   - 数据完全兼容
   - 无需停机维护

### 数据一致性

1. **触发器保证**
   - `usage_status` 由触发器自动维护
   - 无需手动更新

2. **状态同步**
   - `is_active` 和 `status` 需要保持一致
   - 建议通过新后台管理

---

## 🐛 故障排查

### 数据库迁移失败

**问题**: 执行 SQL 时报错  
**解决**: 
1. 检查是否有语法错误
2. 确认字段不存在时才会添加
3. 查看错误日志定位问题

### 新字段不显示

**问题**: 列表中不显示新状态  
**解决**:
1. 确认数据库迁移成功
2. 清除浏览器缓存
3. 检查 API 响应数据

### 卡牌图片不显示

**问题**: 详情页卡牌图片加载失败  
**解决**:
1. 检查图片路径：`/cards/{index}.webp`
2. 确认 cards 目录存在
3. 检查图片文件完整性

### 登录失败

**问题**: 无法登录新后台  
**解决**:
1. 确认使用正确的邮箱密码
2. 检查 Vercel 环境变量
3. 查看浏览器控制台错误

---

## 📞 技术支持

遇到问题？

1. 查看 [故障排查指南](./TROUBLESHOOTING.md)
2. 查看 [API 文档](./API-REFERENCE.md)
3. 提交 [GitHub Issue](https://github.com/loyo-sun/juzi-tarot-web/issues)

---

## ✅ 升级检查表

部署前确认：

- [ ] 已阅读本文档
- [ ] 已备份数据库
- [ ] 已准备迁移脚本
- [ ] 已测试登录账号

部署中：

- [ ] 执行数据库迁移
- [ ] 验证迁移结果
- [ ] 推送代码到 GitHub
- [ ] 等待 Vercel 部署完成

部署后：

- [ ] 测试登录
- [ ] 测试创建兑换码
- [ ] 测试兑换码管理
- [ ] 测试占卜记录查看
- [ ] 验证所有功能正常

---

**升级完成！享受全新的管理后台体验！** 🎉
