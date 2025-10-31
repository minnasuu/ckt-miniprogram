// pages/collects/party-camera/index.js

Page({
  /**
   * 页面的初始数据
   */
  data: {
    photoPath: '', // 当前照片路径
    shareImagePath: '', // 分享图片路径
    showMemoryInput: false, // 是否显示纪念语输入弹窗
    memoryText: '', // 纪念语内容
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时的初始化
  },

  /**
   * 拍照功能
   */
  onTakePhoto() {
    const that = this;
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          photoPath: tempFilePath
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        if (err.errMsg.includes('cancel')) {
          // 用户取消，不显示错误提示
          return;
        }
        wx.showToast({
          title: '拍照失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 清空相框
   */
  onClearPhoto() {
    if (!this.data.photoPath) {
      wx.showToast({
        title: '相框已经是空的',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空相框中的照片吗？',
      confirmText: '清空',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            photoPath: '',
            memoryText: ''
          });
          wx.showToast({
            title: '相框已清空',
            icon: 'none',
            duration: 1500
          });
        }
      }
    });
  },

  /**
   * 添加纪念语
   */
  onAddMemory() {
    if (!this.data.photoPath) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    this.setData({
      showMemoryInput: true
    });
  },

  /**
   * 纪念语输入
   */
  onMemoryInput(e) {
    this.setData({
      memoryText: e.detail.value
    });
  },

  /**
   * 取消纪念语输入
   */
  onCancelMemory() {
    this.setData({
      showMemoryInput: false
    });
  },

  /**
   * 确认纪念语输入
   */
  onConfirmMemory() {
    this.setData({
      showMemoryInput: false
    });
    
    if (this.data.memoryText.trim()) {
      wx.showToast({
        title: '纪念语已添加',
        icon: 'none',
        duration: 1500
      });
    }
  },

  /**
   * 保存到本地
   */
  onSaveLocal() {
    if (!this.data.photoPath) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    this.saveImageToAlbum(this.data.photoPath);
  },

  /**
   * 分享给朋友
   */
  onShareFriend() {
    if (!this.data.photoPath) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 生成带相框的分享图片
    this.generateShareImage();
  },

  /**
   * 保存图片到相册（复用 ai-answer-book 的逻辑）
   */
  saveImageToAlbum(filePath) {
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    // 先检查是否已授权
    wx.getSetting({
      success: (res) => {
        wx.hideLoading();
        
        // 检查相册权限
        if (res.authSetting['scope.writePhotosAlbum'] === true) {
          // 已授权，直接保存
          this.doSaveImage(filePath);
        } else if (res.authSetting['scope.writePhotosAlbum'] === false) {
          // 已拒绝授权，引导用户去设置页面
          wx.showModal({
            title: '需要相册权限',
            content: '保存图片需要您授权访问相册，请在设置中开启权限',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.writePhotosAlbum']) {
                      this.doSaveImage(filePath);
                    } else {
                      wx.showToast({
                        title: '未授权，保存失败',
                        icon: 'none',
                        duration: 2000
                      });
                    }
                  }
                });
              }
            }
          });
        } else {
          // 未询问过权限，调用授权
          this.requestSavePermission(filePath);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取设置失败:', err);
        this.requestSavePermission(filePath);
      }
    });
  },

  /**
   * 请求保存权限并保存
   */
  requestSavePermission(filePath) {
    wx.authorize({
      scope: 'scope.writePhotosAlbum',
      success: () => {
        this.doSaveImage(filePath);
      },
      fail: () => {
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
                    this.doSaveImage(filePath);
                  } else {
                    wx.showToast({
                      title: '未授权，保存失败',
                      icon: 'none',
                      duration: 2000
                    });
                  }
                }
              });
            }
          }
        });
      }
    });
  },

  /**
   * 执行保存图片操作
   */
  doSaveImage(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({
          title: '已保存到相册🎉',
          icon: 'none',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error('保存图片失败:', err);
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 生成带相框的分享图片
   */
  generateShareImage() {
    wx.showLoading({
      title: '生成分享图片...',
      mask: true
    });

    // 获取 Canvas 实例
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          wx.hideLoading();
          wx.showToast({
            title: 'Canvas 初始化失败',
            icon: 'none'
          });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 设置 Canvas 尺寸
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = 800 * dpr;
        canvas.height = 800 * dpr;
        ctx.scale(dpr, dpr);

        // 绘制分享图片
        this.drawShareCanvas(canvas, ctx);
      });
  },

  /**
   * Canvas 绘制分享图片
   */
  drawShareCanvas(canvas, ctx) {
    // 绘制背景
    const gradient = ctx.createLinearGradient(0, 0, 800, 800);
    gradient.addColorStop(0, '#ffeaa7');
    gradient.addColorStop(1, '#fab1a0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);

    // 创建图片对象
    const img = canvas.createImage();
    img.onload = () => {
      // 绘制照片（居中，保持比例）
      const imgWidth = img.width;
      const imgHeight = img.height;
      const maxSize = 500;
      
      let drawWidth, drawHeight;
      if (imgWidth > imgHeight) {
        drawWidth = maxSize;
        drawHeight = (imgHeight / imgWidth) * maxSize;
      } else {
        drawHeight = maxSize;
        drawWidth = (imgWidth / imgHeight) * maxSize;
      }
      
      const x = (800 - drawWidth) / 2;
      const y = (800 - drawHeight) / 2 - 50;
      
      // 绘制白色相框背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 20, y - 20, drawWidth + 40, drawHeight + 40);
      
      // 绘制照片
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      
      // 绘制相框边框
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 20, y - 20, drawWidth + 40, drawHeight + 40);

      // 绘制标题
      ctx.fillStyle = '#2d3436';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('聚会相机', 400, y - 60);

      // 绘制纪念语（如果有的话）
      if (this.data.memoryText && this.data.memoryText.trim()) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'right';
        
        // 处理纪念语换行
        const memoryLines = this.wrapText(ctx, this.data.memoryText.trim(), 300);
        const lineHeight = 24;
        const startY = y + drawHeight - (memoryLines.length * lineHeight) - 10;
        
        memoryLines.forEach((line, index) => {
          ctx.fillText(line, x + drawWidth - 10, startY + index * lineHeight);
        });
      }

      // 绘制时间水印
      const now = new Date();
      const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(timeString, 760, 750);
      ctx.fillText('聚会相机 生成', 760, 770);

      // 导出图片
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (res) => {
          wx.hideLoading();
          this.shareImageToFriend(res.tempFilePath);
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('导出图片失败:', err);
          wx.showToast({
            title: '生成分享图片失败',
            icon: 'none'
          });
        }
      });
    };

    img.onerror = () => {
      wx.hideLoading();
      wx.showToast({
        title: '图片加载失败',
        icon: 'none'
      });
    };

    img.src = this.data.photoPath;
  },

  /**
   * 分享图片给微信好友
   */
  shareImageToFriend(filePath) {
    // 保存图片路径到 data
    this.setData({
      shareImagePath: filePath
    });

    // 使用 wx.showShareImageMenu 显示分享菜单
    wx.showShareImageMenu({
      path: filePath,
      success: (res) => {
        console.log('分享菜单显示成功', res);
      },
      fail: (err) => {
        console.error('显示分享菜单失败:', err);
        
        // 如果 API 不支持，提供备选方案
        wx.showModal({
          title: '分享提示',
          content: '当前微信版本不支持此功能，是否保存图片到相册后手动分享？',
          confirmText: '保存图片',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.saveImageToAlbum(filePath);
            }
          }
        });
      }
    });
  },

  /**
   * 文本换行处理
   */
  wrapText(ctx, text, maxWidth) {
    // 防御性检查
    if (!text || typeof text !== 'string') {
      return [''];
    }

    const words = text.split('');
    let line = '';
    const lines = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    
    return lines;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '聚会相机 - 记录美好时光',
      path: '/pages/collects/party-camera/index',
      imageUrl: this.data.shareImagePath || ''
    };
  }
})