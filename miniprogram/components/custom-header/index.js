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
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({
            delta: 1
          });
        } else {
          wx.switchTab({
            url: '/pages/tutorial/index'
          });
        }
      }
    }
  }
}); 