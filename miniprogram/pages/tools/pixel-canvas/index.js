// 像素画板页面
const LoginUtils = require('../../../utils/loginUtils');

Page({
  data: {
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
    currentPickerType: '', // 'brush' 或 'canvas'
    isEraser: false,
    saveLoading: false,
    // 连续绘制相关
    isDrawing: false, // 是否正在绘制
    lastDrawnPixel: null, // 上一个绘制的像素位置，避免重复绘制
    canvasRect: null, // 画布区域信息，用于坐标转换
    canvasRectUpdateTime: 0, // 画布区域信息最后更新时间，用于节流
    // 触摸手势相关
    touchStartTime: 0, // 触摸开始时间
    initialTouchCount: 0, // 初始触摸点数量
    isMultiTouch: false // 是否为多点触摸
  },
  
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
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

    // 延迟获取画布区域信息
    setTimeout(() => {
      this.updateCanvasRect();
    }, 100);
  },

  // 更新画布区域信息
  updateCanvasRect() {
    const query = wx.createSelectorQuery();
    const { fullCanvas } = this.data;

    // 根据当前模式选择不同的选择器
    const selector = fullCanvas ? 'movable-view.pixel-canvas' : '.pixel-canvas';

    query.select(selector).boundingClientRect((rect) => {
      if (rect) {
        this.setData({
          canvasRect: rect
        });
      }
    }).exec();
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
  
  // 开始绘制（触摸开始）
  onTouchStart(e) {
    const touchCount = e.touches.length;
    const currentTime = Date.now();
    const { fullCanvas } = this.data;

    this.setData({
      touchStartTime: currentTime,
      initialTouchCount: touchCount,
      isMultiTouch: touchCount > 1
    });

    // 在全屏模式下，多指触摸时不阻止事件，让movable-view处理手势
    if (fullCanvas && touchCount > 1) {
      this.setData({
        isDrawing: false,
        lastDrawnPixel: null
      });
      // 不阻止事件冒泡，让movable-view处理多指手势
      return false;
    }

    // 检查触摸点是否在有效的像素区域内
    const pixelInfo = this.getPixelFromTouch(e);
    if (!pixelInfo) {
      // 触摸点不在有效区域内，不开始绘制
      this.setData({
        isDrawing: false,
        lastDrawnPixel: null
      });
      // 在全屏模式下，如果是单指但不在像素区域内，不阻止事件，让movable-view处理移动
      if (fullCanvas) {
        return false;
      }
      return;
    }

    // 触摸点在有效区域内，开始绘制并阻止事件冒泡
    this.setData({
      isDrawing: true,
      lastDrawnPixel: null
    });

    // 立即绘制当前像素
    this.drawPixelAt(pixelInfo.x, pixelInfo.y);
    this.setData({
      lastDrawnPixel: { x: pixelInfo.x, y: pixelInfo.y }
    });

    // 阻止事件冒泡，防止movable-view处理这个触摸
    return true;
  },

  // 绘制过程中（触摸移动）
  onTouchMove(e) {
    const touchCount = e.touches.length;
    const { fullCanvas, isDrawing, isMultiTouch } = this.data;

    // 在全屏模式下，如果检测到多指触摸，停止绘制并不阻止事件
    if (fullCanvas && (touchCount > 1 || isMultiTouch)) {
      if (isDrawing) {
        this.setData({
          isDrawing: false,
          lastDrawnPixel: null,
          isMultiTouch: true
        });
      }
      // 让movable-view处理多指手势
      return false;
    }

    // 如果不在绘制状态，在全屏模式下让movable-view处理单指移动
    if (!isDrawing) {
      if (fullCanvas) {
        return false;
      }
      return;
    }

    // 正在绘制状态，继续绘制并阻止事件冒泡
    this.drawPixelAtTouch(e);
    return true;
  },

  // 结束绘制（触摸结束）
  onTouchEnd(e) {
    const { isDrawing, fullCanvas } = this.data;

    this.setData({
      isDrawing: false,
      lastDrawnPixel: null,
      isMultiTouch: false,
      initialTouchCount: 0
    });

    // 如果刚才在绘制，阻止事件冒泡；否则在全屏模式下让movable-view处理
    if (isDrawing) {
      return true;
    } else if (fullCanvas) {
      return false;
    }
  },

  // 根据触摸事件绘制像素
  drawPixelAtTouch(e) {
    const pixelInfo = this.getPixelFromTouch(e);
    if (!pixelInfo) return;
    
    const { x, y } = pixelInfo;
    const { lastDrawnPixel } = this.data;
    
    // 避免重复绘制同一个像素
    if (lastDrawnPixel && lastDrawnPixel.x === x && lastDrawnPixel.y === y) {
      return;
    }
    
    this.drawPixelAt(x, y);
    this.setData({
      lastDrawnPixel: { x, y }
    });
  },

  // 根据触摸事件获取像素坐标（优化版本，使用缓存的rect信息）
  getPixelFromTouch(e) {
    const touch = e.touches[0];
    if (!touch) return null;
    
    const { canvasRect, canvasWidth, canvasHeight, fullCanvas, screenWidth, canvasRectUpdateTime } = this.data;
    const currentTime = Date.now();
    
    // 如果没有缓存的rect信息或者在全屏模式下且超过100ms没有更新（因为movable-view可能移动），实时获取
    if (!canvasRect || (fullCanvas && (!canvasRectUpdateTime || (currentTime - canvasRectUpdateTime > 100)))) {
      this.updateCanvasRect();
      this.setData({
        canvasRectUpdateTime: currentTime
      });

      // 如果还是没有rect信息，返回null
      if (!this.data.canvasRect) {
        return null;
      }
    }
    
    // 使用最新的canvasRect
    const currentRect = this.data.canvasRect;
    const relativeX = touch.clientX - currentRect.left;
    const relativeY = touch.clientY - currentRect.top;
    
    let pixelWidth, pixelHeight;
    if (fullCanvas) {
      // 全屏模式下，像素大小为32px，但需要考虑缩放
      // 通过currentRect的实际尺寸来计算当前的像素大小
      const actualCanvasWidth = currentRect.width;
      const actualCanvasHeight = currentRect.height;
      pixelWidth = actualCanvasWidth / canvasWidth;
      pixelHeight = actualCanvasHeight / canvasHeight;
    } else {
      // 普通模式下，像素大小根据屏幕宽度计算
      pixelWidth = Math.min(screenWidth / canvasWidth, 24);
      pixelHeight = pixelWidth;
    }
    
    const x = Math.floor(relativeX / pixelWidth);
    const y = Math.floor(relativeY / pixelHeight);
    
    // 检查坐标是否在有效范围内
    if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
      return { x, y };
    } else {
      return null;
    }
  },

  // 在指定坐标绘制像素
  drawPixelAt(x, y) {
    const { canvasData, brushColor, canvasColor, isEraser } = this.data;
    
    // 更新画布数据
    const newCanvasData = [...canvasData];
    newCanvasData[y][x] = isEraser ? canvasColor : brushColor;
    
    this.setData({ canvasData: newCanvasData });
  },

  // 绘制像素（点击事件，保持兼容性）
  drawPixel(e) {
    const { x, y } = e.currentTarget.dataset;
    this.drawPixelAt(x, y);
  },
  
  // 清除画布
  clearCanvas() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除当前画布吗？',
      confirmColor: '#F35A75',
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
      // 使用登录工具类显示登录弹窗
      LoginUtils.showLoginModal({
        title: '需要登录',
        content: '保存像素画需要先登录账号，是否立即登录？',
        confirmText: '立即登录',
        onLoginStart: () => {
          wx.showLoading({
            title: '登录中...',
          });
        },
        onLoginSuccess: (userInfo) => {
          // 更新页面的用户信息
          that.setData({
            author: userInfo
          });
          // 登录成功后自动执行保存操作
          that.saveCanvas();
        },
        onLoginFail: (error) => {
          that.showMessage('登录失败，请重试');
          console.error('登录失败：', error);
        },
        onCancel: () => {
          that.showMessage('已取消登录');
        }
      });
      return;
    }
    this.setData({
      saveLoading: true
    });
    
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
                    // 记录创作打卡
                    const { recordCreationCheckIn } = require('../../../utils/checkInUtils');
                    recordCreationCheckIn(1);

                    that.showMessage(`保存成功🎉\n前往个人中心-图片查看`);
                  },
                  fail: function(err) {
                    console.error('保存到云数据库失败', err);
                    that.showMessage('保存失败💔');
                  },
                  complete: function () {
                    that.setData({
                      saveLoading: false
                    });
                  }
                });
              },
              fail: function(err) {
                console.error('上传到云存储失败', err);
                that.showMessage('上传失败💔');
                that.setData({
                  saveLoading: false
                });
              }
            });
          },
          fail: (err) => {
            console.error('canvas 转临时文件失败', err);
            that.showMessage('生成图片失败');
            that.setData({
              saveLoading: false
            });
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
        // 更新画布区域信息
        setTimeout(() => {
          this.updateCanvasRect();
        }, 100);
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
        // 更新画布区域信息
        setTimeout(() => {
          this.updateCanvasRect();
        }, 100);
      });
    }
  },
  onFullCanvas(){
    this.setData({
      fullCanvas: true
    }, () => {
      // 切换到全屏模式后更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 100);
    });
  },
  onZoomOutCanvas(){
    this.setData({
      fullCanvas: false
    }, () => {
      // 退出全屏模式后更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 100);
    });
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
    }, () => {
      // 切换到全屏模式后更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 100);
    });
  },
  onZoomOutCanvas(){
    this.setData({
      fullCanvas: false
    }, () => {
      // 退出全屏模式后更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 100);
    });
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
      // 更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 100);
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
  },
  eraserChange() {
    this.setData({
      isEraser: !this.data.isEraser
    });
  },

  // 处理movable-view位置变化事件
  onMovableViewChange(e) {
    // 当movable-view位置或缩放改变时，重置画布区域信息缓存
    this.setData({
      canvasRect: null,
      canvasRectUpdateTime: 0
    });

    // 如果正在进行多点触摸手势，确保停止绘制
    if (this.data.isMultiTouch) {
      this.setData({
        isDrawing: false,
        lastDrawnPixel: null
      });
    }
  }
});