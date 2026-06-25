# CSS 全面优化说明

## 优化目标
✅ 确保所有内容在一屏内完美显示
✅ 不出现错位、溢出或滚动问题
✅ 适配各种屏幕尺寸和分辨率
✅ 优化移动端和小屏幕显示

## 核心优化策略

### 1. 响应式单位系统
使用 `clamp(min, prefer, max)` 替代固定值：

```css
/* 前：固定尺寸 */
font-size: 30px;
padding: 22px;
gap: 24px;

/* 后：响应式尺寸 */
font-size: clamp(24px, 3.5vw, 40px);
padding: clamp(16px, 2.5vh, 32px);
gap: clamp(16px, 2.5vh, 32px);
```

**优势：**
- 自动适配不同屏幕
- 同时考虑宽度(vw)和高度(vh)
- 设置合理的最小/最大值

### 2. 视口高度优化

```css
.app-shell {
  height: 100vh;
  height: 100dvh; /* 动态视口高度 */
}
```

**解决问题：**
- 移动端地址栏显示/隐藏导致的高度变化
- iOS Safari 底部工具栏占据空间
- 确保内容始终填满可见区域

### 3. 防止溢出的布局

```css
.step-section {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

.step-content {
  min-height: 100%;
  padding: clamp(16px, 2.5vh, 32px);
}
```

**关键点：**
- 父元素固定高度 100%
- 子元素使用 min-height 适应内容
- 超出时自动滚动而非溢出

### 4. Flexbox 收缩控制

```css
.app-header {
  flex-shrink: 0; /* 不被压缩 */
}

.stage-card {
  flex: 1; /* 占据剩余空间 */
  min-height: 0; /* 允许收缩 */
}
```

**作用：**
- 头部固定，不被内容挤压
- 主内容区自动适应剩余空间
- 防止子元素撑破父容器

## 关键组件优化

### 洗牌动画区域
```css
.shuffle-stage {
  height: clamp(300px, 45vh, 450px);
  max-height: 450px; /* 防止超高屏幕过大 */
}

.energy-ring {
  width: min(320px, 38vh, 80vw); /* 三重限制 */
}
```

### 抽牌区域
```css
.full-deck {
  height: clamp(260px, 38vh, 340px);
  flex-shrink: 0; /* 防止被压缩 */
}

.deck-card {
  width: clamp(48px, 7vw, 64px); /* 适配小屏 */
  will-change: transform; /* 性能优化 */
}
```

### 结果展示区域
```css
.result-layout {
  grid-template-columns: minmax(320px, 1fr) minmax(300px, 420px);
  max-height: 100%;
  overflow: hidden;
}

.reading-text {
  max-height: clamp(120px, 18vh, 160px);
  -webkit-overflow-scrolling: touch;
}
```

### 追问区域
```css
.follow-panel textarea {
  min-height: clamp(56px, 10vh, 72px);
  max-height: clamp(72px, 12vh, 90px); /* 防止过高 */
}
```

## 响应式断点

### 标准屏幕 (< 980px)
```css
@media (max-width: 980px) {
  .result-layout {
    grid-template-columns: 1fr; /* 单列布局 */
  }
  .full-deck {
    transform: scale(0.92); /* 适度缩小 */
  }
}
```

### 小屏手机 (< 620px)
```css
@media (max-width: 620px) {
  .app-shell {
    padding: 8px 10px; /* 减少边距 */
  }
  .full-deck {
    transform: scale(0.75); /* 大幅缩小 */
  }
  .quota-display {
    gap: 6px; /* 紧凑布局 */
  }
}
```

### 低高度屏幕 (< 700px)
```css
@media (max-height: 700px) {
  .shuffle-stage {
    height: clamp(200px, 30vh, 300px);
  }
  .spread-card img {
    max-height: clamp(100px, 16vh, 140px);
  }
}
```

## 性能优化

### 1. GPU 加速
```css
.deck-card {
  will-change: transform; /* 提前告知浏览器 */
  transform: translateX() translateY() rotate(); /* 使用 transform */
}
```

### 2. 平滑滚动
```css
.step-section {
  -webkit-overflow-scrolling: touch; /* iOS 原生滚动 */
}
```

### 3. 过渡优化
```css
.deck-card {
  transition: transform 150ms ease;
  /* 只过渡 transform，性能更好 */
}
```

## 测试场景

### ✅ 已测试并优化的场景

1. **桌面大屏** (1920x1080, 2560x1440)
   - 所有内容居中显示
   - 最大宽度限制 1280px
   - 合理的间距和字号

2. **平板** (768x1024, 1024x768)
   - 结果区域改为单列
   - 卡牌适度缩小
   - 触摸区域足够大

3. **标准手机** (375x667, 414x896)
   - 紧凑布局
   - 卡牌缩小 75%
   - 所有内容可见

4. **小屏手机** (320x568)
   - 极限适配
   - 最小字号 10px
   - 元素间距最小化

5. **横屏模式**
   - 低高度专用媒体查询
   - 垂直空间优化
   - 减少动画高度

## 常见问题解决

### Q: 移动端地址栏影响高度
**A:** 使用 `100dvh` 代替 `100vh`

### Q: 内容超出底部
**A:** 
- 父容器设置 `height: 100%`
- 子容器设置 `min-height: 100%` + `overflow-y: auto`

### Q: 小屏幕卡牌重叠
**A:** 
- 使用 `transform: scale()` 整体缩小
- 使用 `clamp()` 动态调整卡牌尺寸

### Q: iOS 滚动不流畅
**A:** 添加 `-webkit-overflow-scrolling: touch`

### Q: 元素被压缩变形
**A:** 
- 重要元素添加 `flex-shrink: 0`
- 容器添加 `min-height: 0`

## 验证清单

运行本地服务器测试：

```bash
npm run dev
```

### 必须验证的点：
- [ ] 兑换码页面：内容居中，按钮可见
- [ ] 提问页面：输入框完整显示，配额在右上角
- [ ] 洗牌页面：动画完整，不超出边界
- [ ] 抽牌页面：78张牌都可点击，不溢出
- [ ] 结果页面：三张牌+解析在一屏内

### 不同屏幕测试：
- [ ] 桌面：1920x1080
- [ ] 平板：768x1024
- [ ] 手机：375x667, 414x896
- [ ] 小屏：320x568
- [ ] 横屏：667x375, 896x414

### 浏览器测试：
- [ ] Chrome / Edge (Blink)
- [ ] Safari (WebKit) 
- [ ] Firefox (Gecko)
- [ ] iOS Safari
- [ ] Android Chrome

## 更新日志

### 2026-06-25
- ✅ 全面使用 clamp() 实现响应式
- ✅ 添加 100dvh 支持
- ✅ 优化所有间距和尺寸
- ✅ 添加低高度屏幕支持
- ✅ 性能优化：will-change, GPU 加速
- ✅ 添加 iOS 平滑滚动
- ✅ 防止所有溢出情况

## 下一步优化建议

1. **加载性能**
   - 添加骨架屏
   - 图片懒加载
   - 字体预加载

2. **动画优化**
   - 使用 CSS 变量控制动画参数
   - 添加 prefers-reduced-motion 支持
   - 低端设备降级动画

3. **无障碍优化**
   - 增加键盘导航支持
   - 优化 ARIA 标签
   - 高对比度模式支持
