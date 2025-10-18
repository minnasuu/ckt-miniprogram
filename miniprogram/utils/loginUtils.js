/**
 * 公共登录工具类
 * 提供统一的登录逻辑，可在各个页面调用
 */

class LoginUtils {
  /**
   * 执行微信登录（使用新的头像昵称填写能力）
   * @param {Object} options 配置选项
   * @param {Function} options.onLoginStart 登录开始回调
   * @param {Function} options.onLoginSuccess 登录成功回调
   * @param {Function} options.onLoginFail 登录失败回调
   * @param {Object} options.currentPage 当前页面实例（用于显示欢迎弹窗）
   * @param {boolean} options.showWelcome 登录成功后是否显示欢迎弹窗
   * @returns {Promise<Object>} 登录结果
   */
  static async performLogin(options = {}) {
    const {
      onLoginStart = () => {},
      onLoginSuccess = () => {},
      onLoginFail = () => { },
      currentPage = null,
      showWelcome = true
    } = options;

    try {
      // 开始登录
      onLoginStart();

      // 获取登录凭证
      const { code } = await wx.login();

      // 获取用户信息（使用兼容性方案）
      let userInfo = null;
      try {
        // 检查基础库版本
        const systemInfo = wx.getSystemInfoSync();
        const SDKVersion = systemInfo.SDKVersion;

        console.log('当前基础库版本:', SDKVersion);

        // 尝试使用 getUserProfile 获取用户信息
        // 注意：从2022年10月25日起，getUserProfile 接口已废弃，但仍可尝试调用
        try {
          const userProfileRes = await wx.getUserProfile({
            desc: '用于完善用户资料'
          });
          userInfo = {
            nickName: userProfileRes.userInfo.nickName,
            avatarUrl: userProfileRes.userInfo.avatarUrl
          };
          console.log('成功获取用户真实信息:', userInfo);
        } catch (profileError) {
          console.log('getUserProfile 调用失败:', profileError);

          // 如果 getUserProfile 失败，检查是否是因为用户拒绝授权
          if (profileError.errMsg && profileError.errMsg.includes('auth deny')) {
            console.log('用户拒绝授权，使用默认信息');
          } else {
            console.log('其他错误，使用默认信息');
          }

          // 使用默认用户信息
          userInfo = {
            nickName: '用户' + Math.random().toString(36).substr(2, 6),
            avatarUrl: '/images/default-avatar.png'
          };
        }
      } catch (error) {
        console.log('获取用户信息过程中发生错误:', error);
        // 如果获取失败，使用默认用户信息
        userInfo = {
          nickName: '用户' + Math.random().toString(36).substr(2, 6),
          avatarUrl: '/images/default-avatar.png'
        };
      }

      // 调用云函数进行登录
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code,
          userInfo: userInfo
        }
      });

      if (result.success) {
        // 清除旧的缓存
        wx.removeStorageSync('userInfo');
        // 保存最新的用户信息到缓存
        wx.setStorageSync('userInfo', result.userInfo);

        // 登录成功回调
        onLoginSuccess(result.userInfo);

        // 如果需要显示欢迎弹窗且有页面实例
        if (showWelcome && currentPage) {
          setTimeout(() => {
            // 动态引入避免循环依赖
            const WelcomeUtils = require('./welcomeUtils');
            WelcomeUtils.showWelcomeOnLogin(result.userInfo, currentPage);
          }, 500);
        }

        return {
          success: true,
          userInfo: result.userInfo
        };
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('执行登录失败：', error);

      // 登录失败回调
      onLoginFail(error);

      return {
        success: false,
        error: error
      };
    }
  }

  /**
   * 比较版本号
   * @param {string} v1 版本号1
   * @param {string} v2 版本号2
   * @returns {number} 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
   */
  static compareVersion(v1, v2) {
    const arr1 = v1.split('.').map(Number);
    const arr2 = v2.split('.').map(Number);
    const maxLength = Math.max(arr1.length, arr2.length);

    for (let i = 0; i < maxLength; i++) {
      const num1 = arr1[i] || 0;
      const num2 = arr2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * 执行用户主动触发的登录（使用新的头像昵称填写能力）
   * 这个方法应该在用户点击登录按钮时调用
   * 
   * 登录流程：
   * 1. 调用 wx.login() 获取临时登录凭证 code
   * 2. 使用默认用户信息（用户可在登录后通过新组件更新）
   * 3. 将 code 发送到开发者服务器（云函数）
   * 4. 服务器调用 auth.code2Session 接口换取 OpenID 和 session_key
   * 5. 服务器生成自定义登录态并返回用户信息
   * 
   * @param {Object} options 配置选项
   * @param {Function} options.onLoginStart 登录开始回调
   * @param {Function} options.onLoginSuccess 登录成功回调
   * @param {Function} options.onLoginFail 登录失败回调
   * @param {Object} options.currentPage 当前页面实例（用于显示欢迎弹窗）
   * @param {boolean} options.showWelcome 登录成功后是否显示欢迎弹窗
   * @returns {Promise<Object>} 登录结果
   */
  static async performUserTriggeredLogin(options = {}) {
    const {
      onLoginStart = () => { },
      onLoginSuccess = () => { },
      onLoginFail = () => { },
      currentPage = null,
      showWelcome = true
    } = options;

    try {
      // 开始登录
      onLoginStart();

      // 第一步：调用 wx.login() 获取临时登录凭证 code
      console.log('开始获取登录凭证...');
      const loginRes = await wx.login();

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }

      console.log('获取到登录凭证 code:', loginRes.code);

      // 第二步：获取用户信息（使用新的头像昵称填写能力）
      let userInfo = null;

      // 检查用户授权状态
      const settingRes = await wx.getSetting();
      console.log('用户授权状态:', settingRes.authSetting);

      // 由于 getUserProfile 已被废弃，我们直接使用默认信息
      // 用户可以在登录后通过新的头像昵称填写组件来更新信息
      userInfo = {
        nickName: '用户' + Math.random().toString(36).substr(2, 6),
        avatarUrl: '/images/default-avatar.png'
      };

      console.log('使用默认用户信息:', userInfo);

      // 第三步：将 code 发送到开发者服务器（云函数）
      console.log('调用云函数进行登录...');
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code: loginRes.code,  // 发送临时登录凭证
          userInfo: userInfo    // 发送用户信息（可选）
        }
      });

      // 第四步：处理服务器返回结果
      if (result.success) {
        console.log('登录成功，用户信息:', result.userInfo);

        // 清除旧的缓存
        wx.removeStorageSync('userInfo');
        // 保存最新的用户信息到缓存（自定义登录态）
        wx.setStorageSync('userInfo', result.userInfo);

        // 登录成功回调
        onLoginSuccess(result.userInfo);

        // 如果需要显示欢迎弹窗且有页面实例
        if (showWelcome && currentPage) {
          setTimeout(() => {
            // 动态引入避免循环依赖
            const WelcomeUtils = require('./welcomeUtils');
            WelcomeUtils.showWelcomeOnLogin(result.userInfo, currentPage);
          }, 500);
        }

        return {
          success: true,
          userInfo: result.userInfo
        };
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('执行登录失败：', error);

      // 隐藏加载提示
      wx.hideLoading();

      // 登录失败回调
      onLoginFail(error);

      return {
        success: false,
        error: error
      };
    }
  }

  /**
   * 执行需要用户信息的登录（使用新的头像昵称填写能力）
   * 这个方法会引导用户填写头像和昵称
   * @param {Object} options 配置选项
   * @param {Function} options.onLoginStart 登录开始回调
   * @param {Function} options.onLoginSuccess 登录成功回调
   * @param {Function} options.onLoginFail 登录失败回调
   * @param {Object} options.currentPage 当前页面实例
   * @param {boolean} options.showWelcome 登录成功后是否显示欢迎弹窗
   * @returns {Promise<Object>} 登录结果
   */
  static async performLoginWithUserInfo(options = {}) {
    const {
      onLoginStart = () => { },
      onLoginSuccess = () => { },
      onLoginFail = () => { },
      currentPage = null,
      showWelcome = true
    } = options;

    try {
      // 开始登录
      onLoginStart();

      // 第一步：调用 wx.login() 获取临时登录凭证 code
      console.log('开始获取登录凭证...');
      const loginRes = await wx.login();

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }

      console.log('获取到登录凭证 code:', loginRes.code);

      // 第二步：显示头像昵称填写弹窗
      return new Promise((resolve, reject) => {
        wx.showModal({
          title: '完善用户信息',
          content: '为了更好的体验，请填写您的昵称和头像',
          confirmText: '去填写',
          cancelText: '稍后再说',
          success: async (modalRes) => {
            if (modalRes.confirm) {
              // 用户选择填写信息，跳转到用户信息填写页面
              wx.navigateTo({
                url: '/pages/user-center/index?action=editProfile',
                success: () => {
                  // 先完成基础登录
                  this.performBasicLogin(loginRes.code, {
                    onLoginSuccess,
                    onLoginFail,
                    currentPage,
                    showWelcome
                  }).then(resolve).catch(reject);
                },
                fail: () => {
                  // 跳转失败，使用默认信息登录
                  this.performBasicLogin(loginRes.code, {
                    onLoginSuccess,
                    onLoginFail,
                    currentPage,
                    showWelcome
                  }).then(resolve).catch(reject);
                }
              });
            } else {
              // 用户选择稍后再说，使用默认信息登录
              this.performBasicLogin(loginRes.code, {
                onLoginSuccess,
                onLoginFail,
                currentPage,
                showWelcome
              }).then(resolve).catch(reject);
            }
          },
          fail: () => {
            // 弹窗失败，使用默认信息登录
            this.performBasicLogin(loginRes.code, {
              onLoginSuccess,
              onLoginFail,
              currentPage,
              showWelcome
            }).then(resolve).catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('执行登录失败：', error);
      onLoginFail(error);
      return {
        success: false,
        error: error
      };
    }
  }

  /**
   * 执行基础登录（不获取用户信息）
   * @param {string} code 登录凭证
   * @param {Object} options 配置选项
   * @returns {Promise<Object>} 登录结果
   */
  static async performBasicLogin(code, options = {}) {
    const {
      onLoginSuccess = () => { },
      onLoginFail = () => { },
      currentPage = null,
      showWelcome = true
    } = options;

    try {
      // 使用默认用户信息
      const userInfo = {
        nickName: '用户' + Math.random().toString(36).substr(2, 6),
        avatarUrl: '/images/default-avatar.png'
      };

      console.log('使用默认用户信息:', userInfo);

      // 调用云函数进行登录
      console.log('调用云函数进行登录...');
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code: code,
          userInfo: userInfo
        }
      });

      // 处理服务器返回结果
      if (result.success) {
        console.log('登录成功，用户信息:', result.userInfo);

        // 清除旧的缓存
        wx.removeStorageSync('userInfo');
        // 保存最新的用户信息到缓存（自定义登录态）
        wx.setStorageSync('userInfo', result.userInfo);
        
        // 登录成功回调
        onLoginSuccess(result.userInfo);

        // 如果需要显示欢迎弹窗且有页面实例
        if (showWelcome && currentPage) {
          setTimeout(() => {
            // 动态引入避免循环依赖
            const WelcomeUtils = require('./welcomeUtils');
            WelcomeUtils.showWelcomeOnLogin(result.userInfo, currentPage);
          }, 500);
        }

        return {
          success: true,
          userInfo: result.userInfo
        };
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('基础登录失败：', error);
      onLoginFail(error);
      return {
        success: false,
        error: error
      };
    }
  }

  /**
   * 检查用户登录状态
   * @returns {Object} 登录状态信息
   */
  static checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const isLoggedIn = !!(userInfo && userInfo.openId);

      // 如果用户信息存在但缺少openId，清除旧数据
      if (userInfo && !userInfo.openId) {
        console.log('检测到旧版本用户数据，清除缓存');
        wx.removeStorageSync('userInfo');
        return {
          isLoggedIn: false,
          userInfo: null
        };
      }

      return {
        isLoggedIn,
        userInfo: isLoggedIn ? userInfo : null
      };
    } catch (error) {
      console.error('检查登录状态失败：', error);
      // 发生错误时清除可能损坏的数据
      wx.removeStorageSync('userInfo');
      return {
        isLoggedIn: false,
        userInfo: null
      };
    }
  }

  /**
   * 退出登录
   * @param {Function} callback 退出登录后的回调
   */
  static logout(callback = () => {}) {
    try {
      // 清除用户信息缓存
      wx.removeStorageSync('userInfo');
      
      // 执行回调
      callback();

      return { success: true };
    } catch (error) {
      console.error('退出登录失败：', error);
      return { success: false, error };
    }
  }

  /**
   * 清除所有旧版本登录数据（强制所有用户重新登录）
   * @param {string} version 当前版本号，用于控制清除操作只执行一次
   * @returns {Object} 清除结果
   */
  static clearAllOldLoginData(version = '2.0.0') {
    try {
      // 检查是否已经为当前版本清除过数据
      const clearedVersion = wx.getStorageSync('dataClearedVersion');
      if (clearedVersion === version) {
        console.log('数据已为当前版本清除过，跳过清除操作');
        return { success: true, skipped: true };
      }

      // 清除所有可能的用户相关数据
      const keysToRemove = [
        'userInfo',
        'userProfile',
        'loginInfo',
        'authInfo',
        'checkInData',
        'lastCheckInDate',
        'userSettings',
        'userPreferences'
      ];

      keysToRemove.forEach(key => {
        try {
          wx.removeStorageSync(key);
        } catch (e) {
          // 忽略不存在的key
        }
      });

      // 记录已清除的版本号
      wx.setStorageSync('dataClearedVersion', version);

      console.log(`已清除所有旧版本登录数据（版本 ${version}），所有用户将作为新用户重新登录`);

      return { success: true, cleared: true };
    } catch (error) {
      console.error('清除旧登录数据失败：', error);
      return { success: false, error };
    }
  }

  /**
   * 显示登录弹窗并执行登录
   * @param {Object} options 配置选项
   * @param {string} options.title 弹窗标题
   * @param {string} options.content 弹窗内容
   * @param {string} options.confirmText 确认按钮文字
   * @param {Function} options.onLoginStart 登录开始回调
   * @param {Function} options.onLoginSuccess 登录成功回调
   * @param {Function} options.onLoginFail 登录失败回调
   * @param {Function} options.onCancel 取消登录回调
   */
  static showLoginModal(options = {}) {
    const {
      title = '需要登录',
      content = '此功能需要先登录账号，是否立即登录？',
      confirmText = '立即登录',
      onLoginStart = () => { },
      onLoginSuccess = () => {},
      onLoginFail = () => { },
      onCancel = () => { },
      onLoginConfirm = () => { }
    } = options;

    wx.showModal({
      title,
      content,
      confirmText,
      confirmColor: '#003472',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确认，显示登录中状态并执行登录
          onLoginConfirm();

          this.performLogin({
            onLoginStart: () => {
              onLoginStart();
            },
            onLoginSuccess: (userInfo) => {
              // 登录成功，关闭加载提示
              wx.hideLoading();
              onLoginSuccess(userInfo);
            },
            onLoginFail: (error) => {
              // 登录失败，关闭加载提示
              wx.hideLoading();
              onLoginFail(error);
            }
          });
        } else {
          // 用户点击取消
          onCancel();
        }
      }
    });
  }

  /**
   * 获取用户等级
   * @param {Object} userInfo 用户信息
   * @returns {string} 用户等级：guest, normal, premium, admin
   */
  static getUserLevel(userInfo) {
    if (!userInfo || !userInfo.openId) {
      return 'guest'; // 未登录用户
    }

    // 管理员判断（使用项目中现有的管理员openId）
    if (userInfo.openId === 'od7SO5Pt8HG7dDS5A_1Uuv7ky_Mg') {
      return 'admin';
    }

    // 高级用户判断（这里可以根据实际业务逻辑调整）
    // 例如：可以根据用户的创建时间、活跃度等判断
    if (userInfo.isPremium || userInfo.level === 'premium') {
      return 'premium';
    }

    // 普通用户
    return 'normal';
  }

  /**
   * 检查用户保存权限
   * @param {Object} options 配置选项
   * @param {Function} options.onPermissionDenied 权限不足时的回调
   * @param {Function} options.onLoginRequired 需要登录时的回调
   * @returns {boolean} 是否有保存权限
   */
  static checkSavePermission(options = {}) {
    const {
      onPermissionDenied = () => { },
      onLoginRequired = () => { }
    } = options;

    // 检查用户登录状态
    const { isLoggedIn, userInfo } = this.checkLoginStatus();

    if (!isLoggedIn) {
      onLoginRequired();
      return false;
    }

    // 获取用户等级
    const userLevel = this.getUserLevel(userInfo);

    // 只有高级用户和管理员才能保存
    if (userLevel === 'normal' || userLevel === 'guest') {
      onPermissionDenied(userLevel);
      return false;
    }

    return true;
  }
}

module.exports = LoginUtils;
