Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: false
    },
    background:{
      type: String,
      value: 'white'
    },
    showBorder: {
      type: Boolean,
      value: false,
    },
    customBackHandler: {
      type: Boolean,
      value: false
    }
  },
  data: {
    statusBarHeight: 0
  },
  lifetimes: {
    attached() {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight
      });
    }
  },
  methods: {
    onBack() {
      if (this.properties.showBack) {
        // 如果启用了自定义返回处理
        if (this.properties.customBackHandler) {
          // 触发自定义返回事件
          this.triggerEvent('customBack');
          return;
        }

        // 默认返回行为
        // const pages = getCurrentPages();
        // if (pages.length > 1) {
          wx.navigateBack({
            delta: 1
          });
        // } else {
        //   wx.switchTab({
        //     url: '/pages/tutorial/index'
        //   });
        // }
      }
    }
  }
}); 