Page({
  data: {
    // 数据列表
    documentList: [], // 图解文档数据
    
    // 加载状态
    documentLoading: true,
    
    // 错误状态
    documentError: false,
    
    // 错误信息
    documentErrorMsg: '',
    
    // 用户登录状态
    isLoggedIn: false
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    // 检查用户登录状态
    this.checkLoginStatus();
    
    // 加载文档数据
    await this.loadDocumentData();
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

  // 加载图解文档数据
  async loadDocumentData() {
    this.setData({
      documentLoading: true,
      documentError: false,
      documentErrorMsg: ''
    });
    
    try {
      // 获取当前用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      if (!userInfo.openId) {
        this.setData({
          documentLoading: false,
          documentList: []
        });
        return;
      }

      const db = wx.cloud.database();
      
      // 先检查patterns集合是否存在，如果不存在则创建
      let res;
      try {
        // 从patterns集合获取用户保存的图解文档
        res = await db.collection('patterns')
          .where({
            authorId: userInfo.openId,
            type: 'pattern-note'
          })
          .orderBy('createTime', 'desc')
          .get();
      } catch (collectionError) {
        // 如果是集合不存在的错误
        if (collectionError.errCode === -502005) {
          console.log('patterns集合不存在，用户暂无图解文档');
          this.setData({
            documentList: [],
            documentLoading: false
          });
          return;
        }
        // 其他错误继续抛出
        throw collectionError;
      }
      
      const patterns = res.data;
      const resData = [];

      // 为每个图解文档获取临时文件URL
      for (let i = 0; i < patterns.length; i++) {
        try {
          const tempUrl = await wx.cloud.getTempFileURL({
            fileList: [patterns[i].imageUrl]
          });
          resData.push({
            _id: patterns[i]._id,
            title: patterns[i].title,
            type: 'pattern-note',
            image: tempUrl.fileList[0].tempFileURL,
            createTime: patterns[i].createTime,
            tag: patterns[i].tag || '图解笔记',
            author: {
              username: patterns[i].author,
              avatar: userInfo.avatar || '/assets/images/default-avatar.png'
            },
            content: patterns[i].content // 保存原始内容数据
          });
        } catch (urlError) {
          console.error('获取图片临时URL失败:', urlError);
          // 即使图片URL获取失败，也要保留文档记录
          resData.push({
            _id: patterns[i]._id,
            title: patterns[i].title,
            type: 'pattern-note',
            image: '', // 空图片
            createTime: patterns[i].createTime,
            tag: patterns[i].tag || '图解笔记',
            author: {
              username: patterns[i].author,
              avatar: userInfo.avatar || '/assets/images/default-avatar.png'
            },
            content: patterns[i].content
          });
        }
      }
      
      this.setData({
        documentList: resData,
        documentLoading: false
      });
    } catch (error) {
      console.error('获取图解文档数据失败:', error);
      
      // 根据不同错误类型提供不同的错误信息
      let errorMsg = '加载文档失败，请点击重试';
      
      if (error.errCode === -502005) {
        // 集合不存在（理论上不会到这里，因为上面已经处理了）
        errorMsg = '图解文档功能暂未初始化';
      } else if (error.errCode === -502001) {
        // 权限错误
        errorMsg = '没有权限访问图解文档';
      } else if (error.errCode === -502002) {
        // 网络错误
        errorMsg = '网络连接失败，请检查网络后重试';
      } else if (error.message && error.message.includes('timeout')) {
        // 超时错误
        errorMsg = '请求超时，请稍后重试';
      }
      
      this.setData({
        documentLoading: false,
        documentError: true,
        documentErrorMsg: errorMsg
      });
    }
  },

  // 重试加载数据
  onRetryLoad() {
    this.loadDocumentData();
  },

  // 删除文档项目
  onItemDeleteTap(e) {
    const { id } = e.detail;
    const document = this.data.documentList.find(doc => doc._id === id);
    if (document && document.type === 'pattern-note') {
      this.deletePatternItem(id);
    } else {
      wx.showToast({
        title: '该类型不支持删除',
        icon: 'none'
      });
    }
  },

  // 删除图解笔记项目
  deletePatternItem(id) {
    const db = wx.cloud.database();
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个图解文档吗？删除后无法恢复。',
      confirmColor: '#F35A75',
      success: (res) => {
        if (res.confirm) {
          try {
            db.collection('patterns').doc(id).remove({
              success: res => {
                console.log('图解文档删除成功:', res);
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                this.loadDocumentData();
              },
              fail: err => {
                console.error('图解文档删除失败:', err);
                wx.showToast({
                  title: '删除失败',
                  icon: 'error'
                });
              }
            });
          } catch (error) {
            console.error('删除图解文档失败:', error);
          }
        }
      }
    });
  },

  // 处理文档项目点击事件
  onItemTap(e) {
    const { id } = e.detail;
    const document = this.data.documentList.find(doc => doc._id === id);
    
    if (document && document.type === 'pattern-note') {
      // 图解笔记类型，可以选择预览或编辑
      wx.showActionSheet({
        itemList: ['预览图解', '编辑图解'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 预览图解 - 显示图片预览
            if (document.image) {
              wx.previewImage({
                urls: [document.image],
                current: document.image
              });
            } else {
              wx.showToast({
                title: '图片加载失败',
                icon: 'none'
              });
            }
          } else if (res.tapIndex === 1) {
            // 编辑图解 - 跳转到pattern-note页面
            // 注意：这里需要传递文档数据，让pattern-note页面能够加载
            wx.showToast({
              title: '编辑功能开发中',
              icon: 'none'
            });
          }
        }
      });
    }
  },

  // 跳转到图解笔记本
  gotoPatternNote() {
    wx.navigateTo({
      url: '/pages/tools/pattern-note/index'
    });
  },

  // 跳转到登录页面
  gotoLogin() {
    wx.switchTab({
      url: '/pages/user-center/index'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
