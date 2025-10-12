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
        username: event.userInfo.nickName || '用户' + Math.random().toString(36).substr(2, 6),
        avatar: event.userInfo.avatarUrl || '/images/default-avatar.png',
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
      // 用户存在，检查是否需要更新头像和昵称
      const existingUser = userRes.data[0];
      const shouldUpdate = event.userInfo.nickName && event.userInfo.avatarUrl;

      if (shouldUpdate) {
        // 更新用户头像和昵称
        const updateRes = await db.collection('users').where({
          openId: openId
        }).update({
          data: {
            username: event.userInfo.nickName,
            avatar: event.userInfo.avatarUrl
          }
        });

        if (updateRes.stats.updated > 0) {
          // 更新成功，返回更新后的用户信息
          const updatedUser = {
            ...existingUser,
            username: event.userInfo.nickName,
            avatar: event.userInfo.avatarUrl
          };
          return {
            success: true,
            userInfo: updatedUser
          };
        }
      }

      // 返回现有用户信息
      return {
        success: true,
        userInfo: existingUser
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