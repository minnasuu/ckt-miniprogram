// 像素画板页面
const LoginUtils = require('../../../utils/loginUtils');
const { addWatermarkToCanvas } = require('../../../utils/watermarkUtils');

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
    fullCanvas: false,
    borderStyle: '3',
    gridStyleList: ['1', '2', '3'],
    // 画布尺寸预设选项
    canvasSizeOptions: [
      { width: 8, height: 8, label: '8*8' },
      { width: 12, height: 12, label: '12*12' },
      { width: 16, height: 16, label: '16*16' },
      { width: 24, height: 24, label: '24*24' },
      { width: 32, height: 32, label: '32*32' }
    ],
    // 颜色选择器相关
    showColorPicker: false,
    currentPickerColor: '#202020',
    currentPickerType: '', // 'brush' 或 'canvas'
    isEraser: false,
    saveLoading: false,
    showPermissionDialog: false, // 控制权限提示弹窗
    // 连续绘制相关
    isDrawing: false, // 是否正在绘制
    lastDrawnPixel: null, // 上一个绘制的像素位置，避免重复绘制
    canvasRect: null, // 画布区域信息，用于坐标转换
    canvasRectUpdateTime: 0, // 画布区域信息最后更新时间，用于节流
    // 触摸手势相关
    touchStartTime: 0, // 触摸开始时间
    initialTouchCount: 0, // 初始触摸点数量
    isMultiTouch: false, // 是否为多点触摸
    showClearCanvasDialog: false, // 控制清空画布提示弹窗
    isCanvasEmpty: true, // 画布是否为空（没有绘制任何像素）
    showExitDialog: false, // 控制退出提示弹窗
    hasUnsavedChanges: false // 是否有未保存的更改
  },
  
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      screenWidth: systemInfo.screenWidth-16,
      screenHeight: systemInfo.windowHeight
    });
    
    // 尝试加载缓存的画布数据
    this.loadCachedCanvasData();

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

    // 初始化颜色选择器为画笔颜色模式
    this.setColorPickerType('brush');
  },

  // 页面卸载时的处理
  onUnload() {
    // 页面卸载时不显示弹窗，直接退出
    // 这里可以做一些清理工作，但不能阻止页面卸载
    // 实际的退出确认逻辑通过自定义返回按钮处理
  },

  // 加载缓存的画布数据
  loadCachedCanvasData() {
    try {
      const cachedData = wx.getStorageSync('pixel_canvas_cache');
      if (cachedData) {
        const { canvasData, canvasWidth, canvasHeight, canvasColor, brushColor, borderStyle } = cachedData;

        this.setData({
          canvasData: canvasData || [],
          canvasWidth: canvasWidth || 12,
          canvasHeight: canvasHeight || 12,
          canvasColor: canvasColor || '#FFFFFF',
          brushColor: brushColor || '#202020',
          borderStyle: borderStyle || '3',
          previousCanvasColor: canvasColor || '#FFFFFF'
        }, () => {
          // 加载缓存后更新画布空状态
          this.updateCanvasEmptyState();
          wx.showToast({
            title: '已加载上次的绘画数据',
            icon: 'none',
            duration: 1500
          });
        });

        return true;
      }
    } catch (error) {
      console.error('加载缓存数据失败:', error);
    }

    // 没有缓存数据，初始化画布
    this.initCanvas();
    this.setData({
      previousCanvasColor: this.data.canvasColor
    });
    return false;
  },

  // 保存画布数据到本地缓存
  saveCacheData() {
    try {
      const { canvasData, canvasWidth, canvasHeight, canvasColor, brushColor, borderStyle } = this.data;
      const cacheData = {
        canvasData,
        canvasWidth,
        canvasHeight,
        canvasColor,
        brushColor,
        borderStyle,
        timestamp: Date.now()
      };

      wx.setStorageSync('pixel_canvas_cache', cacheData);
      this.setData({ hasUnsavedChanges: false });
      return true;
    } catch (error) {
      console.error('保存缓存数据失败:', error);
      return false;
    }
  },

  // 清除缓存数据
  clearCacheData() {
    try {
      wx.removeStorageSync('pixel_canvas_cache');
      this.setData({ hasUnsavedChanges: false });
      return true;
    } catch (error) {
      console.error('清除缓存数据失败:', error);
      return false;
    }
  },

  // 显示退出确认对话框
  showExitConfirmDialog() {
    this.setData({
      showExitDialog: true
    });
  },

  // 直接退出（不保存）
  onDirectExit() {
    this.clearCacheData();
    this.setData({
      showExitDialog: false,
      hasUnsavedChanges: false
    });
    wx.navigateBack();
  },

  // 缓存后退出
  onCacheAndExit() {
    const success = this.saveCacheData();
    if (success) {
      wx.showToast({
        title: '数据已缓存到本地',
        icon: 'none',
        duration: 1500
      });
      setTimeout(() => {
        this.setData({
          showExitDialog: false
        });
        wx.navigateBack();
      }, 1000);
    } else {
      wx.showToast({
        title: '缓存失败，请重试',
        icon: 'none'
      });
    }
  },

  // 取消退出
  onCancelExit() {
    this.setData({
      showExitDialog: false
    });
  },

  // 自定义返回处理
  onCustomBack() {
    const { hasUnsavedChanges, isCanvasEmpty } = this.data;

    // 如果画布为空或没有未保存的更改，直接退出
    if (isCanvasEmpty || !hasUnsavedChanges) {
      wx.navigateBack();
      return;
    }

    // 有未保存的更改，显示退出确认对话框
    this.showExitConfirmDialog();
  },

  // 更新画布区域信息
  updateCanvasRect() {
    const { fullCanvas } = this.data;
    const selector = fullCanvas ? 'movable-view.pixel-canvas' : '.pixel-canvas';

    const query = wx.createSelectorQuery();
    query.select(selector).boundingClientRect((rect) => {
      if (rect) {
        this.setData({
          canvasRect: rect,
          canvasRectUpdateTime: Date.now()
        });
      }
    }).exec();
  },

  // 检测画布是否为空（没有绘制任何像素）
  checkCanvasEmpty() {
    const { canvasData, canvasColor } = this.data;
    
    // 如果画布数据为空，认为是空的
    if (!canvasData || canvasData.length === 0) {
      return true;
    }
    
    // 检查是否有任何像素不是画布背景色
    for (let y = 0; y < canvasData.length; y++) {
      for (let x = 0; x < canvasData[y].length; x++) {
        if (canvasData[y][x] !== canvasColor) {
          return false; // 找到非背景色的像素，画布不为空
        }
      }
    }
    
    return true; // 所有像素都是背景色，画布为空
  },

  // 更新画布空状态
  updateCanvasEmptyState() {
    const isEmpty = this.checkCanvasEmpty();
    const { isEraser } = this.data;
    
    // 如果画布为空且当前是橡皮擦模式，自动取消橡皮擦激活
    if (isEmpty && isEraser) {
      this.setData({
        isCanvasEmpty: isEmpty,
        isEraser: false
      });
    } else {
      this.setData({
        isCanvasEmpty: isEmpty
      });
    }
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
    }, () => {
      // 初始化后更新画布空状态
      this.updateCanvasEmptyState();
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
    }, () => {
      // 更新背景色后更新画布空状态
      this.updateCanvasEmptyState();
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
    }, () => {
      // 调整尺寸后更新画布空状态
      this.updateCanvasEmptyState();
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
      return false;
    }

    // 确保画布区域信息是最新的
    if (!this.data.canvasRect) {
      this.updateCanvasRect();
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
    
    // 如果上一个像素和当前像素不相邻，填充中间的像素（实现连续绘制）
    if (lastDrawnPixel) {
      this.fillPixelsBetween(lastDrawnPixel.x, lastDrawnPixel.y, x, y);
    }
    
    this.drawPixelAt(x, y);
    this.setData({
      lastDrawnPixel: { x, y }
    });
  },

  // 填充两个像素之间的所有像素（实现连续绘制）
  fillPixelsBetween(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const steps = Math.max(dx, dy);
    
    if (steps === 0) return;
    
    const xStep = (x2 - x1) / steps;
    const yStep = (y2 - y1) / steps;
    
    for (let i = 1; i < steps; i++) {
      const x = Math.round(x1 + xStep * i);
      const y = Math.round(y1 + yStep * i);
      this.drawPixelAt(x, y);
    }
  },

  // 根据触摸事件获取像素坐标（优化版本）
  getPixelFromTouch(e) {
    const touch = e.touches[0];
    if (!touch) return null;
    
    const { canvasWidth, canvasHeight, canvasRect, fullCanvas, screenWidth } = this.data;
    
    // 使用缓存的rect信息，如果没有则返回null（避免异步操作）
    if (!canvasRect) {
      return null;
    }
    
    const relativeX = touch.clientX - canvasRect.left;
    const relativeY = touch.clientY - canvasRect.top;
    
    // 计算像素大小
    const pixelWidth = canvasRect.width / canvasWidth;
    const pixelHeight = canvasRect.height / canvasHeight;
    
    // 计算像素坐标，使用更精确的舍入方法
    const x = Math.floor(relativeX / pixelWidth);
    const y = Math.floor(relativeY / pixelHeight);
    
    // 检查坐标是否在有效范围内
    if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
      return { x, y };
    } else {
      return null;
    }
  },

  // 获取画布区域信息（异步方法，返回Promise）
  getCanvasRect() {
    return new Promise((resolve) => {
      const { fullCanvas } = this.data;
      const selector = fullCanvas ? 'movable-view.pixel-canvas' : '.pixel-canvas';
      
      const query = wx.createSelectorQuery();
      query.select(selector).boundingClientRect((rect) => {
        resolve(rect);
      }).exec();
    });
  },

  // 在指定坐标绘制像素
  drawPixelAt(x, y) {
    const { canvasData, brushColor, canvasColor, isEraser } = this.data;
    
    // 更新画布数据
    const newCanvasData = [...canvasData];
    newCanvasData[y][x] = isEraser ? canvasColor : brushColor;
    
    this.setData({
      canvasData: newCanvasData,
      hasUnsavedChanges: true // 标记有未保存的更改
    }, () => {
      // 绘制后更新画布空状态
      this.updateCanvasEmptyState();
    });
  },

  // 绘制像素（点击事件，保持兼容性）
  drawPixel(e) {
    const { x, y } = e.currentTarget.dataset;
    this.drawPixelAt(x, y);
  },
  
  // 清除画布
  clearCanvas() {
    this.setData({
      showClearCanvasDialog: true
    });
  },
  
  // 保存画布
  saveCanvas() {
    const that = this;

    // 使用统一的权限检查
    const hasPermission = LoginUtils.checkSavePermission({
      onLoginRequired: () => {
        // 需要登录时显示登录弹窗
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
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
            console.error('登录失败：', error);
          },
          onCancel: () => {
            wx.showToast({
              title: '已取消登录',
              icon: 'none'
            });
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

                    // 保存成功后清除未保存更改标记
                    that.setData({
                      hasUnsavedChanges: false
                    });

                    wx.showToast({
                      title: `保存成功🎉\n前往个人中心-图片查看`,
                      icon: 'none'
                    });
                  },
                  fail: function(err) {
                    console.error('保存到云数据库失败', err);
                    wx.showToast({
                      title: '保存失败💔',
                      icon: 'none'
                    });
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
                wx.showToast({
                  title: '上传失败💔',
                  icon: 'none'
                });
                that.setData({
                  saveLoading: false
                });
              }
            });
          },
          fail: (err) => {
            console.error('canvas 转临时文件失败', err);
            wx.showToast({
              title: '生成图片失败',
              icon: 'none'
            });
            that.setData({
              saveLoading: false
            });
          }
        });
      });
  },

  // 选择画布尺寸
  onCanvasSizeSelect(e) {
    const { width, height } = e.currentTarget.dataset;
    this.setData({
      canvasWidth: parseInt(width),
      canvasHeight: parseInt(height)
    }, () => {
      this.updateCanvas();
      // 调整尺寸后，更新之前的画布颜色
      this.setData({
        previousCanvasColor: this.data.canvasColor,
        hasUnsavedChanges: true // 标记有未保存的更改
      });
      // 更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 50);
    });
  },
  onFullCanvas(){
    this.setData({
      fullCanvas: true
    }, () => {
      // 切换到全屏模式后更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 50);
    });
  },
  onZoomOutCanvas(){
    this.setData({
      fullCanvas: false
    }, () => {
      // 退出全屏模式后更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 50);
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
    const scaleFactor = 3; // 3倍分辨率
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
        
        // 添加水印
        const ctx = canvas.getContext('2d');
        addWatermarkToCanvas(canvas, ctx, '织作时光', {
          fontSize: Math.max(12, highResPixelSize * 0.4),
          color: 'rgba(0, 0, 0, 0)',
          position: 'bottom-right',
          padding: Math.max(8, highResPixelSize * 0.3)
        });

        // 将高分辨率画布转换为临时文件
        wx.canvasToTempFilePath({
          canvasId: 'result-canvas',
          canvas: canvas,
          success: (res) => {
            // 保存高分辨率图片到相册
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.showToast({
                  title: '已保存图片到相册🎉',
                  icon: 'none'
                });
              },
              fail: (_err) => {
                wx.showToast({
                  title: '保存失败，请重试💔',
                  icon: 'none'
                });
              }
            });
          },
          fail: (_err) => {
            wx.showToast({
              title: '生成图片失败',
              icon: 'none'
            });
          }
        });
      });
  },
  onGridShowChange(e){ 
    const {type} = e.currentTarget.dataset;
    this.setData({
      borderStyle: type,
      hasUnsavedChanges: true // 标记有未保存的更改
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
        previousCanvasColor: this.data.canvasColor,
        hasUnsavedChanges: true // 标记有未保存的更改
      });
      // 更新画布区域信息
      setTimeout(() => {
        this.updateCanvasRect();
      }, 50);
    });
  },

  // 显示画笔颜色选择器
  showBrushColorPicker(e) {
    const type = e.currentTarget.dataset.type || 'brush';
    this.setColorPickerType(type);
  },

  // 显示画布颜色选择器
  showCanvasColorPicker(e) {
    const type = e.currentTarget.dataset.type || 'canvas';
    this.setColorPickerType(type);
  },

  // 设置颜色选择器类型（用于一直显示的颜色选择器）
  setColorPickerType(type) {
    this.setData({
      showColorPicker: true,
      currentPickerType: type
    });
    if (type === 'brush') {
      this.setData({
        currentPickerColor: this.data.brushColor,
        currentPickerType: 'brush'
      });
    } else if (type === 'canvas') {
      this.setData({
        currentPickerColor: this.data.canvasColor,
        currentPickerType: 'canvas'
      });
    }
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
        showColorPicker: false,
        hasUnsavedChanges: true // 标记有未保存的更改
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
  },
  onClearCanvas(){
      this.initCanvas();
      // 清除画布后，更新之前的画布颜色
      this.setData({
        previousCanvasColor: this.data.canvasColor,
        showClearCanvasDialog: false,
        hasUnsavedChanges: true // 标记有未保存的更改
      });
      // initCanvas 方法内部已经会调用 updateCanvasEmptyState
  },
  onClearCanvasClose(){
    this.setData({
      showClearCanvasDialog: false
    });
  }
});