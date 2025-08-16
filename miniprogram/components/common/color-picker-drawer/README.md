# Color Picker Drawer 组件

基于 `color-picker` 组件创建的抽屉式颜色选择器组件。

## 功能特性

- 抽屉式弹出设计，用户体验更友好
- 完全透传 `color-picker` 组件的属性和事件
- 支持关闭、取消、确定三种操作
- 响应式设计，适配不同屏幕尺寸

## 使用方法

### 1. 在页面中引入组件

```json
{
  "usingComponents": {
    "color-picker-drawer": "/components/common/color-picker-drawer/index"
  }
}
```

### 2. 在页面中使用组件

```xml
<color-picker-drawer 
  show="{{showColorPicker}}"
  value="{{selectedColor}}"
  disabled="{{false}}"
  bindclose="onColorPickerClose"
  bindcancel="onColorPickerCancel"
  bindconfirm="onColorPickerConfirm"
  bindchange="onColorChange"
/>
```

### 3. 在页面逻辑中控制

```javascript
Page({
  data: {
    showColorPicker: false,
    selectedColor: '#ffcbcb'
  },

  // 显示颜色选择器
  showColorPicker() {
    this.setData({
      showColorPicker: true
    });
  },

  // 关闭颜色选择器
  onColorPickerClose() {
    this.setData({
      showColorPicker: false
    });
  },

  // 取消选择
  onColorPickerCancel() {
    this.setData({
      showColorPicker: false
    });
  },

  // 确认选择
  onColorPickerConfirm(e) {
    const { color } = e.detail;
    this.setData({
      selectedColor: color,
      showColorPicker: false
    });
    console.log('选择的颜色:', color);
  },

  // 颜色变化事件
  onColorChange(e) {
    const { color } = e.detail;
    console.log('颜色变化:', color);
  }
});
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| show | Boolean | false | 控制抽屉是否显示 |
| value | String | '#ffcbcb' | 当前选中的颜色值 |
| disabled | Boolean | false | 是否禁用颜色选择器 |

## 事件说明

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| close | 点击遮罩层或关闭按钮时触发 | 无 |
| cancel | 点击取消按钮时触发 | 无 |
| confirm | 点击确定按钮时触发 | { color: string } |
| change | 颜色值变化时触发 | { color: string } |

## 样式定制

组件使用 `styleIsolation: "isolated"` 进行样式隔离，可以通过以下方式定制样式：

1. 在页面中覆盖组件样式
2. 修改组件的 `index.wxss` 文件
3. 使用 CSS 变量进行主题定制

## 注意事项

1. 组件依赖 `color-picker` 组件，确保该组件已正确引入
2. 抽屉的高度会根据内容自动调整，最大高度为屏幕高度的90%
3. 在移动端使用时，建议设置合适的 `max-height` 值
4. 组件会自动处理触摸事件，防止误触关闭
