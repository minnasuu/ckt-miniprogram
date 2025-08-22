Page({
  data: {
    currentTab: 0, // 当前选中的tab索引
    tabList: [
      { name: '图片', type: 'images' },
      { name: '文档', type: 'documents' },
      { name: '资产', type: 'assets' }
    ],
    // 数据列表
    imageList: [], // 图片数据
    documentList: [], // 图解文档数据
    assetList: [], // 资产数据（暂时为空）
    
    // 加载状态
    imageLoading: true,
    documentLoading: true,
    assetLoading: false,
    
    // 错误状态
    imageError: false,
    documentError: false,
    assetError: false,
    
    // 错误信息
    imageErrorMsg: '',
    documentErrorMsg: '',
    assetErrorMsg: '',
    
    // 用户登录状态
    isLoggedIn: false
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    // 检查用户登录状态
    this.checkLoginStatus();
    
    // 并行加载数据
    await Promise.all([
      this.loadImageData(),
      this.loadDocumentData()
    ]);
    // 资产数据暂时为空，后续可以添加
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

  // 检查云数据库集合是否存在
  async checkCollectionExists(collectionName) {
    try {
      const db = wx.cloud.database();
      // 尝试获取集合的第一条记录来检查集合是否存在
      await db.collection(collectionName).limit(1).get();
      return true;
    } catch (error) {
      if (error.errCode === -502005) {
        console.log(`集合 ${collectionName} 不存在`);
        return false;
      }
      // 其他错误也认为集合可能存在，但有其他问题
      return true;
    }
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
      const res = await db.collection('colorCards').get();
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

  // 获取当前显示的列表数据
  getCurrentList() {
    const { currentTab, imageList, documentList, assetList } = this.data;
    switch (currentTab) {
      case 0:
        return imageList;
      case 1:
        return documentList;
      case 2:
        return assetList;
      default:
        return [];
    }
  },

  // Tab切换事件
  onTabChange(e) {
    const { index } = e.detail;
    this.setData({
      currentTab: index
    });
  },

  // 重试加载数据
  onRetryLoad(e) {
    const { type } = e.currentTarget.dataset;
    switch (type) {
      case 'images':
        this.loadImageData();
        break;
      case 'documents':
        this.loadDocumentData();
        break;
      case 'assets':
        // 资产数据加载逻辑
        break;
    }
  },

  // 获取当前显示的加载状态
  getCurrentLoadingState() {
    const { currentTab, imageLoading, documentLoading, assetLoading } = this.data;
    switch (currentTab) {
      case 0: return imageLoading;
      case 1: return documentLoading;
      case 2: return assetLoading;
      default: return false;
    }
  },

  // 获取当前显示的错误状态
  getCurrentErrorState() {
    const { currentTab, imageError, documentError, assetError } = this.data;
    switch (currentTab) {
      case 0: return imageError;
      case 1: return documentError;
      case 2: return assetError;
      default: return false;
    }
  },

  // 获取当前显示的错误信息
  getCurrentErrorMessage() {
    const { currentTab, imageErrorMsg, documentErrorMsg, assetErrorMsg } = this.data;
    switch (currentTab) {
      case 0: return imageErrorMsg;
      case 1: return documentErrorMsg;
      case 2: return assetErrorMsg;
      default: return '';
    }
  },
  onItemDeleteTap(e) {
    const { id } = e.detail;
    const { currentTab, imageList, documentList } = this.data;
    
    if (currentTab === 0) {
      // 图片类型删除
      this.deleteImageItem(id);
    } else if (currentTab === 1) {
      // 文档类型删除
      const document = documentList.find(doc => doc._id === id);
      if (document && document.type === 'pattern-note') {
        this.deletePatternItem(id);
      } else {
        wx.showToast({
          title: '该类型不支持删除',
          icon: 'none'
        });
      }
    } else {
      wx.showToast({
        title: '该类型不支持删除',
        icon: 'none'
      });
    }
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
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                this.loadImageData();
              },
              fail: err => {
                console.error('删除失败:', err);
                wx.showToast({
                  title: '删除失败',
                  icon: 'error'
                });
              }
            });
          } catch (error) {
            console.error('删除数据失败:', error);
          }
        }
      }
    });
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
    const { currentTab, documentList } = this.data;
    
    if (currentTab === 1) {
      // 文档类型，查找对应的图解文档
      const document = documentList.find(doc => doc._id === id);
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
    }
  },

  // 跳转到工具页面
  gotoTools() {
    wx.switchTab({
      url: '/pages/tools/index'
    });
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