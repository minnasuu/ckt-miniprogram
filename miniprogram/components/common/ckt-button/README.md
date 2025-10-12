# CKTButton 组件

一个统一的按钮组件，用于替换工具页面中的所有下载按钮。

## 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| text | String | '按钮' | 按钮文本 |
| type | String | 'default' | 按钮类型：primary, default |
| disabled | Boolean | false | 是否禁用 |
| loading | Boolean | false | 是否显示加载状态 |
| loadingText | String | '加载中...' | 加载状态文本 |
| size | String | 'medium' | 按钮大小：small, medium, large |
| isDownload | Boolean | false | 是否显示为下载按钮样式 |
| customClass | String | '' | 自定义类名 |
| width | String | 'auto' | 按钮宽度：auto, full |

## 事件

| 事件名 | 说明 | 返回值 |
|--------|------|--------|
| tap | 按钮点击事件 | 事件对象 |

## 使用示例

### 基础用法
```xml
<ckt-button text="下载图片" type="primary" bind:tap="onDownload" />
```

### 下载按钮
```xml
<ckt-button 
  text="下载图片" 
  type="primary" 
  isDownload="{{true}}"
  disabled="{{!imageUrl}}"
  bind:tap="downloadColorCard" 
/>
```

### 加载状态
```xml
<ckt-button 
  text="下载图片" 
  type="primary" 
  loading="{{downloadLoading}}"
  loadingText="下载中..."
  bind:tap="onDownload" 
/>
```

### 工具按钮样式
```xml
<ckt-button 
  text="下载图片" 
  type="primary" 
  customClass="tool-button"
  disabled="{{isCanvasEmpty}}"
  bind:tap="downloadCanvas" 
/>
```

### 颜色卡片按钮样式
```xml
<ckt-button 
  text="下载图片" 
  type="primary" 
  customClass="color-card-btn"
  disabled="{{!imageUrl}}"
  bind:tap="downloadColorCard" 
/>
```

### 底部按钮样式
```xml
<ckt-button 
  text="下载图片" 
  type="primary" 
  customClass="bottom-button download"
  disabled="{{!pixelatedImageSrc}}"
  bind:tap="onDownload" 
/>
```

## 样式类

组件提供了以下样式类用于兼容现有样式：

- `tool-button`: 工具按钮样式
- `color-card-btn`: 颜色卡片按钮样式  
- `bottom-button`: 底部按钮样式
- `download`: 下载按钮特殊样式
- `full-width`: 全宽按钮
