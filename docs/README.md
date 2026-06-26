# 📚 橘子塔塔文档中心

本目录包含项目的扩展文档、脚本和归档内容。

---

## 📂 目录结构

```
docs/
├── README.md           # 本文件
├── archive/            # 归档文档（历史开发记录）
└── scripts/            # 测试和工具脚本
```

---

## 🗂️ 内容导航

### 📜 归档文档 (`archive/`)

包含项目开发过程中的历史文档：

- **开发计划**：`BACKEND-PLAN.md`, `MY-DEVELOPMENT-PLAN.md`
- **部署记录**：`DEPLOYMENT-SUCCESS.md`, `VERCEL-ENV-FIX.md`, `API-CONSOLIDATION.md`
- **优化记录**：`CSS-OPTIMIZATION.md`, `CHANGES.md`
- **用户指南**：`ADMIN-USER-GUIDE.md`

👉 查看完整列表：[archive/README.md](./archive/README.md)

### 🛠️ 脚本工具 (`scripts/`)

- **`test-admin.sh`** - 管理员登录和统计 API 自动化测试脚本

**使用方法**：
```bash
cd docs/scripts
./test-admin.sh
```

---

## 📖 主要文档（项目根目录）

核心文档位于项目根目录，快速访问：

| 文档 | 描述 | 链接 |
|------|------|------|
| **README** | 项目主文档 | [../README.md](../README.md) |
| **部署指南** | 完整的部署流程 | [../DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md) |
| **API 参考** | 所有 API 接口说明 | [../API-REFERENCE.md](../API-REFERENCE.md) |
| **故障排查** | 常见问题解决 | [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md) |

---

## 🔍 快速查找

### 我想了解...

- **如何部署项目？** → [../DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md)
- **API 接口怎么用？** → [../API-REFERENCE.md](../API-REFERENCE.md)
- **遇到问题怎么办？** → [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **项目是如何开发的？** → [archive/](./archive/)
- **如何测试管理后台？** → [scripts/test-admin.sh](./scripts/test-admin.sh)

---

## 📌 文档规范

### 归档规则

以下类型的文档应归档到 `archive/` 目录：

1. ✅ 已完成的开发计划和任务清单
2. ✅ 历史部署记录和修复记录
3. ✅ 已完成的优化和变更记录
4. ✅ 过时的指南和说明文档

### 保留规则

以下文档应保留在项目根目录：

1. ✅ README.md（项目主文档）
2. ✅ 部署指南（持续有效）
3. ✅ API 参考（持续更新）
4. ✅ 故障排查（持续有效）

---

**最后更新**：2026-06-26
