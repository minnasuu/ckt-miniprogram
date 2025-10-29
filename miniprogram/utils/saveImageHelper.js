/**
 * 保存图片到相册的通用工具函数
 * 包含完整的权限检查和授权流程
 */

/**
 * 保存图片到相册（带权限检查）
 * @param {string} filePath - 图片临时路径
 * @param {object} options - 配置选项
 * @param {function} options.onSuccess - 保存成功回调
 * @param {function} options.onFail - 保存失败回调
 * @param {function} options.onCancel - 用户取消回调
 */
function saveImageToAlbum(filePath, options = {}) {
  const {
    onSuccess = () => {},
    onFail = () => {},
    onCancel = () => {}
  } = options;

  // 先检查是否已授权
  wx.getSetting({
    success: (res) => {
      // 检查相册权限
      if (res.authSetting['scope.writePhotosAlbum'] === true) {
        // 已授权，直接保存
        doSaveImage(filePath, onSuccess, onFail);
      } else if (res.authSetting['scope.writePhotosAlbum'] === false) {
        // 已拒绝授权，引导用户去设置页面
        wx.showModal({
          title: '需要相册权限',
          content: '保存图片需要您授权访问相册，请在设置中开启权限',
          confirmText: '去设置',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 打开设置页面
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.writePhotosAlbum']) {
                    // 用户在设置页面授权了，保存图片
                    doSaveImage(filePath, onSuccess, onFail);
                  } else {
                    // 用户在设置页面仍未授权
                    wx.showToast({
                      title: '未授权，保存失败',
                      icon: 'none',
                      duration: 2000
                    });
                    onFail(new Error('未授权'));
                  }
                }
              });
            } else {
              // 用户取消去设置
              wx.showToast({
                title: '已取消保存',
                icon: 'none',
                duration: 1500
              });
              onCancel();
            }
          }
        });
      } else {
        // 未询问过权限（undefined），调用授权
        requestSavePermission(filePath, onSuccess, onFail, onCancel);
      }
    },
    fail: (err) => {
      console.error('获取设置失败:', err);
      // 获取设置失败，尝试直接保存（会触发授权弹窗）
      requestSavePermission(filePath, onSuccess, onFail, onCancel);
    }
  });
}

/**
 * 请求保存权限并保存
 */
function requestSavePermission(filePath, onSuccess, onFail, onCancel) {
  wx.authorize({
    scope: 'scope.writePhotosAlbum',
    success: () => {
      // 授权成功，保存图片
      doSaveImage(filePath, onSuccess, onFail);
    },
    fail: () => {
      // 用户拒绝授权
      wx.showModal({
        title: '授权失败',
        content: '保存图片需要您授权访问相册',
        confirmText: '去设置',
        cancelText: '取消',
        success: (modalRes) => {
          if (modalRes.confirm) {
            wx.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.writePhotosAlbum']) {
                  doSaveImage(filePath, onSuccess, onFail);
                } else {
                  wx.showToast({
                    title: '未授权，保存失败💔',
                    icon: 'none',
                    duration: 2000
                  });
                  onFail(new Error('未授权'));
                }
              }
            });
          } else {
            wx.showToast({
              title: '已取消保存',
              icon: 'none',
              duration: 1500
            });
            onCancel();
          }
        }
      });
    }
  });
}

/**
 * 执行保存图片操作
 */
function doSaveImage(filePath, onSuccess, onFail) {
  wx.saveImageToPhotosAlbum({
    filePath: filePath,
    success: () => {
      wx.showToast({
        title: '已保存到相册🎉',
        icon: 'none',
        duration: 2000
      });
      onSuccess();
    },
    fail: (err) => {
      console.error('保存图片失败:', err);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 2000
      });
      onFail(err);
    }
  });
}

module.exports = {
  saveImageToAlbum
};
