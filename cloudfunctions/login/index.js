const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  try {
    // 检查用户是否存在于数据库
    const userRes = await db.collection('users').where({
      openId: openId
    }).get();

    if (userRes.data.length === 0) {
      // 用户不存在，创建新用户
      const newUser = {
        openId: openId,
        username: event.userInfo.nickName,
        avatar: event.userInfo.avatarUrl,
        createdAt: db.serverDate()
      };

      const addRes = await db.collection('users').add({
        data: newUser
      });

      newUser._id = addRes._id;
      return {
        success: true,
        userInfo: newUser
      };
    } else {
      // 用户存在，返回最新用户信息
      const latestUser = userRes.data[0];
      return {
        success: true,
        userInfo: latestUser
      };
    }
  } catch (error) {
    console.error('登录云函数出错:', error);
    return {
      success: false,
      message: '登录失败'
    };
  }
};