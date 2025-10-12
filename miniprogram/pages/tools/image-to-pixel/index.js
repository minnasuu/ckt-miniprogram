// 图片转像素页面
const LoginUtils = require('../../../utils/loginUtils');
const { addWatermarkToCanvas } = require('../../../utils/watermarkUtils');

Page({
  data: {
    imageUrl: '',
    imgSize: {
      w: 100,
      h: 100
    },
    imgData:null,
    finished: false,
    pixelSize: 10,
    pixelMax: 100,
    loading:false,
    pixelatedImageSrc:'',
    pixelatedImageSrc2:'',
    resultWidth: 342,
    showAlert: false,
    alertMessage: '',
    author:null,
    saveLoading: false,
    loginLoading: false,
    showPermissionDialog: false // 控制权限提示弹窗
  },
  
  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        author: userInfo
      });
    }
  },
  
  // 显示提示框
  showMessage(msg) {
    this.setData({
      showAlert: true,
      alertMessage: msg
    });
    
    // 2秒后自动隐藏
    setTimeout(() => {
      this.setData({
        showAlert: false,
        alertMessage:''
      });
    }, 1000);
  },

  // 关闭权限提示弹窗
  onPermissionDialogClose() {
    this.setData({
      showPermissionDialog: false
    });
  },
  // 处理图片选择事件
  onImageSelected(e) {
    const { imageUrl,width,height,size } = e.detail;
    const info = wx.getWindowInfo();
    const resultWidth = info.screenWidth - 48;
    this.setData({
      imageUrl,
      // 清空之前的像素化结果与预览
      pixelatedImageSrc: '',
      pixelatedImageSrc2: '',
      imgSize: {
        w: width,
        h: height
      },
      resultWidth,
      finished: false,
      pixelSize: Math.ceil(Math.min(width, height) / 50),
      pixelMax: Math.ceil(Math.min(width, height) / 20)
    });
    // 同步清空像素化画布内容
    wx.createSelectorQuery()
      .select('#pixelatedCanvasRef')
      .fields({ node: true, size: true })
      .exec((r) => {
        if (!r || !r[0]) return;
        const pixelCanvas = r[0].node;
        const pctx = pixelCanvas.getContext('2d');
        if (pctx) {
          pctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);
        }
      });
    const query = wx.createSelectorQuery();
    query.select('#canvasRef')
      .fields({ node: true, size: true })
      .exec((res) => {
       const canvas = res[0].node;
        // 设置canvas的实际尺寸
        canvas.width = width;
        canvas.height = height;

        // 设置canvas的显示尺寸（CSS像素）
        const dpr = wx.getSystemInfoSync().pixelRatio || 1;
        canvas.style = canvas.style || {};
        canvas.style.width = width / dpr + 'px';
        canvas.style.height = height / dpr + 'px';

       const img = canvas.createImage();
       img.src = imageUrl;
       img.onload = () => {
        const ctx = canvas.getContext('2d');
         ctx.clearRect(0, 0, width, height);
         ctx.drawImage(img, 0, 0, width, height);
         const imageData = ctx.getImageData(0, 0, width, height);
         this.setData({
           imgData: imageData.data
         })
       }
      })
  },
  onPixelate(){
    this.setData({
      finished: true,
      loading: true,
    });
    // 立即开始像素化处理
    this.pixelateImage();
  },
  onSliderChange(e) {
    const {value}=e.detail
    this.setData({
      pixelSize:value,
      loading: true,
    });
    this.pixelateImage();
  },
  pixelateImage(){
    const imgSize = this.data.imgSize;
    const pixelSize = this.data.pixelSize;
    const imgData = this.data.imgData;
    wx.createSelectorQuery()
        .select('#pixelatedCanvasRef')
        .fields({ node: true, size: true })
        .exec((pixelRes) => {
          const pixelatedCanvas = pixelRes[0].node;
          const pixelatedCtx = pixelatedCanvas.getContext('2d');
      
          if (!pixelatedCtx) return;
          // 确保canvas尺寸正确设置
          pixelatedCanvas.width = imgSize.w;
          pixelatedCanvas.height = imgSize.h;

          // 设置canvas的显示尺寸（CSS像素）
          const dpr = wx.getSystemInfoSync().pixelRatio || 1;
          pixelatedCanvas.style = pixelatedCanvas.style || {};
          pixelatedCanvas.style.width = imgSize.w / dpr + 'px';
          pixelatedCanvas.style.height = imgSize.h / dpr + 'px';

          pixelatedCtx.clearRect(0, 0, imgSize.w, imgSize.h);
      
          // 计算实际的像素块数量
          const numCols = Math.ceil(imgSize.w / pixelSize);
          const numRows = Math.ceil(imgSize.h / pixelSize);
      
          // 像素化处理
          for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
              const x = col * pixelSize;
              const y = row * pixelSize;
              const colors = [];
      
              // 计算当前块的实际大小（处理边界情况）
              const blockWidth = Math.min(pixelSize, imgSize.w - x);
              const blockHeight = Math.min(pixelSize, imgSize.h - y);
      
              // 遍历当前小块的像素
              for (let dy = 0; dy < blockHeight; dy++) {
                for (let dx = 0; dx < blockWidth; dx++) {
                  const px = ((y + dy) * imgSize.w + (x + dx)) * 4;
                  const r = imgData[px];
                  const g = imgData[px + 1];
                  const b = imgData[px + 2];
                  const a = imgData[px + 3];
                  colors.push(`rgba(${r}, ${g}, ${b}, ${a / 255})`);
                }
              }
      
              // 获取出现次数最多的颜色
              const mostFrequentColor = this.getMostFrequentColor(colors);
      
              // 将出现次数最多的颜色填充到当前小块
              pixelatedCtx.fillStyle = mostFrequentColor;
              pixelatedCtx.fillRect(x, y, blockWidth, blockHeight);
            }
          }
      
          // 将像素化后的图片转换为 URL
          this.setData({
            pixelatedImageSrc: pixelatedCanvas.toDataURL(),
            loading: false
          });
        })
  },
  getMostFrequentColor(colors){
    const colorCounts = {};
    let maxCount = 0;
    let mostFrequentColor = colors[0]; // 默认取第一个颜色

    // 统计每个颜色的出现次数
    colors.forEach((color) => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
      if (colorCounts[color] > maxCount) {
        maxCount = colorCounts[color];
        mostFrequentColor = color;
      }
    });

    return mostFrequentColor;
  },

  // 生成高分辨率像素化图片
  generateHighResPixelatedImage(callback) {
    const imgSize = this.data.imgSize;
    const pixelSize = this.data.pixelSize;
    const imgData = this.data.imgData;
    const scaleFactor = 3; // 3倍放大

    // 创建高分辨率canvas
    const query = wx.createSelectorQuery();
    query.select('#pixelatedCanvasRef')
      .fields({ node: true, size: true })
      .exec((pixelRes) => {
        const pixelatedCanvas = pixelRes[0].node;
        const pixelatedCtx = pixelatedCanvas.getContext('2d');

        if (!pixelatedCtx) {
          callback(null);
          return;
        }

        // 设置高分辨率canvas尺寸
        const highResWidth = imgSize.w * scaleFactor;
        const highResHeight = imgSize.h * scaleFactor;
        pixelatedCanvas.width = highResWidth;
        pixelatedCanvas.height = highResHeight;

        // 设置canvas的显示尺寸（CSS像素）
        const dpr = wx.getSystemInfoSync().pixelRatio || 1;
        pixelatedCanvas.style = pixelatedCanvas.style || {};
        pixelatedCanvas.style.width = highResWidth / dpr + 'px';
        pixelatedCanvas.style.height = highResHeight / dpr + 'px';

        pixelatedCtx.clearRect(0, 0, highResWidth, highResHeight);

        // 计算实际的像素块数量（保持原始像素块数量）
        const numCols = Math.ceil(imgSize.w / pixelSize);
        const numRows = Math.ceil(imgSize.h / pixelSize);

        // 高分辨率像素化处理
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            const x = col * pixelSize;
            const y = row * pixelSize;
            const colors = [];

            // 计算当前块的实际大小（处理边界情况）
            const blockWidth = Math.min(pixelSize, imgSize.w - x);
            const blockHeight = Math.min(pixelSize, imgSize.h - y);

            // 遍历当前小块的像素
            for (let dy = 0; dy < blockHeight; dy++) {
              for (let dx = 0; dx < blockWidth; dx++) {
                const px = ((y + dy) * imgSize.w + (x + dx)) * 4;
                const r = imgData[px];
                const g = imgData[px + 1];
                const b = imgData[px + 2];
                const a = imgData[px + 3];
                colors.push(`rgba(${r}, ${g}, ${b}, ${a / 255})`);
              }
            }

            // 获取出现次数最多的颜色
            const mostFrequentColor = this.getMostFrequentColor(colors);

            // 将出现次数最多的颜色填充到高分辨率当前小块
            pixelatedCtx.fillStyle = mostFrequentColor;
            pixelatedCtx.fillRect(
              x * scaleFactor,
              y * scaleFactor,
              blockWidth * scaleFactor,
              blockHeight * scaleFactor
            );
          }
        }

        // 添加水印
        addWatermarkToCanvas(pixelatedCanvas, pixelatedCtx, '织作时光', {
          fontSize: 12 * scaleFactor,
          color: 'rgba(0, 0, 0, 0)',
          position: 'bottom-right',
          padding: 10 * scaleFactor
        });

        // 将高分辨率像素化后的图片转换为 URL
        const highResImageSrc = pixelatedCanvas.toDataURL();
        callback(highResImageSrc);
      });
  },

  // 处理下载事件
  onDownload(e) {
    // 获取点击的按钮类型（merge 或 average）
    const type = e.currentTarget.dataset.type;
    
    // 根据类型选择对应的图片源
    const imageSrc = type === 'merge' ? this.data.pixelatedImageSrc : this.data.pixelatedImageSrc2;
    
    if (!imageSrc) {
      wx.showToast({
        title: '没有可下载的图片',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '生成高分辨率图片中...'
    });
    
    // 生成高分辨率像素化图片
    this.generateHighResPixelatedImage((highResImageSrc) => {
      if (!highResImageSrc) {
        wx.hideLoading();
        wx.showToast({
          title: '生成高分辨率图片失败',
          icon: 'none'
        });
        return;
      }

      // 将 base64 图片转换为临时文件
      const fsm = wx.getFileSystemManager();
      const fileName = wx.env.USER_DATA_PATH + '/pixelated_image_hd_' + Date.now() + '.png';

      // 去掉 base64 的前缀（data:image/png;base64,）
      const base64Data = highResImageSrc.replace(/^data:image\/\w+;base64,/, '');

      fsm.writeFile({
        filePath: fileName,
        data: base64Data,
        encoding: 'base64',
        success: () => {
          // 保存图片到相册
          wx.saveImageToPhotosAlbum({
            filePath: fileName,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '已保存图片到相册🎉',
                icon: 'none'
              });
            },
            fail: (err) => {
              console.error('保存图片失败', err);
              wx.hideLoading();

              if (err.errMsg.indexOf('auth deny') >= 0) {
                wx.showToast({
                  title: '请授权保存图片到相册',
                  icon: 'none'
                });
                // 引导用户授权
                wx.openSetting({
                  success: (res) => {
                    console.log('设置结果', res);
                  }
                });
              } else {
                wx.showToast({
                  title: '保存失败，请重试💔',
                  icon: 'none'
                });
              }
            }
          });
        },
        fail: (err) => {
          console.error('写入文件失败', err);
          wx.hideLoading();
          wx.showToast({
            title: '保存失败，请重试💔',
            icon: 'none'
          });
        }
      });
    });
  },
  // 保存图片到云数据库
  async onSave(e) {
    // 获取点击的按钮类型（merge 或 average）
    const type = e.currentTarget.dataset.type;
    const that = this;
    
    // 使用统一的权限检查
    const hasPermission = LoginUtils.checkSavePermission({
      onLoginRequired: () => {
        // 未登录时直接调用公共登录逻辑
        LoginUtils.showLoginModal({
          title: '需要登录',
          content: '保存图片需要先登录账号，是否立即登录？',
          confirmText: '立即登录',
          onLoginStart: () => {
            // 开始登录，显示加载状态
            that.setData({
              loginLoading: true
            });
          },
          onLoginSuccess: (userInfo) => {
            // 登录成功后更新用户信息并继续保存
            that.setData({
              author: userInfo,
              loginLoading: false
            });
            // 重新触发保存操作
            that.onSave(e);
          },
          onLoginFail: (error) => {
            // 登录失败，重置加载状态
            that.setData({
              loginLoading: false
            });
            console.error('登录失败:', error);
          },
          onCancel: () => {
            // 用户取消登录，重置加载状态
            that.setData({
              loginLoading: false
            });
            console.log('用户取消登录');
          }
        });
      },
      onPermissionDenied: (userLevel) => {
        // 权限不足时显示提示弹窗
        that.setData({
          showPermissionDialog: true
        });
      }
    });

    if (!hasPermission) {
      return;
    }
    
    this.setData({
      saveLoading: true
    });

    // 根据类型选择对应的 canvas ID
    const canvasId = type ==='merge'? 'pixelatedCanvasRef' : 'pixelatedCanvasRef2';
    const tag = type === 'merge' ? '像素化(合并算法)' : '像素化(平均算法)';
    wx.createSelectorQuery().select(`#${canvasId}`).fields({ node: true }).exec(res => {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');

      // 添加水印
      addWatermarkToCanvas(canvas, ctx, '织作时光', {
        fontSize: 12,
        color: 'rgba(0, 0, 0, 0.3)',
        position: 'bottom-right',
        padding: 10
      });

      wx.canvasToTempFilePath({
        canvasId: canvasId,
        canvas: canvas,
        success: function(res) {
          const tempFilePath = res.tempFilePath;
          // 上传文件到云存储
          wx.cloud.uploadFile({
            cloudPath: `colorCards/pixel_${Date.now()}.png`,
            filePath: tempFilePath,
            success: function(uploadRes) {
              const fileID = uploadRes.fileID;
              
              // 将文件 ID 保存到云数据库
              const db = wx.cloud.database();
              db.collection('colorCards').add({
                data: {
                  fileID: fileID,
                  createTime: db.serverDate(),
                  tag: tag,
                  title: '',
                  author: that.data.author,
                  width: that.data.resultWidth,
                  height: that.data.resultWidth * that.data.imgSize.h / that.data.imgSize.w,
                },
                success: function() {
                  // 记录创作打卡
                  const { recordCreationCheckIn } = require('../../../utils/checkInUtils');
                  recordCreationCheckIn(1);

                  wx.showToast({
                    title: `保存成功🎉\n前往个人中心-我的创作查看`,
                    icon: 'none'
                  });
                  that.setData({
                    saveLoading: false
                  });
                },
                fail: function(err) {
                  console.error('保存到云数据库失败', err);
                  wx.showToast({
                    title: '保存失败💔',
                    icon: 'none'
                  });
                  that.setData({
                    saveLoading: false
                  });
                }
              });
            },
            fail: function(err) {
              console.error('上传图片失败', err);
              wx.showToast({
                title: '上传图片失败💔',
                icon: 'none'
              });
              that.setData({
                saveLoading: false
              });
            }
          });
        },
        fail: function(err) {
          console.error('canvas 转临时文件失败', err);
          wx.showToast({
            title: '转换失败💔',
            icon: 'none'
          });
          that.setData({
            saveLoading: false
          });
        }
      });
    })
  },
});