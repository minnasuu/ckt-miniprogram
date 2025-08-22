// pages/launch/index.js
Page({
  data: {
    
  },

  onLoad() {
    console.log('启动页面加载');
    // 延迟一点时间显示欢迎信息，然后执行路由逻辑
    setTimeout(() => {
      this.executeRouteLogic();
    }, 500);
  },

  // 执行路由逻辑
  executeRouteLogic() {
    // 检查用户登录状态
    const userInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = !!(userInfo && userInfo.openId);
    
    console.log('用户登录状态:', isLoggedIn);
    console.log('用户信息:', userInfo);

    if (!isLoggedIn) {
      // 未登录用户，跳转到教程页
      console.log('未登录用户，跳转到教程页');
      this.navigateToPage('/pages/tutorial/index');
      return;
    }

    // 已登录用户，检查最近7天是否有创作记录
    const hasRecentCreation = this.checkRecentCreation();
    console.log('最近7天是否有创作记录:', hasRecentCreation);
    
    if (hasRecentCreation) {
      // 有创作记录，跳转到个人中心
      console.log('有创作记录，跳转到个人中心');
      this.navigateToPage('/pages/user-center/index');
    } else {
      // 无创作记录，跳转到工具页
      console.log('无创作记录，跳转到工具页');
      this.navigateToPage('/pages/tools/index');
    }
  },

  // 检查最近7天是否有创作记录
  checkRecentCreation() {
    const checkInRecords = wx.getStorageSync('checkInRecords') || {};
    const today = new Date();
    
    // 检查最近7天
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      
      // 如果这一天有创作记录，返回true
      if (checkInRecords[dateStr] && checkInRecords[dateStr].create) {
        return true;
      }
    }
    
    return false;
  },

  // 页面跳转
  navigateToPage(url) {
    wx.reLaunch({
      url: url,
      fail: (error) => {
        console.error('页面跳转失败:', error);
        // 如果跳转失败，默认跳转到工具页
        wx.reLaunch({
          url: '/pages/tools/index'
        });
      }
    });
  }
});
