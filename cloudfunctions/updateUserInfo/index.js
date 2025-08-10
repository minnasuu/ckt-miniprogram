const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { userInfo } = event;
    const updateRes = await db.collection('users').where({
      openId: userInfo.openId
    }).update({
      data: {
        username: userInfo.username,
        avatar: userInfo.avatar
      }
    });

    if (updateRes.stats.updated > 0) {
      return {
        success: true,
        message: '用户信息更新成功'
      };
    } else {
      return {
        success: false,
        message: '未找到匹配的用户记录，更新失败'
      };
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      message: '更新用户信息失败'
    };
  }
};