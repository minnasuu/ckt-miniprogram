const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('updateUserInfo 云函数被调用，参数:', event);

  try {
    const { userInfo } = event;

    // 数据验证
    if (!userInfo) {
      console.error('缺少userInfo参数');
      return {
        success: false,
        message: '缺少用户信息参数'
      };
    }

    if (!userInfo.openId) {
      console.error('缺少openId字段');
      return {
        success: false,
        message: '缺少用户openId'
      };
    }

    if (!userInfo.username && !userInfo.avatar) {
      console.error('用户名和头像都为空');
      return {
        success: false,
        message: '用户名和头像不能都为空'
      };
    }

    console.log('准备更新用户信息:', {
      openId: userInfo.openId,
      username: userInfo.username,
      avatar: userInfo.avatar
    });

    // 构建更新数据
    const updateData = {};
    if (userInfo.username) {
      updateData.username = userInfo.username;
    }
    if (userInfo.avatar) {
      updateData.avatar = userInfo.avatar;
    }

    // 更新用户信息
    const updateRes = await db.collection('users').where({
      openId: userInfo.openId
    }).update({
      data: updateData
    });

    console.log('数据库更新结果:', updateRes);

    if (updateRes.stats.updated > 0) {
      console.log('用户信息更新成功');
      return {
        success: true,
        message: '用户信息更新成功',
        data: {
          updated: updateRes.stats.updated
        }
      };
    } else {
      console.log('未找到匹配的用户记录，尝试创建新记录');

      // 如果没有找到用户记录，尝试创建新记录
      try {
        const insertRes = await db.collection('users').add({
          data: {
            openId: userInfo.openId,
            username: userInfo.username || '用户',
            avatar: userInfo.avatar || '',
            createTime: new Date(),
            updateTime: new Date()
          }
        });

        console.log('创建新用户记录成功:', insertRes);
        return {
          success: true,
          message: '用户信息创建成功',
          data: {
            created: true,
            _id: insertRes._id
          }
        };
      } catch (insertError) {
        console.error('创建用户记录失败:', insertError);
        return {
          success: false,
          message: '未找到用户记录且创建失败',
          error: insertError.message
        };
      }
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      message: '更新用户信息失败: ' + error.message,
      error: error.message
    };
  }
};