// 提取图片主色页面
Page({
  data: {
    statusBarHeight: 0,
    unitImageUrl: "https://croknittime.com/images/colorcard_default.jpeg",
    unitColorArr: [ { id: "1", value: "#b9a78f" },
      { id: "2", value: "#7e6d5b" },
      { id: "3", value: "#e5e6eb" },
      { id: "4", value: "#473f3c" },
      { id: "5", value: "#623726" },
      { id: "6", value: "#cab8ba" },],
    imageUrl: '',
    imgWidth: 1000,
    imgHeight: 667,
    imgRatio: 1.5,
    colorArr: [],
    picking: false,
    filterChecked: false,
    filter: 0,
    selectedNumber:'2',
    numberSelectData: [
      { value: '1', label: '4' },
      { value: '2', label: '6' },
      { value: '3', label: '8' }
    ],
    showCanvasModal: false,
    canvasWidth: 0,
    canvasHeight: 0,
    totalCanvasHeight: 0,
    author:null,
    saving: false, // 保存中状态
    tempFilePath: '', // 临时文件路径
  },
  
  onLoad() {
    this.WxmlToCanvas = this.selectComponent('#wxml-to-canvas');
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
    // 获取当前登录用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        author: userInfo
      });
    }
  },

  // 处理图片上传事件
  onImageSelected(e) {
    const { imageUrl,width,height } = e.detail;
    this.setData({
      colorArr: [],
      imageUrl,
      imgWidth:width,
      imgHeight:height,
      imgRatio:width/height,
      tempFilePath: '' // 上传新图片时清除临时文件路径
    });
  },
  //提取图片主色入口函数
  getImgColor(){
    if(!this.data.imageUrl){
      wx.showToast({
        title: '请先上传图片喔 😉',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    // 设置picking状态为true，清除临时文件路径
    this.setData({
      picking: true,
      tempFilePath: '' // 重新提取时清除临时文件路径
    });
    
    wx.getImageInfo({
      src: this.data.imageUrl,
      success: (res) => {
        this.processImage(res.path); // 处理图片数据
      },
      fail: (error) => {
        console.error('获取图片信息失败:', error);
        wx.showToast({
          title: '获取图片失败💔',
          icon: 'none',
          duration: 1500
        });
        this.setData({
          picking: false
        });
      }
    });
  },
  // 处理图片数据
  async processImage(imgPath) {
    try {
      console.log('开始处理图片:', imgPath);
      const canvas = wx.createOffscreenCanvas({ type: '2d', width: 100, height: 100 });
      const ctx = canvas.getContext('2d');
      
      const img = canvas.createImage();
      img.src = imgPath;
      
      // 使用Promise封装图片加载
      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 100, 100);
          resolve();
        };
        
        img.onerror = () => {
          console.error('图片加载失败');
          reject(new Error('图片加载失败'));
        };
      });
      
      const imageData = ctx.getImageData(0, 0, 100, 100);
      await this.extractColors(imageData.data);
      
    } catch (error) {
      console.error('处理图片出错:', error);
      wx.showToast({
        title: '处理图片失败💔',
        icon: 'none',
        duration: 1500
      });
      this.setData({ picking: false });
    }
  },

  // 设置颜色数组
  async extractColors(pixelData) {
    const that = this;
    try {
      wx.showLoading({
        title: '提取中...',
        mask: true
      });

      that.setData({
        picking: false
      });

      await that.getTopColors(pixelData).then(colors => {
        that.setData({
          colorArr: colors.map(color => ({ value: that.rgbToHex(color[0], color[1], color[2]), lightColor: that.isLightColor(color) }))
        });
      });

      wx.showToast({
        title: '提取成功✨',
        icon: 'none',
        duration: 1500
      });
      
      wx.getImageInfo({
        src: that.data.imageUrl,
        success(res) {
          const imgWidth = res.width;
          const imgHeight = res.height;
  
          // 获取设备窗口宽度，作为 canvas 的宽度
          wx.getSystemInfo({
            success: (systemInfo) => {
              const padding = 20; // 四周留白 20px
              const canvasWidth = systemInfo.windowWidth - 48;
              const actualCanvasWidth = canvasWidth - 2 * padding; // 减去左右留白后的实际宽度
  
              // 计算按比例缩放后的图片高度
              const imgCanvasHeight = (actualCanvasWidth && imgWidth && imgHeight) ?
                (actualCanvasWidth * imgHeight) / imgWidth : 200; // 默认高度 200
  
              const newColorArr = that.data.colorArr;
              const circleGap = 12;
              const colorArrLength = newColorArr.length;

              // 当没有颜色时，不显示颜色区域
              let colorSectionHeight = 0;
              let gapBetweenImageAndColors = 0;

              if (colorArrLength > 0) {
                const circleSize = (actualCanvasWidth - circleGap * (colorArrLength - 1)) / colorArrLength; // 圆形的直径
                colorSectionHeight = circleSize > 0 ? circleSize : 0;
                gapBetweenImageAndColors = 20;
              }

              // 计算总的 canvas 高度
              let totalCanvasHeight = imgCanvasHeight + gapBetweenImageAndColors + colorSectionHeight + 2 * padding; // 加上上下留白

              // 确保 totalCanvasHeight 是一个有效的数值
              if (!totalCanvasHeight || isNaN(totalCanvasHeight) || totalCanvasHeight <= 0) {
                totalCanvasHeight = imgCanvasHeight + 2 * padding; // 最小高度：图片高度 + 上下留白
              }

              that.setData({
                canvasWidth: canvasWidth,
                canvasHeight: imgCanvasHeight,
                totalCanvasHeight: totalCanvasHeight
              });
              // 获取 canvas 上下文
              const ctx = wx.createCanvasContext('colorCardCanvas');
  
              // 绘制白色背景
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvasWidth, totalCanvasHeight);
  
              // 调整图片绘制位置，考虑留白
              const imgX = padding;
              const imgY = padding;
              ctx.drawImage(that.data.imageUrl, imgX, imgY, actualCanvasWidth, imgCanvasHeight);

              // 只在有颜色时绘制颜色圆形
              if (colorArrLength > 0 && colorSectionHeight > 0) {
                const circleSize = (actualCanvasWidth - circleGap * (colorArrLength - 1)) / colorArrLength;

              // 计算所有圆形占据的总宽度（包含间隔）
                const totalCirclesWidth = newColorArr.length * circleSize + (newColorArr.length - 1) * circleGap;

                // 计算起始 x 坐标，实现类似 space-between 的效果，考虑留白
                const startX = imgX + (actualCanvasWidth - totalCirclesWidth) / 2;
                const startY = imgY + imgCanvasHeight + gapBetweenImageAndColors;

                // 绘制颜色圆形
                newColorArr.forEach((colorItem, index) => {
                  const centerX = startX + index * (circleSize + circleGap) + circleSize / 2;
                  const centerY = startY + circleSize / 2;

                  ctx.beginPath();
                  ctx.arc(centerX, centerY, circleSize / 2, 0, 2 * Math.PI);
                  ctx.fillStyle = colorItem.value;
                  ctx.fill();

                  // 如果是浅色，绘制边框
                  if (colorItem.lightColor) {
                    ctx.strokeStyle = '#E8E8E8'; // 3号灰色
                    ctx.lineWidth = 1;
                    ctx.stroke();
                  }

                  ctx.closePath();
                });
              }

              ctx.draw(false, () => {
                // canvas 绘制完成后，生成临时文件路径以备保存使用
                setTimeout(() => {
                  wx.canvasToTempFilePath({
                    canvasId: 'colorCardCanvas',
                    fileType: 'png',
                    quality: 1,
                    success: (res) => {
                      that.setData({
                        tempFilePath: res.tempFilePath
                      });
                      console.log('Canvas 绘制完成，临时文件路径:', res.tempFilePath);
                    },
                    fail: (error) => {
                      console.error('生成临时文件路径失败:', error);
                    }
                  });
                }, 100); // 延迟一下确保绘制完成
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('提取颜色失败:', error);
      wx.showToast({
        title: `提取失败: ${error.message || '未知错误'}`,
        icon: 'none',
        duration: 3000
      });
      that.setData({ picking: false });
    } finally {
      wx.hideLoading();
    }
  },

  //根据像素获取主色
  async getTopColors(pixelData) {
    try {
      if (!pixelData || pixelData.length === 0) {
        wx.showToast({
          title: '未获取到有效像素数据💔',
          icon: 'none',
          duration: 1500
        });
        return [];
      }

      // 统计颜色出现频率
      const colorCountMap = new Map();
      
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        // 跳过透明度为0的像素
        if (pixelData[i + 3] === 0) continue;
        
        const key = `${r},${g},${b}`;
        colorCountMap.set(key, (colorCountMap.get(key) || 0) + 1);
      }

      // 检查是否有有效颜色数据
      if (colorCountMap.size === 0) {
        wx.showToast({
          title: '图片中没有有效颜色数据',
          icon: 'none',
          duration: 1500
        });
        return [];
      }
      
      console.log(`找到 ${colorCountMap.size} 种不同的颜色`);

      // 排序并过滤颜色
      const sortedColors = Array.from(colorCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => {
          // 确保entry[0]是字符串类型
          const colorKey = String(entry[0]);
          const colorValues = colorKey.split(',');
          return [
            parseInt(colorValues[0], 10) || 0,
            parseInt(colorValues[1], 10) || 0,
            parseInt(colorValues[2], 10) || 0
          ];
        });

      const filteredColors = [];
      const maxNum = this.data.numberSelectData.filter(i=>i.value == this.data.selectedNumber)[0].label;
      const maxColors = Number(maxNum);
      const similarityThreshold = 32;

      for (const color of sortedColors) {
        if (filteredColors.length >= maxColors) break;
        
        // 检查是否需要过滤中性色
        const shouldFilterGray = this.data.filterChecked && this.isGrayColor(color);
        const isSimilarToExisting = filteredColors.some(c => this.areColorsSimilar(color, c, similarityThreshold));

        if (!shouldFilterGray && !isSimilarToExisting) {
          filteredColors.push(color);
        }
      }

      console.log(`过滤后得到 ${filteredColors.length} 种颜色:`, filteredColors);
      return filteredColors;
      
    } catch (error) {
      console.error('提取主色失败:', error);
      wx.showToast({
        title: '提取颜色失败💔',
        icon: 'none',
        duration: 1500
      });
      this.setData({ picking: false });
      return [];
    }
  },

  // 中性色判断
  isGrayColor(color){
    const filter = this.data.filter;
    const hsv = this.rgbToHsv(color[0], color[1], color[2]);
    if (hsv.s <= filter / 100 || hsv.v <= filter / 100) {
      return true;
    } else {
      return false;
    }
  },
  // 判断颜色是否为浅色
  isLightColor(color) {
    const hsv = this.rgbToHsv(color[0], color[1], color[2]);
    return hsv.v > 0.5;
  },
  // 颜色相似度判断
  areColorsSimilar(color1, color2, threshold = 32) {
    const rDiff = color1[0] - color2[0];
    const gDiff = color1[1] - color2[1];
    const bDiff = color1[2] - color2[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff) < threshold;
  },
  
  // 复制颜色代码
  copyColor(e) {
    const { color } = e.currentTarget.dataset;
    wx.setClipboardData({
      data: color,
      success: () => {
        wx.showToast({
          title: '颜色已复制☺️',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },
  // 中性色开关
  onCheckboxChange(e) {
    this.setData({
      filterChecked: e.detail,
      filter:10
    })
    this.getImgColor();
  },
  // 中性色过滤值改变
  onFilterNumberChange(e) {
    this.setData({
      filter: e.detail
    })
    if(e.detail == 0){
      this.setData({
        filterChecked: false
      })
    }
    this.getImgColor()
  },
  // 颜色数量选择
  onSelectNumberChange(e) {
    this.setData({
      selectedNumber: e.detail.value
    })
    this.getImgColor();
  },
  // 保存颜色卡至仓库
  async saveColorCard() {
    if (!this.data.author) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再保存作品到仓库',
        confirmText: '马上登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 跳转到登录页面或触发登录流程
            wx.navigateTo({
              url: '/pages/user-center/index'
            });
          }
        }
      });
      return;
    }

    if (!this.data.colorArr.length) {
      wx.showToast({
        title: '请先提取颜色后再保存☺️',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    if (this.data.saving) {
      return; // 防止重复点击
    }

    // 设置保存中状态
    this.setData({ saving: true });

    // 如果有临时文件路径，直接使用
    if (this.data.tempFilePath) {
      console.log('使用已有临时文件路径:', this.data.tempFilePath);
      this.uploadToCloudStorage(this.data.tempFilePath);
      return;
    }

    // 生成临时文件路径
    this.generateTempFilePathAndSave();
  },

  // 生成临时文件路径并保存
  generateTempFilePathAndSave() {
    wx.canvasToTempFilePath({
      canvasId: 'colorCardCanvas',
      fileType: 'png',
      quality: 1,
      success: (res) => {
        console.log('生成临时文件路径:', res.tempFilePath);

        // 更新临时文件路径
        this.setData({
          tempFilePath: res.tempFilePath
        });

        // 开始上传
        this.uploadToCloudStorage(res.tempFilePath);
      },
      fail: (error) => {
        console.error('生成临时文件路径失败:', error);
        this.setData({ saving: false });
        wx.showToast({
          title: '生成临时文件失败，请重试💔',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 上传到云存储
  uploadToCloudStorage(tempFilePath) {
    wx.cloud.uploadFile({
      cloudPath: `colorCards/${Date.now()}.png`,
      filePath: tempFilePath,
      success: (uploadRes) => {
        const fileID = uploadRes.fileID;
        console.log('文件上传成功，fileID:', fileID);

        // 将文件 ID 保存到云数据库
        const db = wx.cloud.database();
        db.collection('colorCards').add({
          data: {
            fileID: fileID,
            createTime: db.serverDate(),
            tag: '提取主色',
            author: this.data.author,
            width: this.data.canvasWidth,
            height: this.data.totalCanvasHeight,
            // 保存提取的颜色信息
            colors: this.data.colorArr,
            filterSettings: {
              filterChecked: this.data.filterChecked,
              filter: this.data.filter,
              selectedNumber: this.data.selectedNumber
            }
          },
          success: () => {
            // 记录创作打卡
            const { recordCreationCheckIn } = require('../../../utils/checkInUtils');
            recordCreationCheckIn(1);

            this.setData({ saving: false });
            wx.showToast({
              title: `保存成功🎉\n前往个人中心-我的创作查看`,
              icon: 'none',
              duration: 1500
            });
          },
          fail: (err) => {
            console.error('保存到云数据库失败', err);
            this.setData({ saving: false });
            wx.showToast({
              title: '保存失败💔',
              icon: 'none',
              duration: 1500
            });
          }
        });
      },
      fail: (err) => {
        console.error('文件上传失败', err);
        this.setData({ saving: false });
        wx.showToast({
          title: '上传失败💔',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 保存颜色卡至本地
  downloadColorCard() {
    const that = this;
    // 获取 canvas 的临时文件路径
    wx.canvasToTempFilePath({
      canvasId: 'colorCardCanvas',
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        // 请求用户授权保存图片到相册的权限
        wx.getSetting({
          success: (settingRes) => {
            if (!settingRes.authSetting['scope.writePhotosAlbum']) {
              wx.authorize({
                scope: 'scope.writePhotosAlbum',
                success: () => {
                  // 授权成功，保存图片到相册
                  that.saveImageToAlbum(tempFilePath);
                },
                fail: () => {
                  // 用户拒绝授权，提示用户手动开启权限
                  wx.showModal({
                    title: '提示',
                    content: '需要您授权保存图片到相册，请前往设置开启权限',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        wx.openSetting();
                      }
                    }
                  });
                }
              });
            } else {
              // 已经授权，直接保存图片到相册
              that.saveImageToAlbum(tempFilePath);
            }
          }
        });
      },
      fail: (err) => {
        console.error('获取 canvas 临时文件路径失败:', err);
        wx.showToast({
          title: '保存失败，请重试💔',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 保存图片到相册的方法（优化版：带权限检查）
  saveImageToAlbum(tempFilePath) {
    const saveHelper = require('../../../utils/saveImageHelper.js');
    saveHelper.saveImageToAlbum(tempFilePath, {
      onSuccess: () => {
        console.log('保存成功');
      },
      onFail: (err) => {
        console.error('保存图片到相册失败:', err);
      },
      onCancel: () => {
        console.log('用户取消保存');
      }
    });
  },

  // RGB转HSV
  rgbToHsv(r, g, b) {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;
    
    if (diff !== 0) {
      switch (max) {
        case r:
          h = 60 * ((g - b) / diff + (g < b ? 6 : 0));
          break;
        case g:
          h = 60 * ((b - r) / diff + 2);
          break;
        case b:
          h = 60 * ((r - g) / diff + 4);
          break;
      }
    }
    
    return {
      h: Math.round(h),
      s: Math.round(s * 100) / 100,
      v: Math.round(v * 100) / 100
    };
  },
  // RGB转HEX
  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return '#' + toHex(r) + toHex(g) + toHex(b);
  },
  // 长按复制颜色值
  handleCopyColor(e) {
    const color = e.currentTarget.dataset.color;
    wx.setClipboardData({
      data: color,
      success: () => {
        wx.showToast({
          title: '颜色值已复制🎉',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },
  hideCanvasModal() {
    this.setData({
      showCanvasModal: false
    });
  },
});