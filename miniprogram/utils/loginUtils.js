/**
 * 公共登录工具类
 * 提供统一的登录逻辑，可在各个页面调用
 */

class LoginUtils {
  /**
   * 执行微信登录
   * @param {Object} options 配置选项
   * @param {Function} options.onLoginStart 登录开始回调
   * @param {Function} options.onLoginSuccess 登录成功回调
   * @param {Function} options.onLoginFail 登录失败回调
   * @param {string} options.desc 获取用户信息的描述文本
   * @returns {Promise<Object>} 登录结果
   */
  static async performLogin(options = {}) {
    const {
      onLoginStart = () => {},
      onLoginSuccess = () => {},
      onLoginFail = () => {},
      desc = '用于完善用户资料'
    } = options;

    try {
      // 开始登录
      onLoginStart();

      // 获取用户授权信息
      const { userInfo } = await wx.getUserProfile({
        desc: desc
      });

      // 获取登录凭证
      const { code } = await wx.login();

      // 调用云函数进行登录
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
        
        // 登录成功回调
        onLoginSuccess(result.userInfo);

        return {
          success: true,
          userInfo: result.userInfo
        };
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败：', error);
      
      // 登录失败回调
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
    const userInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = !!(userInfo && userInfo.openId);
    
    return {
      isLoggedIn,
      userInfo: isLoggedIn ? userInfo : null
    };
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
      confirmColor: '#F35A75',
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
