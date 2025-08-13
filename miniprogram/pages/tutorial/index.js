// tutorial.js
Page({
  data: {
    statusBarHeight: 0,
    navList: [
      { name: '关于编织', index: 0 },
      { name: '钩织', index: 1 },
      { name: '棒织', index: 2 },
      // 可以根据需要添加更多导航项
    ],
    currentSwiperIndex: 0
  },
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });

    // 加载初始数据
    // this.fetchIdeaList(); // 临时注释掉，等待AI灵感页面恢复
  },

  // 导航点击事件处理函数
  onNavClick(e) {
    const { index } = e.detail;
    this.setData({
      currentSwiperIndex: index
    });
  }
});