Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 按钮文本
    text: {
      type: String,
      value: '按钮'
    },
    // 按钮类型：primary, default
    type: {
      type: String,
      value: 'default'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 是否显示加载状态
    loading: {
      type: Boolean,
      value: false
    },
    // 加载状态文本
    loadingText: {
      type: String,
      value: '加载中...'
    },
    // 按钮大小：small, medium, large
    size: {
      type: String,
      value: 'medium'
    },
    // 自定义类名
    customClass: {
      type: String,
      value: ''
    },
    style: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 按钮点击事件
    onTap(e) {
      if (this.data.disabled || this.data.loading) {
        return;
      }
      
      // 触发父组件的点击事件
      this.triggerEvent('tap', {
        detail: e.detail,
        currentTarget: e.currentTarget,
        target: e.target
      });
    }
  }
})
