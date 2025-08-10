// index.js - 主页面
Page({
  data: {
    statusBarHeight: 0
  },
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  }
}); 