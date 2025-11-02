// pages/collects/party-camera/index.js

Page({
  /**
   * 页面的初始数据
   */
  data: {
    photoPath: '', // 当前照片路径
    shareImagePath: '', // 分享图片路径
    showMemoryInput: false, // 是否显示纪念语输入弹窗
    memoryText: '输入纪念语...', // 纪念语内容
    currentTime: '', // 当前时间
    currentLocation: '', // 当前位置
    memberList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时的初始化
    this.updateCurrentTime();
    // 每秒更新时间
    this.timeInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  },

  /**
   * 更新当前时间
   */
  updateCurrentTime() {
    const now = new Date();
    const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.setData({
      currentTime: timeString
    });
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

        // 拍照成功后自动获取定位
        that.getCurrentLocation();
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
   * 获取当前定位
   */
  getCurrentLocation() {
    const that = this;

    // 先检查是否已授权
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation'] === true) {
          // 已授权，直接获取定位
          that.getLocation();
        } else if (res.authSetting['scope.userLocation'] === false) {
          // 已拒绝授权，引导用户去设置页面
          wx.showModal({
            title: '需要定位权限',
            content: '获取位置信息需要您授权定位权限，以便记录拍照地点',
            confirmText: '去设置',
            cancelText: '跳过',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      that.getLocation();
                    }
                  }
                });
              } else {
                // 用户选择跳过，使用默认位置
                that.setData({
                  currentLocation: '未知位置'
                });
              }
            }
          });
        } else {
          // 未询问过权限，请求授权
          that.requestLocationPermission();
        }
      },
      fail: () => {
        // 获取设置失败，直接尝试获取定位
        that.requestLocationPermission();
      }
    });
  },

  /**
   * 请求定位权限
   */
  requestLocationPermission() {
    const that = this;

    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        that.getLocation();
      },
      fail: () => {
        // 用户拒绝授权
        wx.showModal({
          title: '定位权限',
          content: '获取位置信息需要您授权定位权限，是否开启？',
          confirmText: '去设置',
          cancelText: '跳过',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.userLocation']) {
                    that.getLocation();
                  }
                }
              });
            } else {
              that.setData({
                currentLocation: '未知位置'
              });
            }
          }
        });
      }
    });
  },

  /**
   * 获取定位信息
   */
  getLocation() {
    const that = this;

    wx.showLoading({
      title: '获取位置中...',
      mask: true
    });

    wx.getLocation({
      type: 'gcj02', // 使用 gcj02 坐标系，适用于国内地图服务
      isHighAccuracy: true, // 开启高精度定位
      highAccuracyExpireTime: 5000, // 高精度定位超时时间 5秒
      success: (res) => {
        const latitude = res.latitude;
        const longitude = res.longitude;
        const accuracy = res.accuracy;

        console.log('定位成功:', { latitude, longitude, accuracy });

        // 使用逆地址解析获取地址信息
        that.reverseGeocoding(latitude, longitude);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取定位失败:', err);

        // 根据错误类型给出不同提示
        let errorMsg = '定位失败';
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          errorMsg = '定位权限被拒绝';
        } else if (err.errMsg && err.errMsg.includes('timeout')) {
          errorMsg = '定位超时，请重试';
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          errorMsg = '定位服务不可用';
        }

        that.setData({
          currentLocation: errorMsg
        });

        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 逆地址解析（坐标转地址）
   * 使用腾讯位置服务 API，需要配置 key
   */
  reverseGeocoding(latitude, longitude) {
    const that = this;

    // 腾讯位置服务密钥（需要在 https://lbs.qq.com/ 申请）
    const TENCENT_MAP_KEY = 'YOUR_TENCENT_MAP_KEY';

    // 如果没有配置密钥，只显示经纬度
    if (TENCENT_MAP_KEY === 'YOUR_TENCENT_MAP_KEY') {
      wx.hideLoading();
      console.warn('未配置腾讯地图密钥，仅显示经纬度');
      that.setData({
        currentLocation: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
      });
      return;
    }

    // 调用腾讯位置服务逆地址解析 API
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${latitude},${longitude}`,
        key: TENCENT_MAP_KEY,
        get_poi: 1, // 返回 POI（兴趣点）信息
        output: 'json'
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();

        if (res.statusCode === 200 && res.data.status === 0) {
          const result = res.data.result;
          let locationText = '';

          // 优先级1: 使用最近的 POI 信息（如：星巴克、北京大学）
          if (result.pois && result.pois.length > 0) {
            locationText = result.pois[0].title;
          }
          // 优先级2: 使用推荐格式化地址
          else if (result.formatted_addresses && result.formatted_addresses.recommend) {
            locationText = result.formatted_addresses.recommend;
          }
          // 优先级3: 使用标准地址并简化
          else if (result.address_component) {
            const ac = result.address_component;
            // 组合：区县 + 街道 + 街道号
            if (ac.street) {
              locationText = `${ac.district || ''}${ac.street}${ac.street_number || ''}`;
            } else if (ac.district) {
              locationText = ac.district;
            } else {
              locationText = result.address || '未知位置';
            }
          }

          // 去除多余空格
          locationText = locationText.trim() || '未知位置';

          that.setData({
            currentLocation: locationText
          });

          console.log('逆地址解析成功:', locationText);
        } else {
          // API 返回错误状态
          console.error('逆地址解析失败:', res.data);
          that.setData({
            currentLocation: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('逆地址解析请求失败:', err);

        // 网络请求失败，显示经纬度
        that.setData({
          currentLocation: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
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
            memoryText: '输入纪念语...',
            currentLocation: ''
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
      this.setData({
        showMemoryInput: false
      })
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
    // 创建图片对象
    const img = canvas.createImage();
    img.onload = () => {
      // 直接让照片填满整个画布
      ctx.drawImage(img, 0, 0, 800, 800);

      // 绘制纪念语（如果有的话）
      if (this.data.memoryText && this.data.memoryText.trim()) {
        // 绘制纪念语背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        
        // 计算纪念语文本尺寸
        ctx.font = '24px sans-serif';
        const memoryLines = this.wrapText(ctx, this.data.memoryText.trim(), 350);
        const lineHeight = 28;
        const padding = 12;
        const textWidth = Math.max(...memoryLines.map(line => ctx.measureText(line).width));
        const textHeight = memoryLines.length * lineHeight;
        
        // 绘制纪念语背景框
        const bgX = 16;
        const bgY = 800 - textHeight - padding * 2 - 60; // 为时间水印留出空间
        const bgWidth = textWidth + padding * 2;
        const bgHeight = textHeight + padding * 2;
        
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        // 绘制纪念语文本
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        
        memoryLines.forEach((line, index) => {
          ctx.fillText(line, bgX + padding, bgY + padding + (index + 1) * lineHeight);
        });
      }

      // 绘制时间和位置水印
      const now = new Date();
      const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // 时间水印背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.font = '20px sans-serif';
      const timeWidth = ctx.measureText(timeString).width;

      // 位置信息
      const locationText = this.data.currentLocation || '';
      ctx.font = '16px sans-serif';
      const locationWidth = locationText ? ctx.measureText('📍 ' + locationText).width : 0;

      const appText = '聚会相机 生成';
      const appWidth = ctx.measureText(appText).width;

      const maxWidth = Math.max(timeWidth, locationWidth, appWidth);
      const lineCount = locationText ? 3 : 2;
      const bgHeight = lineCount * 20 + 8;
      
      const timeX = 800 - maxWidth - 32;
      const timeY = 800 - bgHeight - 8;
      ctx.fillRect(timeX, timeY, maxWidth + 16, bgHeight);
      
      // 绘制时间文本
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(timeString, timeX + 8, timeY + 20);
      
      // 绘制位置信息（如果有）
      if (locationText) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText('📍 ' + locationText, timeX + 8, timeY + 38);
      }

      // 绘制应用信息
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const appY = locationText ? timeY + 56 : timeY + 36;
      ctx.fillText(appText, timeX + 8, appY);

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
    // 清理定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
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