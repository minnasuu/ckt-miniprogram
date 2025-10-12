// 测试登录功能的页面
const LoginUtils = require('../../utils/loginUtils');

Page({
  data: {
    loginStatus: '未登录',
    userInfo: null,
    isLoggingIn: false,
    logs: []
  },

  onLoad() {
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const { isLoggedIn, userInfo } = LoginUtils.checkLoginStatus();
    this.setData({
      loginStatus: isLoggedIn ? '已登录' : '未登录',
      userInfo: userInfo
    });
    this.addLog(`检查登录状态: ${isLoggedIn ? '已登录' : '未登录'}`);
  },

  // 执行基础登录（不获取用户信息）
  async performBasicLogin() {
    if (this.data.isLoggingIn) {
      return;
    }

    this.addLog('开始执行基础登录...');
    
    try {
      const result = await LoginUtils.performUserTriggeredLogin({
        onLoginStart: () => {
          this.setData({ isLoggingIn: true });
          this.addLog('登录开始');
        },
        onLoginSuccess: (userInfo) => {
          this.setData({
            userInfo: userInfo,
            isLoggingIn: false,
            loginStatus: '已登录'
          });
          this.addLog('登录成功');
        },
        onLoginFail: (error) => {
          this.setData({ isLoggingIn: false });
          this.addLog(`登录失败: ${error.message}`);
        }
      });

      if (result.success) {
        this.addLog('登录流程完成');
      } else {
        this.addLog(`登录失败: ${result.error.message}`);
      }
    } catch (error) {
      this.setData({ isLoggingIn: false });
      this.addLog(`登录异常: ${error.message}`);
    }
  },

  // 执行需要用户信息的登录
  async performLoginWithUserInfo() {
    if (this.data.isLoggingIn) {
      return;
    }

    this.addLog('开始执行需要用户信息的登录...');
    
    try {
      const result = await LoginUtils.performLoginWithUserInfo({
        onLoginStart: () => {
          this.setData({ isLoggingIn: true });
          this.addLog('登录开始');
        },
        onLoginSuccess: (userInfo) => {
          this.setData({
            userInfo: userInfo,
            isLoggingIn: false,
            loginStatus: '已登录'
          });
          this.addLog('登录成功');
        },
        onLoginFail: (error) => {
          this.setData({ isLoggingIn: false });
          this.addLog(`登录失败: ${error.message}`);
        }
      });

      if (result.success) {
        this.addLog('登录流程完成');
      } else {
        this.addLog(`登录失败: ${result.error.message}`);
      }
    } catch (error) {
      this.setData({ isLoggingIn: false });
      this.addLog(`登录异常: ${error.message}`);
    }
  },

  // 退出登录
  logout() {
    const result = LoginUtils.logout(() => {
      this.setData({
        userInfo: null,
        loginStatus: '未登录'
      });
      this.addLog('已退出登录');
    });
    
    if (result.success) {
      this.addLog('退出登录成功');
    } else {
      this.addLog(`退出登录失败: ${result.error.message}`);
    }
  },

  // 清除日志
  clearLogs() {
    this.setData({ logs: [] });
  },

  // 添加日志
  addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    const logs = [...this.data.logs, log];
    this.setData({ logs });
    console.log(log);
  }
});
