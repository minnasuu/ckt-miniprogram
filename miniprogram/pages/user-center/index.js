const { envList } = require('../../envList');
const app = getApp();

// pages/me/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 0,
    openId: '',
    showTip: false,
    title: '',
    content: '',
    userInfo: null,
    isLoggingIn: false,
    showDialog: false,
    tempAvatar: '',
    tempUsername: '',
    isConfirming: false, // 新增加载状态
    imageNum: 0,
    documentNum: 0,
    assetNum: 0,
    favoriteNum: 0,
    // 打卡数据面板相关
    showCheckInPanel: false,
    weeklyData: [],
    checkInStreak: 0,
    totalCheckIns: 0,
    feedbackMessage: '',
    feedbackType: 'normal' // normal, good, excellent
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
    // 检查是否已登录
    this.checkLoginStatus();
    // 初始化打卡数据
    this.initCheckInData();
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({ userInfo });
      }
    } catch (error) {
      console.error('检查登录状态失败：', error);
    }
  },

  // 处理登录
  async handleLogin() {
    if (this.data.userInfo) {
      this.setData({
        showDialog: true,
        tempAvatar: this.data.userInfo.avatar,
        tempUsername: this.data.userInfo.username
      });
      return;
    }

    try {
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });

      this.setData({ isLoggingIn: true });

      const { code } = await wx.login();

      await new Promise(resolve => setTimeout(resolve, 1500));

      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code,
          userInfo: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }
        }
      });

      if (result.success) {
        // 清除旧的缓存
        wx.removeStorageSync('userInfo');
        // 保存最新的用户信息到缓存
        wx.setStorageSync('userInfo', result.userInfo);
        this.setData({
          userInfo: result.userInfo,
          isLoggingIn: false
        });
        // 登录成功后显示打卡面板
        this.showCheckInPanelWithDelay();
        // 记录登录打卡
        this.recordCheckIn('login');

        wx.showToast({
          title: '登录成功',
          icon: 'none'
        });
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败：', error);
      this.setData({ isLoggingIn: false });
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          tempAvatar: tempFilePath
        });
      }
    });
  },

  // 用户名输入
  onUsernameInput(e) {
    this.setData({
      tempUsername: e.detail.value
    });
  },

  // 取消编辑
  cancelEdit() {
    this.setData({
      showDialog: false,
      tempAvatar: '',
      tempUsername: ''
    });
  },

  // 确认编辑
  confirmEdit() {
    if (this.data.isConfirming) return; // 如果正在加载，直接返回

    this.setData({
      isConfirming: true
    });

    const { tempAvatar, tempUsername } = this.data;
    const newUserInfo = {
      ...this.data.userInfo,
      avatar: tempAvatar || this.data.userInfo.avatar,
      username: tempUsername || this.data.userInfo.username
    };

    // 调用云函数更新用户信息
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userInfo: newUserInfo
      },
      success: () => {
        this.setData({
          userInfo: newUserInfo,
          showDialog: false,
          tempAvatar: '',
          tempUsername: '',
          isConfirming: false
        });
        wx.showToast({
          title: '更新成功',
          icon: 'none'
        });
      },
      fail: (err) => {
        console.error('更新用户信息失败', err);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
        this.setData({
          isConfirming: false
        });
      }
    });
  },

  getOpenId() {
    wx.showLoading({
      title: '',
    });
    wx.cloud
      .callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getOpenId',
        },
      })
      .then((resp) => {
        this.setData({
          haveGetOpenId: true,
          openId: resp.result.openid,
        });
        wx.hideLoading();
      })
      .catch((e) => {
        wx.hideLoading();
        const { errCode, errMsg } = e
        if (errMsg.includes('Environment not found')) {
          this.setData({
            showTip: true,
            title: "云开发环境未找到",
            content: "如果已经开通云开发，请检查环境ID与 `miniprogram/app.js` 中的 `env` 参数是否一致。"
          });
          return
        }
        if (errMsg.includes('FunctionName parameter could not be found')) {
          this.setData({
            showTip: true,
            title: "请上传云函数",
            content: "在'cloudfunctions/quickstartFunctions'目录右键，选择【上传并部署-云端安装依赖】，等待云函数上传完成后重试。"
          });
          return
        }
      });
  },

  gotoWxCodePage() {
    wx.navigateTo({
      url: `/pages/exampleDetail/index?envId=${envList?.[0]?.envId}&type=getMiniProgramCode`,
    });
  },

  // 功能按钮点击
  onFunctionTap(e) {
    const type = e.currentTarget.dataset.type;
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    switch (type) {
      case 'images':
        wx.navigateTo({
          url: '/pages/user-center/images/index'
        });
        break;
      case 'documents':
        wx.navigateTo({
          url: '/pages/user-center/documents/index'
        });
        break;
      case 'assets':
        wx.navigateTo({
          url: '/pages/user-center/assets/index'
        });
        break;
      case 'favorite':
        wx.navigateTo({
          url: '/pages/user-center/favorite/index'
        });
        break;
    }
  },
  // 显示退出登录确认弹窗
  showLogoutConfirm() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确定，执行退出登录操作
          this.logout();
        } else if (res.cancel) {
          console.log('用户点击取消');
        }
      }
    });
  },

  // 执行退出登录操作
  logout() {
    // 清除本地缓存中的用户信息
    wx.removeStorageSync('userInfo');
    // 更新页面数据
    this.setData({
      userInfo: null,
      showCheckInPanel: false
    });
    wx.showToast({
      title: '退出登录成功',
      icon: 'none'
    });
  },

  // 初始化打卡数据
  initCheckInData() {
    const weeklyData = this.generateWeeklyData();
    const checkInStreak = this.calculateStreak(weeklyData);
    const totalCheckIns = this.calculateTotalCheckIns(weeklyData);
    const feedbackData = this.generateFeedback(checkInStreak, totalCheckIns);
    
    this.setData({
      weeklyData,
      checkInStreak,
      totalCheckIns,
      feedbackMessage: feedbackData.message,
      feedbackType: feedbackData.type
    });
  },

  // 生成近一周数据
  generateWeeklyData() {
    const today = new Date();
    const weekData = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    // 获取存储的打卡记录
    const checkInRecords = wx.getStorageSync('checkInRecords') || {};
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      
      weekData.push({
        date: dateStr,
        day: weekdays[date.getDay()],
        dayNum: date.getDate(),
        hasLogin: checkInRecords[dateStr]?.login || false,
        hasCreate: checkInRecords[dateStr]?.create || false,
        isToday: i === 0
      });
    }
    
    return weekData;
  },

  // 计算连续打卡天数
  calculateStreak(weeklyData) {
    let streak = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      const day = weeklyData[i];
      if (day.hasLogin || day.hasCreate) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  // 计算总打卡次数
  calculateTotalCheckIns(weeklyData) {
    return weeklyData.reduce((total, day) => {
      return total + (day.hasLogin ? 1 : 0) + (day.hasCreate ? 1 : 0);
    }, 0);
  },

  // 生成反馈信息
  generateFeedback(streak, total) {
    if (streak >= 7) {
      return {
        message: `太棒了！你已经连续打卡${streak}天，坚持就是胜利！`,
        type: 'excellent'
      };
    } else if (streak >= 3) {
      return {
        message: `不错哦！连续${streak}天打卡，继续保持！`,
        type: 'good'
      };
    } else if (total > 0) {
      return {
        message: '加油！每一次使用都是进步的开始',
        type: 'normal'
      };
    } else {
      return {
        message: '开始你的创作之旅吧！',
        type: 'normal'
      };
    }
  },

  // 记录打卡
  recordCheckIn(type) {
    const today = new Date().toDateString();
    const checkInRecords = wx.getStorageSync('checkInRecords') || {};
    
    if (!checkInRecords[today]) {
      checkInRecords[today] = {};
    }
    
    checkInRecords[today][type] = true;
    wx.setStorageSync('checkInRecords', checkInRecords);
    
    // 更新数据
    this.initCheckInData();
  },

  // 延迟显示打卡面板
  showCheckInPanelWithDelay() {
    setTimeout(() => {
      this.setData({
        showCheckInPanel: true
      });
    }, 500);
  },

  // 显示打卡面板
  showCheckInPanel() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showCheckInPanel: true
    });
  },

  // 关闭打卡面板
  closeCheckInPanel() {
    this.setData({
      showCheckInPanel: false
    });
  },

  // 点击创作工具时记录打卡
  onCreateTap() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 记录创作打卡
    this.recordCheckIn('create');
    
    // 跳转到工具页面
    wx.switchTab({
      url: '/pages/tools/index'
    });
  },
});
