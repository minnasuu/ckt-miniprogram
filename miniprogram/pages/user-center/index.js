const { envList } = require('../../envList');
const { recordLoginCheckIn, recordCreationCheckIn } = require('../../utils/checkInUtils');
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
    creationStreak: 0,
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
    this.initUserAssetsData();
  },

  onShow() {
    // 页面显示时检查登录状态和刷新资产数据
    this.checkLoginStatus();
    this.initUserAssetsData();
    // 刷新打卡数据
    this.initCheckInData();
  },

  // 初始化用户资产数据
  async initUserAssetsData() {
    // 检查用户是否登录
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo || !userInfo.openId) {
      // 未登录时重置所有数量为0
      this.setData({
        imageNum: 0,
        documentNum: 0,
        assetNum: 0,
        favoriteNum: 0
      });
      return;
    }

    try {
      const db = wx.cloud.database();

      // 并行获取各种数据的数量
      const [imageCount, documentCount, assetCount, favoriteCount] = await Promise.allSettled([
        this.getImageCount(db, userInfo),
        this.getDocumentCount(db, userInfo),
        this.getAssetCount(db, userInfo),
        this.getFavoriteCount(db, userInfo)
      ]);

      // 更新数据，如果获取失败则保持原值或设为0
      this.setData({
        imageNum: imageCount.status === 'fulfilled' ? imageCount.value : 0,
        documentNum: documentCount.status === 'fulfilled' ? documentCount.value : 0,
        assetNum: assetCount.status === 'fulfilled' ? assetCount.value : 0,
        favoriteNum: favoriteCount.status === 'fulfilled' ? favoriteCount.value : 0
      });

    } catch (error) {
      console.error('获取用户资产数据失败:', error);
      // 发生错误时，保持现有数据不变
    }
  },

  // 获取图片数量（colorCards集合）
  async getImageCount(db, userInfo) {
    try {
      const res = await db.collection('colorCards')
        .where({
          author: userInfo.author || userInfo // 兼容不同的author字段格式
        })
        .count();
      return res.total || 0;
    } catch (error) {
      if (error.errCode === -502005) {
        // 集合不存在
        return 0;
      }
      throw error;
    }
  },

  // 获取文档数量（patternList集合）
  async getDocumentCount(db, userInfo) {
    try {
      const res = await db.collection('patternList')
        .where({
          authorId: userInfo.openId,
          type: 'pattern-note'
        })
        .count();
      return res.total || 0;
    } catch (error) {
      if (error.errCode === -502005) {
        // 集合不存在
        return 0;
      }
      throw error;
    }
  },

  // 获取资产数量（预留接口，目前返回0）
  async getAssetCount(db, userInfo) {
    try {
      // 资产功能暂未实现，预留接口
      // 未来可能使用 assets 集合
      const res = await db.collection('assets')
        .where({
          authorId: userInfo.openId
        })
        .count();
      return res.total || 0;
    } catch (error) {
      if (error.errCode === -502005) {
        // 集合不存在，资产功能还未实现
        return 0;
      }
      throw error;
    }
  },

  // 获取收藏数量（预留接口，目前返回0）
  async getFavoriteCount(db, userInfo) {
    try {
      // 收藏功能暂时使用模拟数据，预留接口
      // 未来可能使用 favorites 集合
      const res = await db.collection('favorites')
        .where({
          authorId: userInfo.openId
        })
        .count();
      return res.total || 0;
    } catch (error) {
      if (error.errCode === -502005) {
        // 集合不存在，收藏功能还未完全实现
        return 0;
      }
      throw error;
    }
  },

  // 刷新用户资产数据（供其他页面调用）
  refreshUserAssetsData() {
    this.initUserAssetsData();
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

        // 确保用户信息保存完成后再记录登录打卡
        setTimeout(async () => {
          console.log('开始记录登录打卡...');
          const success = await recordLoginCheckIn();
          console.log('登录打卡结果:', success);

          // 登录打卡完成后刷新打卡数据
          this.initCheckInData();
        }, 100);

        // 更新用户资产数据
        this.initUserAssetsData();

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
      confirmColor: '#F35A75',
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
    // 重置用户资产数据
    this.initUserAssetsData();
    wx.showToast({
      title: '退出登录成功',
      icon: 'none'
    });
  },

  // 初始化打卡数据（从云端获取）
  async initCheckInData() {
    console.log('开始初始化打卡数据...');
    try {
      const userInfo = wx.getStorageSync('userInfo');
      console.log('用户信息:', userInfo);

      if (!userInfo || !userInfo.openId) {
        console.log('用户未登录，显示空数据');
      // 未登录时显示空数据
        this.setData({
          weeklyData: this.generateEmptyWeeklyData(),
          checkInStreak: 0,
          creationStreak: 0,
          feedbackMessage: '请先登录查看打卡记录',
          feedbackType: 'normal'
        });
        return;
      }

      console.log('调用云函数获取打卡数据...');
      // 从云端获取打卡统计数据
      const result = await wx.cloud.callFunction({
        name: 'checkInManager',
        data: {
          action: 'getCheckInStats'
        }
      });

      console.log('云函数返回结果:', result);

      if (result.result && result.result.success) {
        const data = result.result.data;
        console.log('打卡数据:', data);
        this.setData({
          weeklyData: data.weeklyData,
          checkInStreak: data.checkInStreak,
          creationStreak: data.creationStreak,
          feedbackMessage: data.feedbackMessage,
          feedbackType: data.feedbackType
        });
        console.log('打卡数据更新完成');
      } else {
        console.error('获取打卡数据失败:', result.result ? result.result.message : '未知错误');
        // 显示空数据
        this.setData({
          weeklyData: this.generateEmptyWeeklyData(),
          checkInStreak: 0,
          creationStreak: 0,
          feedbackMessage: '获取打卡数据失败',
          feedbackType: 'normal'
        });
      }
    } catch (error) {
      console.error('初始化打卡数据失败:', error);
      // 显示空数据
      this.setData({
        weeklyData: this.generateEmptyWeeklyData(),
        checkInStreak: 0,
        creationStreak: 0,
        feedbackMessage: '获取打卡数据失败',
        feedbackType: 'normal'
      });
    }
  },

  // 生成空的近一周数据（未登录时使用）
  generateEmptyWeeklyData() {
    const today = new Date();
    const weekData = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      weekData.push({
        date: this.formatDate(date),
        day: weekdays[date.getDay()],
        dayNum: date.getDate(),
        hasLogin: false,
        hasCreate: false,
        creationCount: 0,
        isToday: i === 0
      });
    }
    
    return weekData;
  },

  // 格式化日期为 YYYY-MM-DD 格式
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },



  // 记录打卡（云端）
  async recordCheckIn(type, creationCount = 0) {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.openId) {
        console.log('用户未登录，无法记录打卡');
        return;
      }

      const result = await wx.cloud.callFunction({
        name: 'checkInManager',
        data: {
          action: 'recordCheckIn',
          data: {
            type: type,
            creationCount: creationCount
          }
        }
      });

      if (result.result.success) {
        console.log('打卡记录成功:', type);
        // 更新数据
        this.initCheckInData();
      } else {
        console.error('打卡记录失败:', result.result.message);
      }
    } catch (error) {
      console.error('记录打卡失败:', error);
    }
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
    
    // 记录创作打卡（创作数量为1）
    recordCreationCheckIn(1);
    
    // 跳转到工具页面
    wx.switchTab({
      url: '/pages/tools/index'
    });
  },

  // 供其他页面调用的创作打卡方法
  recordCreation(count = 1) {
    this.recordCheckIn('create', count);
  },

  // 临时调试方法：直接查看数据库记录
  async debugCheckInData() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.openId) {
        console.log('用户未登录');
        return;
      }

      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      console.log('调试 - 查询参数:');
      console.log('openId:', userInfo.openId);
      console.log('date:', dateStr);

      const db = wx.cloud.database();
      const result = await db.collection('checkInRecords')
        .where({
          openId: userInfo.openId,
          date: dateStr
        })
        .get();

      console.log('调试 - 数据库查询结果:', result);
      console.log('调试 - 记录数量:', result.data.length);
      if (result.data.length > 0) {
        console.log('调试 - 今日记录:', result.data[0]);
      }
    } catch (error) {
      console.error('调试查询失败:', error);
    }
  },
});
