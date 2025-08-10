// 图片转像素页面
Page({
  data: {
    statusBarHeight: 0,
    imageUrl: '',
    imgSize: {
      w: 100,
      h: 100
    },
    imgData:null,
    finished:false,
    showGrid: false,
    pixelSize: 10,
    pixelMax: 100,
    loading:false,
    pixelatedImageSrc:'',
    pixelatedImageSrc2:'',
    resultWidth: 342,
    showAlert: false,
    alertMessage: '',
    author:null,
    saveLoading:false
  },
  
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
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
  // 处理图片选择事件
  onImageSelected(e) {
    const { imageUrl,width,height,size } = e.detail;
    const info = wx.getWindowInfo();
    const resultWidth = info.screenWidth-48;
    if(size>500*1024){
      this.showMessage('图片不能超过500KB💔');
      return;
    }
    this.setData({
      imageUrl,
      pixelImage: '', // 清除之前的像素图
      imgSize: {
        w: width,
        h: height
      },
      resultWidth,
      finished: false,
      pixelSize: Math.ceil(Math.min(width, height) / 50),
      pixelMax: Math.ceil(Math.min(width, height) / 20)
    });
    const query = wx.createSelectorQuery();
    query.select('#canvasRef')
      .fields({ node: true, size: true })
      .exec((res) => {
       const canvas = res[0].node;
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
    })
    this.pixelateImage?.();
  },
  onCheckboxChange() {
    this.setData({
      showGrid: !this.data.showGrid
    })
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
          pixelatedCanvas.width = imgSize.w;
          pixelatedCanvas.height = imgSize.h;
      
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
  // 处理下载事件
  onDownload(e) {
    // 获取点击的按钮类型（merge 或 average）
    const type = e.currentTarget.dataset.type;
    
    // 根据类型选择对应的图片源
    const imageSrc = type === 'merge' ? this.data.pixelatedImageSrc : this.data.pixelatedImageSrc2;
    
    if (!imageSrc) {
      this.showMessage('没有可下载的图片');
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中...'
    });
    
    // 将 base64 图片转换为临时文件
    const fsm = wx.getFileSystemManager();
    const fileName = wx.env.USER_DATA_PATH + '/pixelated_image_' + Date.now() + '.png';
    
    // 去掉 base64 的前缀（data:image/png;base64,）
    const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, '');
    
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
            this.showMessage('图片已保存到相册🎉');
          },
          fail: (err) => {
            console.error('保存图片失败', err);
            wx.hideLoading();
            
            if (err.errMsg.indexOf('auth deny') >= 0) {
              this.showMessage('请授权保存图片到相册');
              // 引导用户授权
              wx.openSetting({
                success: (res) => {
                  console.log('设置结果', res);
                }
              });
            } else {
              this.showMessage('保存失败，请重试💔');
            }
          }
        });
      },
      fail: (err) => {
        console.error('写入文件失败', err);
        wx.hideLoading();
        this.showMessage('保存失败，请重试💔');
      }
    });
  },
  // 保存图片到云数据库
  async onSave(e) {
    this.setData({
      saveLoading:true
    })
    // 获取点击的按钮类型（merge 或 average）
    const type = e.currentTarget.dataset.type;
    const that = this;
    
    // 检查用户是否登录
    if (!that.data.author) {
      that.showMessage('请先登录☺️');
      return;
    }
    
    // 根据类型选择对应的 canvas ID
    const canvasId = type ==='merge'? 'pixelatedCanvasRef' : 'pixelatedCanvasRef2';
    const tag = type === 'merge' ? '像素化(合并算法)' : '像素化(平均算法)';
    wx.createSelectorQuery().select(`#${canvasId}`).fields({ node: true }).exec(res => {
      const canvas = res[0].node;
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
                  that.showMessage(`保存成功🎉\n前往个人中心-我的创作查看`);
                  that.setData({
                    saveLoading:false
                  })
                },
                fail: function(err) {
                  console.error('保存到云数据库失败', err);
                  that.showMessage('保存失败💔');
                }
              });
            },
            fail: function(err) {
              console.error('上传图片失败', err);
              that.showMessage('上传图片失败💔');
            }
          });
        },
        fail: function(err) {
          console.error('canvas 转临时文件失败', err);
          that.showMessage('转换失败💔');
        }
      });
    })
  },
});