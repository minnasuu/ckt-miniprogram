// pages/test-launch/index.js
Page({
  data: {
    isLoggedIn: false,
    hasRecentCreation: false,
    expectedRoute: '',
    testResult: ''
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

  // 测试新登录功能（获取真实头像昵称）
  async testNewLogin() {
    try {
      wx.showLoading({
        title: '测试登录中...'
      });

      const LoginUtils = require('../../utils/loginUtils');
      const result = await LoginUtils.performLogin({
        onLoginStart: () => {
          console.log('开始登录测试...');
        },
        onLoginSuccess: (userInfo) => {
          console.log('登录成功，用户信息:', userInfo);
          wx.hideLoading();
          wx.showModal({
            title: '登录测试成功',
            content: `用户名: ${userInfo.username}\n头像: ${userInfo.avatar ? '已获取' : '未获取'}`,
            showCancel: false,
            confirmText: '确定'
          });
          this.updateStatus();
        },
        onLoginFail: (error) => {
          console.error('登录测试失败:', error);
          wx.hideLoading();
          wx.showModal({
            title: '登录测试失败',
            content: error.message || '未知错误',
            showCancel: false,
            confirmText: '确定'
          });
        }
      });

      if (!result.success) {
        wx.hideLoading();
        wx.showModal({
          title: '登录测试失败',
          content: result.error?.message || '未知错误',
          showCancel: false,
          confirmText: '确定'
        });
      }
    } catch (error) {
      console.error('测试登录异常:', error);
      wx.hideLoading();
      wx.showModal({
        title: '测试异常',
        content: error.message || '未知错误',
        showCancel: false,
        confirmText: '确定'
      });
    }
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
  },

  // 测试用户管理云函数
  async testUserManagement() {
    try {
      wx.showLoading({ title: '测试用户管理云函数...' });

      const result = await wx.cloud.callFunction({
        name: 'userManagement',
        data: {
          action: 'getUserList'
        }
      });

      wx.hideLoading();

      console.log('用户管理云函数测试结果:', result);

      let content = '';
      if (result.result && result.result.success) {
        const userCount = result.result.data ? result.result.data.length : 0;
        content = `用户管理云函数调用成功！\n找到 ${userCount} 个用户`;
        this.setData({
          testResult: `成功：找到 ${userCount} 个用户`
        });
      } else {
        content = `用户管理云函数调用失败：\n${result.result?.message || '未知错误'}`;
        this.setData({
          testResult: `失败：${result.result?.message || '未知错误'}`
        });
      }

      wx.showModal({
        title: '用户管理云函数测试',
        content: content,
        showCancel: false
      });
    } catch (error) {
      wx.hideLoading();
      console.error('用户管理云函数测试失败:', error);

      this.setData({
        testResult: `错误：${error.message}`
      });

      wx.showModal({
        title: '用户管理云函数测试失败',
        content: error.message || '网络错误',
        showCancel: false
      });
    }
  },

  // 创建测试用户
  async createTestUsers() {
    try {
      wx.showLoading({ title: '创建测试用户...' });

      const result = await wx.cloud.callFunction({
        name: 'userManagement',
        data: {
          action: 'createTestUser'
        }
      });

      wx.hideLoading();

      console.log('创建测试用户结果:', result);

      let content = '';
      if (result.result && result.result.success) {
        const results = result.result.data || [];
        const successCount = results.filter(r => r.success).length;
        content = `测试用户创建完成！\n成功创建 ${successCount} 个用户`;
        this.setData({
          testResult: `成功：创建了 ${successCount} 个测试用户`
        });
      } else {
        content = `创建测试用户失败：\n${result.result?.message || '未知错误'}`;
        this.setData({
          testResult: `失败：${result.result?.message || '未知错误'}`
        });
      }

      wx.showModal({
        title: '创建测试用户',
        content: content,
        showCancel: false
      });
    } catch (error) {
      wx.hideLoading();
      console.error('创建测试用户失败:', error);

      this.setData({
        testResult: `错误：${error.message}`
      });

      wx.showModal({
        title: '创建测试用户失败',
        content: error.message || '网络错误',
        showCancel: false
      });
    }
  },

  // 测试云函数连接
  async testConnection() {
    try {
      wx.showLoading({ title: '测试连接...' });

      const result = await wx.cloud.callFunction({
        name: 'userManagement',
        data: {
          action: 'testConnection'
        }
      });

      wx.hideLoading();

      console.log('连接测试结果:', result);

      let content = '';
      if (result.result && result.result.success) {
        content = `云函数连接正常！\n时间：${result.result.data.timestamp}`;
        this.setData({
          testResult: `成功：云函数连接正常`
        });
      } else {
        content = `连接测试失败：\n${result.result?.message || '未知错误'}`;
        this.setData({
          testResult: `失败：${result.result?.message || '未知错误'}`
        });
      }

      wx.showModal({
        title: '连接测试',
        content: content,
        showCancel: false
      });
    } catch (error) {
      wx.hideLoading();
      console.error('连接测试失败:', error);

      this.setData({
        testResult: `错误：${error.message}`
      });

      wx.showModal({
        title: '连接测试失败',
        content: error.message || '网络错误',
        showCancel: false
      });
    }
  }
});
