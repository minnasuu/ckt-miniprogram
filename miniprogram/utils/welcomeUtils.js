/**
 * 欢迎弹窗管理工具类
 * 负责控制欢迎弹窗的显示时机和逻辑
 */

const LoginUtils = require('./loginUtils');

class WelcomeUtils {
  /**
   * 检查是否应该显示欢迎弹窗
   * @param {Object} options 配置选项
   * @param {boolean} options.forceShow 是否强制显示
   * @param {number} options.cooldownHours 冷却时间（小时）
   * @returns {boolean} 是否应该显示欢迎弹窗
   */
  static shouldShowWelcome(options = {}) {
    const {
      forceShow = false,
      cooldownHours = 24 // 默认24小时内不重复显示
    } = options;

    // 如果强制显示，直接返回true
    if (forceShow) {
      return true;
    }

    // 检查用户登录状态
    const { isLoggedIn, userInfo } = LoginUtils.checkLoginStatus();
    
    // 未登录用户不显示欢迎弹窗
    if (!isLoggedIn) {
      return false;
    }

    // 检查上次显示时间
    const lastShowTime = wx.getStorageSync('welcomeDialog_lastShow');
    const now = Date.now();
    
    if (lastShowTime) {
      const timeDiff = now - lastShowTime;
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      
      // 如果在冷却期内，不显示
      if (timeDiff < cooldownMs) {
        return false;
      }
    }

    return true;
  }

  /**
   * 记录欢迎弹窗显示时间
   */
  static recordWelcomeShown() {
    wx.setStorageSync('welcomeDialog_lastShow', Date.now());
  }

  /**
   * 获取欢迎弹窗配置
   * @param {Object} userInfo 用户信息
   * @returns {Object} 欢迎弹窗配置
   */
  static getWelcomeConfig(userInfo = null) {
    // 如果没有传入用户信息，从缓存获取
    if (!userInfo) {
      const loginStatus = LoginUtils.checkLoginStatus();
      userInfo = loginStatus.userInfo;
    }

    const config = {
      visible: false,
      userInfo: userInfo,
      autoClose: true,
      autoCloseDelay: 5000
    };

    // 根据用户等级调整配置
    if (userInfo) {
      const userLevel = LoginUtils.getUserLevel(userInfo);
      
      switch (userLevel) {
        case 'admin':
          config.autoCloseDelay = 8000; // 管理员显示更长时间
          break;
        case 'premium':
          config.autoCloseDelay = 6000; // 高级用户显示稍长时间
          break;
        default:
          config.autoCloseDelay = 5000; // 普通用户默认时间
      }
    }

    return config;
  }

  /**
   * 在页面中显示欢迎弹窗
   * @param {Object} page 页面实例
   * @param {Object} options 配置选项
   */
  static showWelcomeInPage(page, options = {}) {
    // 检查是否应该显示
    if (!this.shouldShowWelcome(options)) {
      return false;
    }

    // 获取配置
    const config = this.getWelcomeConfig();
    config.visible = true;

    // 更新页面数据
    if (page && typeof page.setData === 'function') {
      page.setData({
        welcomeConfig: config
      });

      // 记录显示时间
      this.recordWelcomeShown();
      return true;
    }

    return false;
  }

  /**
   * 隐藏欢迎弹窗
   * @param {Object} page 页面实例
   */
  static hideWelcomeInPage(page) {
    if (page && typeof page.setData === 'function') {
      page.setData({
        'welcomeConfig.visible': false
      });
    }
  }

  /**
   * 在应用启动时检查并显示欢迎弹窗
   * @param {Object} options 配置选项
   * @returns {Promise<boolean>} 是否显示了欢迎弹窗
   */
  static async checkWelcomeOnAppLaunch(options = {}) {
    return new Promise((resolve) => {
      // 延迟检查，确保页面已经加载完成
      setTimeout(() => {
        // 获取当前页面栈
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];

        if (currentPage) {
          const shown = this.showWelcomeInPage(currentPage, options);
          resolve(shown);
        } else {
          resolve(false);
        }
      }, 1000); // 1秒延迟
    });
  }

  /**
   * 在登录成功后显示欢迎弹窗
   * @param {Object} userInfo 用户信息
   * @param {Object} page 页面实例
   * @param {Object} options 配置选项
   */
  static showWelcomeOnLogin(userInfo, page, options = {}) {
    // 登录成功后总是显示欢迎弹窗（忽略冷却时间）
    const config = this.getWelcomeConfig(userInfo);
    config.visible = true;
    config.autoCloseDelay = options.autoCloseDelay || 6000; // 登录后显示稍长时间

    if (page && typeof page.setData === 'function') {
      page.setData({
        welcomeConfig: config
      });

      // 记录显示时间
      this.recordWelcomeShown();
      return true;
    }

    return false;
  }

  /**
   * 重置欢迎弹窗显示记录（用于测试或特殊情况）
   */
  static resetWelcomeRecord() {
    wx.removeStorageSync('welcomeDialog_lastShow');
  }

  /**
   * 获取欢迎弹窗显示统计
   * @returns {Object} 统计信息
   */
  static getWelcomeStats() {
    const lastShowTime = wx.getStorageSync('welcomeDialog_lastShow');
    const now = Date.now();
    
    return {
      lastShowTime: lastShowTime || null,
      lastShowDate: lastShowTime ? new Date(lastShowTime).toLocaleString() : null,
      timeSinceLastShow: lastShowTime ? now - lastShowTime : null,
      hasShownBefore: !!lastShowTime
    };
  }
}

module.exports = WelcomeUtils;
