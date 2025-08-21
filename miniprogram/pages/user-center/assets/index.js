Page({
  data: {
    // 数据列表
    assetList: [], // 资产数据
    
    // 加载状态
    assetLoading: false,
    
    // 错误状态
    assetError: false,
    
    // 错误信息
    assetErrorMsg: '',
    
    // 用户登录状态
    isLoggedIn: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  // 检查用户登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const isLoggedIn = !!(userInfo.openId);
    this.setData({
      isLoggedIn: isLoggedIn
    });
    return isLoggedIn;
  },

  // 跳转到登录页面
  gotoLogin() {
    wx.switchTab({
      url: '/pages/user-center/index'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    wx.stopPullDownRefresh();
  }
});
