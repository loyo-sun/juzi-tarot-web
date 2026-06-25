# 橘子塔罗 Web 端

这是根据 `橘子塔罗需求文档.md` 生成的 Web 端第一版应用。

## 已实现

- Web 端一屏式塔罗牌桌布局
- 兑换码展示与本地更换
- 主问题输入
- 洗牌连接状态
- 抽三张牌
- 三牌阵展示：过去 / 根源、现在 / 状态、未来 / 建议
- AI 牌阵解析接口代理
- 继续追问
- 天使祝福
- 保存结果为 `.txt`
- 使用真实卡牌资源：`0` 为牌背，`1-78` 为塔罗牌

## AI API 环境变量

复制 `.env.example` 为 `.env`，并填写：

```bash
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=replace-with-your-api-key
AI_MODEL_NAME=gpt-4o-mini
```

字段说明：

- `AI_API_URL`：AI API 请求 URL
- `AI_API_KEY`：AI API Key
- `AI_MODEL_NAME`：模型名称

未配置时，`/api/reading` 会返回本地演示解析，方便先调 UI。

## 本地启动

```bash
npm run dev
```

默认地址：

```text
http://localhost:3024
```

## Vercel 部署

项目使用静态前端 + `api/reading.js` Serverless Function。部署到 Vercel 后，在项目环境变量中配置：

- `AI_API_URL`
- `AI_API_KEY`
- `AI_MODEL_NAME`

## 资源目录

- `public/cards/0.webp`：卡牌背面
- `public/cards/1.webp` 到 `public/cards/78.webp`：塔罗牌
- `public/cards/manifest.json`：卡牌序号和名称映射
- `public/assets/orange-cat-tarot.png`：橘猫主视觉

## 后续建议

- 接入 Supabase Auth 或匿名用户 ID
- 接入 Supabase 兑换码表
- 将本地次数模拟替换为真实兑换码核销
- 增加占卜记录存储
- 增加后台兑换码管理页
