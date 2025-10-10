// pages/test-launch/index.js
Page({
  data: {
    isLoggedIn: false,
    hasRecentCreation: false,
    expectedRoute: ''
  },

  onLoad() {
    this.updateStatus();
  },

  onShow() {
    this.updateStatus();
  },

  // 更新当前状态显示
  updateStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = !!(userInfo && userInfo.openId);
    const hasRecentCreation = this.checkRecentCreation();
    
    let expectedRoute = '';
    if (!isLoggedIn) {
      expectedRoute = '工具页';
    } else if (hasRecentCreation) {
      expectedRoute = '个人中心';
    } else {
      expectedRoute = '工具页';
    }

    this.setData({
      isLoggedIn,
      hasRecentCreation,
      expectedRoute
    });
  },

  // 检查最近7天是否有创作记录（与启动页逻辑一致）
  checkRecentCreation() {
    const checkInRecords = wx.getStorageSync('checkInRecords') || {};
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      
      if (checkInRecords[dateStr] && checkInRecords[dateStr].create) {
        return true;
      }
    }
    
    return false;
  },

  // 模拟未登录状态
  simulateLogout() {
    wx.removeStorageSync('userInfo');
    wx.showToast({
      title: '已模拟退出登录',
      icon: 'success'
    });
    this.updateStatus();
  },

  // 模拟登录但无创作记录
  simulateLoginNoCreation() {
    // 设置登录状态
    const mockUserInfo = {
      openId: 'mock_openid_' + Date.now(),
      username: '测试用户',
      avatar: ''
    };
    wx.setStorageSync('userInfo', mockUserInfo);
    
    // 清空创作记录
    wx.removeStorageSync('checkInRecords');
    
    wx.showToast({
      title: '已模拟登录无创作',
      icon: 'success'
    });
    this.updateStatus();
  },

  // 模拟登录且有创作记录
  simulateLoginWithCreation() {
    // 设置登录状态
    const mockUserInfo = {
      openId: 'mock_openid_' + Date.now(),
      username: '测试用户',
      avatar: ''
    };
    wx.setStorageSync('userInfo', mockUserInfo);
    
    // 添加最近的创作记录
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const checkInRecords = {
      [today.toDateString()]: { login: true, create: true },
      [yesterday.toDateString()]: { login: true, create: true }
    };
    wx.setStorageSync('checkInRecords', checkInRecords);
    
    wx.showToast({
      title: '已模拟登录有创作',
      icon: 'success'
    });
    this.updateStatus();
  },

  // 测试启动页路由逻辑
  testLaunchLogic() {
    const userInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = !!(userInfo && userInfo.openId);
    const hasRecentCreation = this.checkRecentCreation();
    
    let targetPage = '';
    if (!isLoggedIn) {
      targetPage = '/pages/tools/index';
    } else if (hasRecentCreation) {
      targetPage = '/pages/user-center/index';
    } else {
      targetPage = '/pages/tools/index';
    }
    
    wx.showModal({
      title: '路由测试',
      content: `将跳转到: ${targetPage}`,
      confirmText: '确认跳转',
      confirmColor: '#F35A75',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.reLaunch({
            url: targetPage
          });
        }
      }
    });
  },

  // 前往启动页
  goToLaunchPage() {
    wx.reLaunch({
      url: '/pages/launch/index'
    });
  },

  // 清空所有数据
  clearAllData() {
    wx.showModal({
      title: '确认清空',
      content: '将清空所有用户数据和创作记录',
      confirmColor: '#F35A75',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('checkInRecords');
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
          this.updateStatus();
        }
      }
    });
  }
});
