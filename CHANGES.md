# 橘子塔罗 UI 修改说明

## 修改日期
2026-06-25

## 修改内容

### ✅ 问题 1: 兑换码输入与提问显示逻辑优化
**修改前:**
- 兑换码输入页面显示问题次数和追问次数
- 提问环节同时显示兑换码

**修改后:**
- ✅ 兑换码输入页面：仅显示兑换码输入框，不显示次数信息
- ✅ 提问及后续环节：顶部右侧显示"提问次数"和"追问次数"的配额面板
- 次数信息从 `step === "question"` 开始显示

### ✅ 问题 2: 单屏显示所有步骤
**修改前:**
- 使用多个 view 切换，每次只显示一个页面

**修改后:**
- ✅ 改为单页应用结构
- ✅ 所有步骤通过 `display: none/flex` 控制显示/隐藏
- ✅ 每个步骤独立为 `.step-section`，通过 `updateStep()` 函数切换
- ✅ 移除了原来的步骤指示器(stepper)，改为右上角的配额显示

### ✅ 问题 3: 提问输入框样式优化
**修改前:**
- 输入框较高(72px)
- 样式已经基本符合要求

**修改后:**
- ✅ 单行文本输入框 `<input>` 类型
- ✅ 字体大小：`clamp(20px, 2.5vw, 32px)` - 响应式大字体
- ✅ 完全居中显示
- ✅ 圆角胶囊形状 (border-radius: 999px)
- ✅ 高度优化为 64px
- ✅ 添加 focus 状态：金色边框 + 阴影效果

### ✅ 问题 4: 洗牌和切牌动画增强
**修改前:**
- 简单的浮动和切牌动画
- 动画效果较基础

**修改后:**
- ✅ **洗牌动画** (`shuffleRotate`):
  - 5张牌叠加旋转
  - 四个方向移动和旋转
  - 3秒循环动画，每张牌延迟0.6秒
  
- ✅ **切牌动画** (`cutLeft` 和 `cutRight`):
  - 左右两堆牌分离和合并
  - 更大的移动距离(180px vs 70px)
  - 动画更流畅，细节更丰富
  
- ✅ **能量光环** (`energyPulse`):
  - 两层光环脉动
  - 缩放和透明度变化
  - 营造神秘氛围

- ✅ **自动完成**: 洗牌动画播放3.5秒后自动进入抽牌环节

### ✅ 问题 5: 抽牌布局改为多行密集排列
**修改前:**
- 单层弧形排列
- 78张牌在一条弧线上

**修改后:**
- ✅ **三行排列**: 每行26张牌
- ✅ **密集布局**: 卡牌尺寸从74px降为64px
- ✅ **弧形保持**: 每行独立形成弧形
- ✅ **层次感**: 通过 `rowIndex * 85px` 实现垂直错开
- ✅ **hover效果**: 悬停时卡牌上浮12px + 金色光晕
- ✅ **选中效果**: 已选卡牌变暗(opacity: 0.3) + 下沉8px

## 技术实现细节

### HTML 结构变化
```html
<!-- 移除了 -->
<ol class="stepper">...</ol>

<!-- 新增了 -->
<div class="quota-display" id="quota-display">
  <div><span>提问次数</span><strong>2</strong></div>
  <div><span>追问次数</span><strong>3</strong></div>
</div>

<!-- 所有 section 改为统一结构 -->
<section class="step-section" id="step-xxx" data-step="xxx">
  <div class="step-content">...</div>
</section>
```

### JavaScript 核心变化
```javascript
// 状态管理
state.currentStep = "code"  // 当前步骤
state.questionLeft = 2      // 剩余提问次数
state.followLeft = 3        // 剩余追问次数

// 步骤切换函数
function updateStep(step) {
  // 隐藏所有步骤
  // 显示当前步骤
  // 更新配额显示
  // 洗牌自动完成逻辑
}

// 多行抽牌布局算法
const cardsPerRow = 26;
const rowIndex = Math.floor((index - 1) / cardsPerRow);
const colIndex = (index - 1) % cardsPerRow;
```

### CSS 关键变化
- 全局布局从 `grid` 改为 `flexbox`
- 移除 `.view` 和 `.stepper` 相关样式
- 新增 `.step-section` 和 `.step-content` 布局
- 新增 `.quota-display` 配额显示样式
- 优化 `.deck-card` 多行排列逻辑
- 增强动画效果的流畅度和视觉冲击力

## 文件修改列表
- ✅ `/public/index.html` - HTML 结构重构
- ✅ `/public/app.js` - JavaScript 逻辑重构
- ✅ `/public/styles.css` - CSS 完全重写

## 备份文件
- `/public/styles.css.backup` - 原始 CSS 备份

## 测试建议
1. 启动本地服务器: `npm run dev`
2. 访问 `http://localhost:3024`
3. 测试流程:
   - 输入兑换码 → 检查是否没有显示次数
   - 进入提问页 → 检查右上角是否显示配额
   - 提交问题 → 观察洗牌和切牌动画
   - 等待3.5秒 → 自动进入抽牌
   - 观察78张牌的三行排列
   - 抽取3张牌 → 检查交互效果

## 已知优化点
- 移动端响应式已适配 (< 980px, < 620px)
- 动画性能已优化 (使用 transform 而非 position)
- 无障碍支持保留 (aria-label)
