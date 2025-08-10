Component({
  properties: {
    currentNav: {
      type: Number|String,
      value: 0,
      observer: function(newVal, oldVal) {
        // 当外部属性变化时，更新组件内部状态
        if (newVal !== oldVal) {
          console.log('导航索引更新:', newVal);
        }
      }
    },
    navList: {
      type: Array,
      value: []
    }
  },
  data: {
    // navList 已移至 properties
  },
  methods: {
    onNavChange(e) {
      const { index,type } = e.currentTarget.dataset;
      
      // 如果点击的是当前选中项，不做处理
      if (this.properties.currentNav === index||this.properties.currentNav===type) {
        return;
      }
      // 触发事件，通知页面更新当前索引
      this.triggerEvent('navChange', { index,type });
    }
  }
});