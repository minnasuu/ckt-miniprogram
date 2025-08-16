// 像素画板页面
Page({
  data: {
    statusBarHeight: 0,
    screenWidth: 375,
    screenHeight: 812,
    canvasWidth: 12, // 像素画布列数
    canvasHeight: 12, // 像素画布行数
    selectedColor: '#202020', // 当前选择的颜色
    canvasData: [], // 画布数据
    colorPalette: [
      '#202020', '#FFFFFF', '#FF0000', '#00FF00', 
      '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#FFA500', '#800080', '#008080', '#808080'
    ],
    brushColor: '#202020',
    canvasColor: '#FFFFFF',
    previousCanvasColor: '#FFFFFF', // 之前的画布颜色，用于比较
    brushPatternData:['','','','',''],
    fullCanvas:false,
    showAlert: false,
    alertMessage: '',
    borderStyle: '3',
    gridStyleList: ['1', '2', '3'],
    // 颜色选择器相关
    showColorPicker: false,
    currentPickerColor: '#202020',
    currentPickerType: '' // 'brush' 或 'canvas'
  },
  
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      screenWidth: systemInfo.screenWidth-48,
      screenHeight: systemInfo.windowHeight
    });
    
    // 初始化画布数据
    this.initCanvas();
    
    // 初始化之前的画布颜色
    this.setData({
      previousCanvasColor: this.data.canvasColor
    });

    // 获取当前登录用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        author: userInfo
      });
    }
  },
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
  // 初始化画布数据
  initCanvas() {
    const { canvasWidth,canvasHeight,canvasColor } = this.data;
    const canvasData = []
    for (let i = 0; i < canvasHeight; i++) {
      const row = [];
      for (let j = 0; j < canvasWidth; j++) {
        row.push(canvasColor); 
      }
      canvasData.push(row);
    }
    
    this.setData({
      canvasData,
      previousCanvasColor: canvasColor // 初始化时设置之前的画布颜色
    });
  },

  // 更新画布背景色（保持用户绘制的内容）
  updateCanvasBackgroundColor() {
    const { canvasData, canvasColor } = this.data;

    // 如果画布数据为空，则初始化
    if (canvasData.length <= 0) {
      this.initCanvas();
      return;
    }

    // 创建新的画布数据，只更新空白像素（与之前画布颜色相同的像素）
    const newCanvasData = canvasData.map(row =>
      row.map(pixel =>
        // 如果像素颜色与之前的画布颜色相同，则更新为新的画布颜色
        // 否则保持用户绘制的颜色
        pixel === this.data.previousCanvasColor ? canvasColor : pixel
      )
    );

    this.setData({
      canvasData: newCanvasData,
      previousCanvasColor: canvasColor // 更新背景色后更新之前的画布颜色
    });
  },

  updateCanvas() {
    const { canvasWidth, canvasHeight, canvasColor, canvasData } = this.data;
    
    // 如果画布数据为空，则初始化
    if (canvasData.length <= 0) {
      this.initCanvas();
      return;
    }
    
    // 获取当前画布的尺寸
    const currentHeight = canvasData.length;
    const currentWidth = currentHeight > 0 ? canvasData[0].length : 0;
    
    // 创建新的画布数据
    let newCanvasData = [];
    
    // 计算高度变化时上下各需要添加的行数
    const heightDiff = canvasHeight - currentHeight;
    const addToTop = Math.ceil(heightDiff / 2); // 上方添加的行数
    const addToBottom = Math.floor(heightDiff / 2); // 下方添加的行数
    
    // 在上方添加新行
    if (addToTop > 0) {
      for (let i = 0; i < addToTop; i++) {
        const newRow = [];
        for (let j = 0; j < canvasWidth; j++) {
          newRow.push(canvasColor);
        }
        newCanvasData.push(newRow);
      }
    }
    
    // 添加现有数据（可能需要调整宽度）
    for (let i = 0; i < currentHeight; i++) {
      // 如果画布高度减小，跳过多余的行
      if (i >= canvasHeight) continue;
      
      const existingRow = canvasData[i];
      const newRow = [];
      
      // 复制现有像素数据
      for (let j = 0; j < Math.min(currentWidth, canvasWidth); j++) {
        newRow.push(existingRow[j]);
      }
      
      // 如果宽度增加，在右侧添加新像素
      if (canvasWidth > currentWidth) {
        for (let j = 0; j < canvasWidth - currentWidth; j++) {
          newRow.push(canvasColor);
        }
      }
      
      newCanvasData.push(newRow);
    }
    
    // 在下方添加新行
    if (addToBottom > 0) {
      for (let i = 0; i < addToBottom; i++) {
        const newRow = [];
        for (let j = 0; j < canvasWidth; j++) {
          newRow.push(canvasColor);
        }
        newCanvasData.push(newRow);
      }
    }
    
    this.setData({
      canvasData: newCanvasData,
      previousCanvasColor: canvasColor // 调整尺寸后更新之前的画布颜色
    });
  },
  
  // 绘制像素
  drawPixel(e) {
    const { x, y } = e.currentTarget.dataset;
    const { canvasData, brushColor } = this.data;
    
    // 更新画布数据
    const newCanvasData = [...canvasData];
    newCanvasData[y][x] = brushColor;
    
    this.setData({ canvasData: newCanvasData });
  },
  // 处理触摸移动事件
  onTouchMovePixel(e) {
    const { x, y } = e.currentTarget.dataset;
    const { canvasData, brushColor } = this.data;
    
    // 更新画布数据
    const newCanvasData = [...canvasData];
    newCanvasData[y][x] = brushColor;
    
    this.setData({ canvasData: newCanvasData });
  },
  
  // 清除画布
  clearCanvas() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除当前画布吗？',
      success: (res) => {
        if (res.confirm) {
          this.initCanvas();
          // 清除画布后，更新之前的画布颜色
          this.setData({
            previousCanvasColor: this.data.canvasColor
          });
        }
      }
    });
  },
  
  // 保存画布
  saveCanvas() {
    const that = this;
    // 检查用户是否登录
    if(!that.data.author){
      that.showMessage('请先登录☺️');
      return;
    }
    
    const { canvasData, canvasWidth, canvasHeight, borderStyle, canvasColor } = this.data;
    const pixelSize = 32; // 每个像素的大小，与result-canvas的样式一致
    
    // 创建画布上下文
    const query = wx.createSelectorQuery();
    query.select('#result-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        
        // 调用绘制函数，传入borderStyle和canvasColor
        this.drawCanvasFromPixelData(canvas, canvasData, canvasWidth, canvasHeight, pixelSize, borderStyle, canvasColor);
        
        // 将画布转换为临时文件
        wx.canvasToTempFilePath({
          canvasId: 'result-canvas',
          canvas: canvas,
          success: (res) => {
            const tempFilePath = res.tempFilePath;
            // 上传文件到云存储
            wx.cloud.uploadFile({
              cloudPath: `colorCards/${Date.now()}.png`,
              filePath: tempFilePath,
              success: function(uploadRes) {
                const fileID = uploadRes.fileID;
                // 将文件 ID 保存到云数据库
                const db = wx.cloud.database();
                db.collection('colorCards').add({
                  data: {
                    fileID: fileID,
                    createTime: db.serverDate(),
                    tag: '像素画板', // 标签为像素画板
                    title: that.data.title || '我的像素画', // 标题，如果没有则使用默认值
                    author: that.data.author,
                    width: canvasWidth,
                    height: canvasHeight
                  },
                  success: function() {
                    that.showMessage(`保存成功🎉\n前往个人中心-我的创作查看`);
                  },
                  fail: function(err) {
                    console.error('保存到云数据库失败', err);
                    that.showMessage('保存失败💔');
                  }
                });
              },
              fail: function(err) {
                console.error('上传到云存储失败', err);
                that.showMessage('上传失败💔');
              }
            });
          },
          fail: (err) => {
            console.error('canvas 转临时文件失败', err);
            that.showMessage('生成图片失败');
          }
        });
      });
  },

  onCanvasWidthInput(e){
    const value = e.detail;
    if(value){
      this.setData({
        canvasWidth:value
      }, () => {
        this.updateCanvas();
        // 调整尺寸后，更新之前的画布颜色
        this.setData({
          previousCanvasColor: this.data.canvasColor
        });
      });
    }
  },
  onCanvasHeightInput(e){
    const value = e.detail;
    if(value){
      this.setData({
        canvasHeight:value
      }, () => {
        this.updateCanvas();
        // 调整尺寸后，更新之前的画布颜色
        this.setData({
          previousCanvasColor: this.data.canvasColor
        });
      });
    }
  },
  onFullCanvas(){
    this.setData({
      fullCanvas: true
    })
  },
  onZoomOutCanvas(){
    this.setData({
      fullCanvas: false
    })
  },
  // 在canvas上绘制像素数据
  drawCanvasFromPixelData(canvas, canvasData, canvasWidth, canvasHeight, pixelSize, borderStyle = '3', canvasColor = '#FFFFFF') {
    const ctx = canvas.getContext('2d');

    // 设置画布尺寸
    canvas.width = canvasWidth * pixelSize;
    canvas.height = canvasHeight * pixelSize;

    // 绘制每个像素
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const color = canvasData[y][x];

        // 填充像素颜色
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

        // 根据borderStyle绘制边框
        if (borderStyle !== '1') { // 不是透明边框
          ctx.strokeStyle = borderStyle === '2' ? canvasColor : '#DDDDDD';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    return canvas;
  },
  
  // 下载画布为图片
  downloadCanvas() {
    const { canvasData, canvasWidth, canvasHeight, borderStyle, canvasColor } = this.data;
    const basePixelSize = 32; // 基础像素大小
    const scaleFactor = 2; // 2倍分辨率
    const highResPixelSize = basePixelSize * scaleFactor; // 高分辨率像素大小

    // 创建高分辨率画布上下文
    const query = wx.createSelectorQuery();
    query.select('#result-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        
        // 设置高分辨率画布尺寸
        canvas.width = canvasWidth * highResPixelSize;
        canvas.height = canvasHeight * highResPixelSize;

        // 在高分辨率画布上绘制像素数据
        this.drawCanvasFromPixelData(canvas, canvasData, canvasWidth, canvasHeight, highResPixelSize, borderStyle, canvasColor);
        
        // 将高分辨率画布转换为临时文件
        wx.canvasToTempFilePath({
          canvasId: 'result-canvas',
          canvas: canvas,
          success: (res) => {
            // 保存高分辨率图片到相册
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                this.showMessage('高分辨率图片已保存到相册🎉');
              },
              fail: (_err) => {
                this.showMessage('保存失败，请检查权限');
              }
            });
          },
          fail: (_err) => {
            this.showMessage('生成高分辨率图片失败');
          }
        });
      });
  },
  onFullCanvas(){
    this.setData({
      fullCanvas: true
    })
  },
  onZoomOutCanvas(){
    this.setData({
      fullCanvas: false
    })
  },
  onGridShowChange(e){ 
    const {type} = e.currentTarget.dataset;
    this.setData({
      borderStyle: type
    })
  },
  onResetSize() {
    // 保存当前的画布数据
    const currentCanvasData = this.data.canvasData;

    // 重置画布尺寸
    this.setData({
      canvasWidth: 12,
      canvasHeight: 12
    }, () => {
      // 在尺寸更新后，调用updateCanvas来智能调整画布
      // 这样可以保持已绘制的颜色数据不变
      this.updateCanvas();
      // 重置尺寸后，更新之前的画布颜色
      this.setData({
        previousCanvasColor: this.data.canvasColor
      });
    });
  },

  // 显示画笔颜色选择器
  showBrushColorPicker() {
    this.setData({
      showColorPicker: true,
      currentPickerColor: this.data.brushColor,
      currentPickerType: 'brush'
    });
  },

  // 显示画布颜色选择器
  showCanvasColorPicker() {
    this.setData({
      showColorPicker: true,
      currentPickerColor: this.data.canvasColor,
      currentPickerType: 'canvas'
    });
  },

  // 关闭颜色选择器
  onColorPickerClose() {
    this.setData({
      showColorPicker: false
    });
  },

  // 取消颜色选择
  onColorPickerCancel() {
    this.setData({
      showColorPicker: false
    });
  },

  // 确认颜色选择
  onColorPickerConfirm(e) {
    const { color } = e.detail;
    const { currentPickerType } = this.data;

    if (currentPickerType === 'brush') {
      this.setData({
        brushColor: color,
        showColorPicker: false
      });
    } else if (currentPickerType === 'canvas') {
      // 保存之前的画布颜色，用于比较
      const previousCanvasColor = this.data.canvasColor;

      this.setData({
        canvasColor: color,
        previousCanvasColor: previousCanvasColor,
        showColorPicker: false
      }, () => {
        // 更新画布背景色后，调用专门的方法来更新背景色
        // 这样可以保持用户已绘制的内容不变
        this.updateCanvasBackgroundColor();
      });
    }
  },

  // 颜色变化事件（实时预览）
  onColorPickerChange(e) {
    const { color } = e.detail;
    this.setData({
      currentPickerColor: color
    });
  }
});