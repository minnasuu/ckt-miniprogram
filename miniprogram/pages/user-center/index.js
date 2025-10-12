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
    totalCreations: 0,
    feedbackMessage: '',
    feedbackType: 'normal', // normal, good, excellent
    showAlertMessage: false,
    alertMessageTitle: '',
    alertMessageContent: '',
    // 新增：控制图表显示的状态
    shouldShowChart: false,
    hasRecentCreation: false
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });

    // 清除所有旧版本登录信息，强制所有用户重新登录
    this.clearAllOldLoginData();

    // 检查是否已登录
    this.checkLoginStatus();
    this.initWeeklyData();
    // 初始化打卡数据
    this.initCheckInData();
    this.initUserAssetsData();

    // 调试微信头像信息
    this.debugWechatAvatar();
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
          _openid: userInfo.openId || userInfo // 兼容不同的author字段格式
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

  // 清除所有旧版本登录数据
  clearAllOldLoginData() {
    try {
      // 使用LoginUtils的清除方法，带版本控制
      const LoginUtils = require('../../utils/loginUtils');
      const result = LoginUtils.clearAllOldLoginData('2.1.0');

      if (result.success && result.cleared) {
        console.log('已清除所有旧版本登录数据，所有用户将作为新用户重新登录');

        // 重置页面状态
        this.setData({
          userInfo: null,
          isLoggingIn: false,
          showDialog: false,
          tempAvatar: '',
          tempUsername: '',
          imageNum: 0,
          documentNum: 0,
          assetNum: 0,
          favoriteNum: 0
        });
      } else if (result.skipped) {
        console.log('数据已为当前版本清除过，跳过清除操作');
      }

    } catch (error) {
      console.error('清除旧登录数据失败：', error);
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.openId) {
      // 检查用户信息是否完整（包含必要的openId字段）
        this.setData({ userInfo });
      } else {
        // 用户信息不完整或不存在，清除可能存在的旧数据
        if (userInfo && !userInfo.openId) {
          console.log('检测到旧版本用户数据，清除缓存');
          wx.removeStorageSync('userInfo');
        }
        this.setData({ userInfo: null });
      }
    } catch (error) {
      console.error('检查登录状态失败：', error);
      // 发生错误时也清除可能损坏的数据
      wx.removeStorageSync('userInfo');
      this.setData({ userInfo: null });
    }
  },

  // 处理登录
  async handleLogin() {
    if (this.data.userInfo) {
      // 如果用户已登录，显示编辑对话框
      this.setData({
        showDialog: true,
        tempAvatar: this.data.userInfo.avatar,
        tempUsername: this.data.userInfo.username
      });
      return;
    }

    try {
      // 使用LoginUtils执行登录，自动获取微信头像和昵称
      const LoginUtils = require('../../utils/loginUtils');
      const result = await LoginUtils.performLogin({
        onLoginStart: () => {
          this.setData({ isLoggingIn: true });
        },
        onLoginSuccess: (userInfo) => {
          this.setData({
            userInfo: userInfo,
            isLoggingIn: false
          });

          // 记录登录打卡
          setTimeout(async () => {
            try {
              const { recordLoginCheckIn } = require('../../utils/checkInUtils');
              await recordLoginCheckIn();
              this.initCheckInData();
            } catch (checkInError) {
              console.error('登录打卡失败:', checkInError);
            }
          }, 100);

          // 更新用户资产数据
          this.initUserAssetsData();
          this.showMessage('登录成功🎉', 'success');
        },
        onLoginFail: (error) => {
          this.setData({ isLoggingIn: false });
          this.showMessage('登录失败💔', 'error');
        },
        currentPage: this,
        showWelcome: true
      });

      if (!result.success) {
        throw new Error(result.error || '登录失败');
      }
    } catch (error) {
      console.error('登录失败：', error);
      this.setData({ isLoggingIn: false });
      this.showMessage('登录失败💔', 'error');
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

  // 强制重新登录
  forceReLogin() {
    wx.showModal({
      title: '重新登录',
      content: '确定要重新登录吗？这将清除当前登录状态，需要重新授权。',
      confirmText: '确定',
      confirmColor: '#F35A75',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          this.setData({
            userInfo: null,
            showDialog: false,
            tempAvatar: '',
            tempUsername: ''
          });
          this.showMessage('已退出登录，请重新登录', 'success');
        }
      }
    });
  },

  // 确认编辑
  confirmEdit() {
    if (this.data.isConfirming) return; // 如果正在加载，直接返回

    const { tempAvatar, tempUsername } = this.data;

    // 验证输入
    if (!tempUsername && !tempAvatar) {
      this.showMessage('请至少修改一项内容', 'warn');
      return;
    }

    if (tempUsername && tempUsername.trim() === '') {
      this.showMessage('用户名不能为空', 'warn');
      return;
    }

    this.setData({
      isConfirming: true
    });

    const newUserInfo = {
      ...this.data.userInfo,
      avatar: tempAvatar || this.data.userInfo.avatar,
      username: tempUsername || this.data.userInfo.username
    };

    console.log('准备更新用户信息:', newUserInfo);

    // 调用云函数更新用户信息
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userInfo: newUserInfo
      },
      success: (res) => {
        console.log('云函数调用成功:', res);

        if (res.result && res.result.success) {
          // 更新成功
          this.setData({
            userInfo: newUserInfo,
            showDialog: false,
            tempAvatar: '',
            tempUsername: '',
            isConfirming: false
          });

          // 更新本地存储
          wx.setStorageSync('userInfo', newUserInfo);

          this.showMessage(res.result.message || '更新成功🎉', 'success');
        } else {
          // 业务逻辑失败
          console.error('更新用户信息业务失败:', res.result);
          this.showMessage(res.result?.message || '更新失败', 'error');
          this.setData({
            isConfirming: false
          });
        }
      },
      fail: (err) => {
        console.error('更新用户信息失败', err);

        let errorMsg = '更新失败';
        if (err.errMsg) {
          if (err.errMsg.includes('FunctionName parameter could not be found')) {
            errorMsg = '云函数未部署，请先部署updateUserInfo云函数';
          } else if (err.errMsg.includes('Environment not found')) {
            errorMsg = '云开发环境未找到';
          } else {
            errorMsg = err.errMsg;
          }
        }

        this.showMessage(errorMsg, 'error');

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
      this.showMessage('请先登录', 'warn');
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
    this.showMessage('退出登录成功', 'success');
  },
  initWeeklyData() {
    this.setData({
      weeklyData: this.generateEmptyWeeklyData(),
      checkInStreak: 0,
      creationStreak: 0,
      feedbackMessage: '请先登录查看打卡记录',
      feedbackType: 'normal',
      shouldShowChart: false,
      hasRecentCreation: false
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
          totalCreations: 0,
          feedbackMessage: '请先登录查看打卡记录',
          feedbackType: 'normal',
          shouldShowChart: false,
          hasRecentCreation: false
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
        
        // 检查近7天是否有创作记录
        const hasRecentCreation = this.checkRecentCreation(data.weeklyData);
        
        this.setData({
          weeklyData: data.weeklyData,
          checkInStreak: data.checkInStreak,
          creationStreak: data.creationStreak,
          totalCreations: data.weeklyData.reduce((total, day) => total + day.creationCount, 0),
          feedbackMessage: data.feedbackMessage,
          feedbackType: data.feedbackType,
          shouldShowChart: hasRecentCreation,
          hasRecentCreation: hasRecentCreation
        });
        console.log('打卡数据更新完成，是否有近7天创作:', hasRecentCreation);
      } else {
        console.error('获取打卡数据失败:', result.result ? result.result.message : '未知错误');
        // 显示空数据
        this.setData({
          weeklyData: this.generateEmptyWeeklyData(),
          checkInStreak: 0,
          creationStreak: 0,
          totalCreations: 0,
          feedbackMessage: '获取打卡数据失败',
          feedbackType: 'normal',
          shouldShowChart: false,
          hasRecentCreation: false
        });
      }
    } catch (error) {
      console.error('初始化打卡数据失败:', error);
      // 显示空数据
      this.setData({
        weeklyData: this.generateEmptyWeeklyData(),
        checkInStreak: 0,
        creationStreak: 0,
        totalCreations: 0,
        feedbackMessage: '获取打卡数据失败',
        feedbackType: 'normal',
        shouldShowChart: false,
        hasRecentCreation: false
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

  // 检查近7天是否有创作记录
  checkRecentCreation(weeklyData) {
    if (!weeklyData || !Array.isArray(weeklyData)) {
      return false;
    }
    
    // 检查近7天中是否有任何一天的创作数量大于0
    return weeklyData.some(day => day.creationCount > 0);
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
      this.showMessage('请先登录', 'warn');
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
    // 如果用户已登录，记录创作打卡
    if (this.data.userInfo) {
      // 记录创作打卡（创作数量为1）
      recordCreationCheckIn(1);
    }
    
    // 无论是否登录都跳转到工具页面
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
  showMessage(title, type = "info") {
    this.setData({
      showAlertMessage: true,
      alertMessageTitle: title,
      alertMessageType: type
    });
  },

  // 调试微信头像信息
  debugWechatAvatar() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.avatar) {
      console.log('=== 微信头像调试信息 ===');
      console.log('用户头像URL:', userInfo.avatar);
      console.log('头像URL类型:', typeof userInfo.avatar);
      console.log('是否为微信头像:', userInfo.avatar.includes('wx.qlogo.cn') || userInfo.avatar.includes('thirdwx.qlogo.cn'));
      console.log('是否为HTTPS:', userInfo.avatar.startsWith('https://'));
      console.log('URL长度:', userInfo.avatar.length);

      // 检查头像URL是否有效
      if (userInfo.avatar.startsWith('http')) {
        wx.getImageInfo({
          src: userInfo.avatar,
          success: (res) => {
            console.log('✅ 微信头像可访问，尺寸:', res.width, 'x', res.height);
          },
          fail: (err) => {
            console.error('❌ 微信头像不可访问:', err.errMsg);
            console.log('可能原因：1. 头像URL已过期 2. 网络问题 3. 权限问题');
          }
        });
      }
    } else {
      console.log('用户未登录或没有头像信息');
    }
  },

  // 头像加载成功
  onAvatarLoad(e) {
    console.log('微信头像加载成功');
  },

  // 头像加载失败
  onAvatarError(e) {
    console.error('微信头像加载失败:', e.detail);

    const currentAvatar = this.data.userInfo?.avatar;
    console.log('失败的头像URL:', currentAvatar);

    // 如果是微信头像URL，提示用户重新登录获取最新头像
    if (currentAvatar && (currentAvatar.includes('wx.qlogo.cn') || currentAvatar.includes('thirdwx.qlogo.cn'))) {
      console.log('检测到微信头像URL过期，建议重新登录');

      // 显示提示，让用户选择是否重新登录
      wx.showModal({
        title: '头像加载失败',
        content: '微信头像链接可能已过期，是否重新登录获取最新头像？',
        confirmText: '重新登录',
        cancelText: '使用默认头像',
        success: (res) => {
          if (res.confirm) {
            // 清除用户信息，强制重新登录
            wx.removeStorageSync('userInfo');
            this.setData({ userInfo: null });
            this.showMessage('请重新登录获取最新微信头像', 'warn');
          } else {
            // 使用默认头像
            this.setData({
              'userInfo.avatar': '/images/default-avatar.png'
            });
            const userInfo = wx.getStorageSync('userInfo') || {};
            userInfo.avatar = '/images/default-avatar.png';
            wx.setStorageSync('userInfo', userInfo);
            console.log('已切换到默认头像');
          }
        }
      });
    } else {
      // 如果不是微信头像，直接使用默认头像
      this.setData({
        'userInfo.avatar': '/images/default-avatar.png'
      });
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.avatar = '/images/default-avatar.png';
      wx.setStorageSync('userInfo', userInfo);
      console.log('已切换到默认头像');
    }
  },
});
