/**
 * 打卡工具函数
 * 提供统一的打卡记录接口
 */

/**
 * 记录用户打卡
 * @param {string} type 打卡类型：'login' | 'create'
 * @param {number} creationCount 创作数量（仅创作打卡时使用）
 * @returns {Promise<boolean>} 是否记录成功
 */
async function recordCheckIn(type, creationCount = 0) {
  try {
    const userInfo = wx.getStorageSync('userInfo');
    console.log('记录打卡 - 用户信息:', userInfo);
    console.log('记录打卡 - 类型:', type, '数量:', creationCount);
    
    if (!userInfo || !userInfo.openId) {
      console.log('用户未登录，无法记录打卡');
      return false;
    }

    console.log('调用云函数记录打卡...');
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

    console.log('打卡云函数返回结果:', result);

    if (result.result && result.result.success) {
      console.log('打卡记录成功:', type, creationCount > 0 ? `创作数量: ${creationCount}` : '');
      
      // 通知用户中心页面更新数据
      const pages = getCurrentPages();
      console.log('当前页面栈:', pages.map(p => p.route));
      const userCenterPage = pages.find(page => page.route === 'pages/user-center/index');
      console.log('找到用户中心页面:', !!userCenterPage);
      
      if (userCenterPage && userCenterPage.initCheckInData) {
        console.log('通知用户中心页面更新数据...');
        userCenterPage.initCheckInData();
      }
      
      return true;
    } else {
      console.error('打卡记录失败:', result.result ? result.result.message : '未知错误');
      return false;
    }
  } catch (error) {
    console.error('记录打卡失败:', error);
    return false;
  }
}

/**
 * 记录登录打卡
 * @returns {Promise<boolean>} 是否记录成功
 */
async function recordLoginCheckIn() {
  return await recordCheckIn('login');
}

/**
 * 记录创作打卡
 * @param {number} count 创作数量，默认为1
 * @returns {Promise<boolean>} 是否记录成功
 */
async function recordCreationCheckIn(count = 1) {
  return await recordCheckIn('create', count);
}

/**
 * 获取用户打卡统计数据
 * @returns {Promise<object|null>} 打卡统计数据
 */
async function getCheckInStats() {
  try {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.openId) {
      return null;
    }

    const result = await wx.cloud.callFunction({
      name: 'checkInManager',
      data: {
        action: 'getCheckInStats'
      }
    });

    if (result.result.success) {
      return result.result.data;
    } else {
      console.error('获取打卡统计失败:', result.result.message);
      return null;
    }
  } catch (error) {
    console.error('获取打卡统计失败:', error);
    return null;
  }
}

/**
 * 获取近一周打卡数据
 * @returns {Promise<Array|null>} 一周打卡数据
 */
async function getWeeklyCheckInData() {
  try {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.openId) {
      return null;
    }

    const result = await wx.cloud.callFunction({
      name: 'checkInManager',
      data: {
        action: 'getWeeklyData'
      }
    });

    if (result.result.success) {
      return result.result.data;
    } else {
      console.error('获取周数据失败:', result.result.message);
      return null;
    }
  } catch (error) {
    console.error('获取周数据失败:', error);
    return null;
  }
}

module.exports = {
  recordCheckIn,
  recordLoginCheckIn,
  recordCreationCheckIn,
  getCheckInStats,
  getWeeklyCheckInData
};
