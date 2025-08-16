# 颜色选择器组件 (Color Picker)

一个功能完整的颜色选择器组件，支持触摸拖拽选择颜色、色相滑块、透明度滑块、HEX输入等功能。

## 功能特性

1. **颜色选择面板**: 支持触摸拖拽选择颜色，显示饱和度和亮度的二维选择器
2. **色相滑块**: 360度色相选择，显示完整的颜色光谱
3. **透明度滑块**: 0-100%透明度调节，带棋盘格背景
4. **当前颜色显示**: 实时预览当前选择的颜色
5. **HEX输入框**: 支持手动输入HEX颜色值
6. **响应式设计**: 支持移动端和桌面端显示

## 使用方法

### 1. 引入组件

在页面的 `index.json` 中引入组件：

```json
{
  "usingComponents": {
    "color-picker": "/miniprogram/components/common/color-picker/index"
  }
}
```

### 2. 在页面中使用

```xml
<color-picker 
  value="{{selectedColor}}"
  bindchange="onColorChange"
/>
```

### 3. 处理颜色变化事件

```javascript
Page({
  data: {
    selectedColor: '#ffcbcb'
  },

  onColorChange(e) {
    const { color } = e.detail;
    this.setData({
      selectedColor: color
    });
    console.log('选择的颜色:', color);
  }
});
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| value | String | '#ffcbcb' | 初始颜色值（HEX格式） |
| disabled | Boolean | false | 是否禁用组件 |

## 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| change | 颜色值变化时触发 | { color: string } - 新的颜色值 |

## 颜色格式

组件支持以下颜色格式：
- HEX: `#ffcbcb`
- HEX with Alpha: `#ffcbcbff`
- 短HEX: `#fcb`

## 样式定制

组件使用LESS编写，可以通过修改 `index.less` 文件来自定义样式：

- 颜色面板大小: 修改 `.color-panel-bg` 的 `width` 和 `height`
- 滑块样式: 修改 `.hue-slider` 和 `.opacity-slider` 相关样式
- 整体尺寸: 修改 `.color-picker` 的 `width` 和 `padding`

## 技术实现

- 使用HSL颜色空间进行颜色计算
- 支持触摸拖拽和滑块调节
- 实时颜色预览和更新
- 响应式布局设计

## 浏览器兼容性

- 微信小程序 2.0+
- 支持触摸事件和手势操作
- 响应式设计适配不同屏幕尺寸
