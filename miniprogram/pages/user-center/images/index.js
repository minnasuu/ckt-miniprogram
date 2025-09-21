Page({
  data: {
    // 数据列表
    imageList: [], // 图片数据
    allImageList: [], // 全部图片数据（用于筛选）

    // 类别相关
    categoryList: [
      { name: '全部', type: 'all' },
      { name: '提取主色', type: 'extract-color', tag: '提取主色' },
      { name: '图片换色', type: 'color-change', tag: '图片换色' },
      { name: '图片转像素', type: 'image-to-pixel', tag: ['像素化(合并算法)', '像素化(平均算法)'] },
      { name: '像素画板', type: 'pixel-canvas', tag: '像素画板' },
      { name: '图案配色', type: 'color-palette', tag: '配色' },
      { name: '图解笔记', type: 'pattern-note', tag: '图解笔记' }
    ],
    currentCategory: 'all', // 当前选中的类别
    
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
        allImageList: resData,
        imageList: resData,
        imageLoading: false
      });

      // 应用当前选中的类别筛选
      this.filterImagesByCategory(this.data.currentCategory);
    } catch (error) {
      console.error('获取图片数据失败:', error);
      
      // 根据不同错误类型提供不同的错误信息
      let errorMsg = '加载图片失败，请点击重试';
      
      if (error.errCode === -502005) {
        // 集合不存在，说明用户还没有创建过任何图片
        this.setData({
          allImageList: [],
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
  },

  // 处理类别切换
  onCategoryChange(e) {
    const { type } = e.detail;
    console.log('切换到类别:', type);

    this.setData({
      currentCategory: type
    });

    // 根据类别筛选图片
    this.filterImagesByCategory(type);
  },

  // 根据类别筛选图片
  filterImagesByCategory(category) {
    const { allImageList, categoryList } = this.data;

    if (category === 'all') {
      // 显示全部图片
      this.setData({
        imageList: allImageList
      });
    } else {
      // 找到对应的类别配置
      const categoryConfig = categoryList.find(item => item.type === category);

      if (!categoryConfig) {
        this.setData({ imageList: [] });
        return;
      }

      // 根据tag字段筛选图片
      const filteredList = allImageList.filter(item => {
        if (!item.tag) return false;

        // 如果tag是数组，检查是否包含任一标签
        if (Array.isArray(categoryConfig.tag)) {
          return categoryConfig.tag.includes(item.tag);
        } else {
          // 如果tag是字符串，直接匹配
          return item.tag === categoryConfig.tag;
        }
      });

      this.setData({
        imageList: filteredList
      });
    }
  }
});
