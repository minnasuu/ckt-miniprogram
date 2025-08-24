Page({
  data: {
    // 数据列表
    imageList: [], // 图片数据
    
    // 加载状态
    imageLoading: true,
    
    // 错误状态
    imageError: false,
    
    // 错误信息
    imageErrorMsg: '',
    
    // 用户登录状态
    isLoggedIn: false,

    // 提示信息
    alertMessage: '',
    showAlert: false,
    alertType: 'info'
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    // 检查用户登录状态
    this.checkLoginStatus();
    
    // 加载图片数据
    await this.loadImageData();
  },

  // 检查用户登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const isLoggedIn = !!(userInfo.openId);
    this.setData({
      isLoggedIn: isLoggedIn
    });
    return isLoggedIn;
  },

  // 加载图片数据
  async loadImageData() {
    this.setData({
      imageLoading: true,
      imageError: false,
      imageErrorMsg: ''
    });
    
    const db = wx.cloud.database();
    try {
      const res = await db.collection('colorCards').where({
        author: wx.getStorageSync('userInfo').author
      }).orderBy('createTime', 'desc').get();
      const images = res.data;
      const resData = [];

      for (let i = 0; i < images.length; i++) {
        try {
          const tempUrl = await wx.cloud.getTempFileURL({
            fileList: [images[i].fileID]
          });
          resData.push(Object.assign(images[i], {
            image: tempUrl.fileList[0].tempFileURL
          }));
        } catch (urlError) {
          console.error('获取图片URL失败:', urlError);
          // 即使图片URL获取失败，也要保留记录
          resData.push(Object.assign(images[i], {
            image: ''
          }));
        }
      }
      
      this.setData({
        imageList: resData,
        imageLoading: false
      });
    } catch (error) {
      console.error('获取图片数据失败:', error);
      
      // 根据不同错误类型提供不同的错误信息
      let errorMsg = '加载图片失败，请点击重试';
      
      if (error.errCode === -502005) {
        // 集合不存在，说明用户还没有创建过任何图片
        this.setData({
          imageList: [],
          imageLoading: false
        });
        return;
      } else if (error.errCode === -502001) {
        // 权限错误
        errorMsg = '没有权限访问图片数据';
      } else if (error.errCode === -502002) {
        // 网络错误
        errorMsg = '网络连接失败，请检查网络后重试';
      } else if (error.message && error.message.includes('timeout')) {
        // 超时错误
        errorMsg = '请求超时，请稍后重试';
      }
      
      this.setData({
        imageLoading: false,
        imageError: true,
        imageErrorMsg: errorMsg
      });
    }
  },

  // 重试加载数据
  onRetryLoad() {
    this.loadImageData();
  },

  // 删除图片项目
  onItemDeleteTap(e) {
    const { id } = e.detail;
    this.deleteImageItem(id);
  },

  // 删除图片项目
  deleteImageItem(id) {
    const db = wx.cloud.database();
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个图片吗？删除后无法恢复。',
      confirmColor: '#F35A75',
      success: (res) => {
        if (res.confirm) {
          try {
            db.collection('colorCards').doc(id).remove({
              success: res => {
                console.log('删除成功:', res);
                this.showMessage('删除成功', 'success');
                this.loadImageData();
              },
              fail: err => {
                console.error('删除失败:', err);
                this.showMessage('删除失败', 'error');
              }
            });
          } catch (error) {
            console.error('删除数据失败:', error);
          }
        }
      }
    });
  },

  // 跳转到工具页面
  gotoTools() {
    wx.switchTab({
      url: '/pages/tools/index'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },
  showMessage(msg, type) {
    this.setData({
      alertMessage: msg,
      showAlert: true,
      alertType: type
    });
  },
  onItemTap(e) {
    const { image } = e.detail;
    wx.previewImage({
      current: image, // 当前显示图片
      urls: this.data.imageList.map(item => item.image), // 所有图片列表
      showmenu: true // 显示长按菜单
    });
  }
});
