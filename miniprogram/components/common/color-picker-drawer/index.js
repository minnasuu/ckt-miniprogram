// components/common/color-picker-drawer/index.js
Component({
  properties: {
    // 控制是否显示抽屉
    show: {
      type: Boolean,
      value: false
    },
    // 透传color-picker的属性
    value: {
      type: String,
      value: '#ffcbcb'
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 当前选择的颜色
    currentColor: '#ffcbcb'
  },

  lifetimes: {
    attached() {
      this.setData({
        currentColor: this.properties.value
      });
    }
  },

  observers: {
    'value': function(newValue) {
      this.setData({
        currentColor: newValue
      });
    }
  },

  methods: {
    // 阻止事件冒泡
    preventBubble() {
      return false;
    },

    // 关闭抽屉
    onClose() {
      this.triggerEvent('close');
    },

    // 取消选择
    onCancel() {
      this.triggerEvent('cancel');
    },

    // 确认选择
    onConfirm() {
      this.triggerEvent('confirm', { color: this.data.currentColor });
    },

    // 颜色变化事件（透传给父组件）
    onColorChange(e) {
      const { color } = e.detail;
      this.setData({
        currentColor: color
      });
      this.triggerEvent('change', { color });
    }
  }
});
