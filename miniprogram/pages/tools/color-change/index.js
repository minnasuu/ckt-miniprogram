// pages/tools/color-change/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    author:null,
    statusBarHeight:0,
    imageUrl:'',
    imgWidth: 0,
    imgHeight: 0,
    imgRatio: 0,
    colorArr:[],
    newColorArr:['#FFF','#FFF','#FFF','#FFF','#FFF','#FFF'],
    showAlert: false,
    alertMessage: '',
    // 当前操作周期是否修改过替换的颜色
    hasModified:false,
    generateLoading:false,
    isCancelled:false,
    finished: false,
    showColorPicker: false,
    currentColor: '#FFF',
    currentColorIndex: 0,
    canvasStyle: '', // 动态canvas样式
    // 存储原始图片数据，用于重置
    originalImageData: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
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
  // 处理图片上传事件
  onImageSelected(e) {
    const { imageUrl,width,height } = e.detail;
    this.setData({
      colorArr: [],
      imageUrl,
      imgWidth:width,
      imgHeight:height,
      imgRatio:width/height,
    });
    // 先绘制图片到canvas，再提取颜色
    this.drawImageToCanvas();
    this.pickMainColorH();
  },
  pickMainColorH(){
    if (!this.data.imageUrl) {
      this.showMessage('请先上传图片');
      return;
    }
    const { imgWidth, imgHeight } = this.data;
    const systemInfo = wx.getSystemInfoSync();
    const canvasWidth = systemInfo.windowWidth - 40;
    const canvasHeight = canvasWidth / this.data.imgRatio;
    wx.getImageInfo({
      src: this.data.imageUrl,
      success: (imageRes) => {
        // 创建离屏 canvas 处理图片
        const canvas = wx.createOffscreenCanvas({ type: '2d' });
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        const img = canvas.createImage();
        img.src = imageRes.path;
        
        img.onload = () => {
          console.log('原图尺寸:', imgWidth, imgHeight);
          console.log('Canvas尺寸:', canvasWidth, canvasHeight);
          console.log('图片比例:', this.data.imgRatio);

          // 绘制图片到 canvas，保持比例
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          
          // 获取像素数据
          const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
          const data = imageData.data;
          
          const colorMap = {};
        
        // 每隔一定像素采样，提高性能但保持足够的采样量
        const sampleStep = Math.max(1, Math.floor(data.length / 4 / 50000));
        
        for (let i = 0; i < data.length; i += 4 * sampleStep) {
            // 将RGB值量化到更小的区间，提高颜色区分度
            const r = Math.floor(data[i] / 16) * 16;  // 改为16个区间
            const g = Math.floor(data[i + 1] / 16) * 16;
            const b = Math.floor(data[i + 2] / 16) * 16;
            const a = data[i + 3];
            
            // 忽略透明像素和接近白色的像素
            if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;
            
            const colorKey = `${r},${g},${b}`;
            colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
        }
        
        // 合并相似颜色
        const mergedColors = {};
        Object.entries(colorMap).forEach(([color1, count1]) => {
            const [r1, g1, b1] = color1.split(',').map(Number);
            
            // 检查是否已经有相似的颜色
            let found = false;
            for (const [color2, count2] of Object.entries(mergedColors)) {
                const [r2, g2, b2] = color2.split(',').map(Number);
                
                // 计算颜色距离
                const distance = Math.sqrt(
                    Math.pow(r1 - r2, 2) +
                    Math.pow(g1 - g2, 2) +
                    Math.pow(b1 - b2, 2)
                );
                
                // 如果颜色相似，合并到已有颜色中
                if (distance < 30) {
                    mergedColors[color2] = count1 + count2;
                    found = true;
                    break;
                }
            }
            
            // 如果没有相似颜色，添加新颜色
            if (!found) {
                mergedColors[color1] = count1;
            }
        });
        
        // 获取出现频率最高的三种颜色
        const resultArr= Object.entries(mergedColors)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([color]) => {
                const [r, g, b] = color.split(',').map(Number);
                return `rgb(${r}, ${g}, ${b})`;
            });
          
          // 更新数据
          this.setData({
            colorArr: resultArr,
            newColorArr: resultArr,
          });
          
          this.showMessage('已提取主要色相');
        };
        
        img.onerror = () => {
          console.error('图片加载失败');
          this.showMessage('图片加载失败');
        };
      },
      fail: (error) => {
        console.error('获取图片信息失败:', error);
        this.showMessage('获取图片信息失败');
      }
    });
  },

  generate(){
    const query = wx.createSelectorQuery();
    query.select('#result-canvas').fields({node:true,size:true}).exec((res)=>{
      if (this.data.newColorArr.length === 0) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 如果已经修改过，先重置
      if (this.data.hasModified) {
        this.resetCanvas(canvas, ctx);
      } else {
        // 直接开始颜色替换
        this.startColorReplacement(canvas, ctx);
      }
    });
  },

  // 重置canvas到原始状态
  resetCanvas(canvas, ctx) {
    if (!this.data.originalImageData) {
      // 如果没有原始数据，重新绘制原图
      const img = canvas.createImage();
      img.src = this.data.imageUrl;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // 重新开始颜色替换
        this.startColorReplacement(canvas, ctx);
      };
    } else {
      // 使用保存的原始数据重置
      ctx.putImageData(this.data.originalImageData, 0, 0);
      this.startColorReplacement(canvas, ctx);
    }
  },

  // 清除canvas效果，恢复到原始状态
  clearCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#result-canvas').fields({ node: true, size: true }).exec((res) => {
      if (res[0] && res[0].node) {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (this.data.originalImageData) {
          // 使用保存的原始数据恢复
          ctx.putImageData(this.data.originalImageData, 0, 0);
        } else {
          // 重新绘制原图
          const img = canvas.createImage();
          img.src = this.data.imageUrl;
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        }

        // 重置状态
        this.setData({
          hasModified: false,
          finished: false,
          generateLoading: false
        });

        this.showMessage('已清除效果');
      }
    });
  },

  startColorReplacement(canvas, ctx) {
    if (!ctx) return;

    this.setData({
      generateLoading: true,
      isCancelled: false,
    });
        
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 如果是第一次修改，保存原始数据
    if (!this.data.originalImageData) {
      this.setData({
        originalImageData: imageData
      });
    }

    // 创建颜色映射表：原色 -> 新色
    const colorMapping = {};
    this.data.colorArr.forEach((originalColor, index) => {
      const newColor = this.data.newColorArr[index];
      if (originalColor !== newColor) {
        colorMapping[originalColor] = newColor;
      }
    });

    // 如果没有颜色需要替换，直接返回
    if (Object.keys(colorMapping).length === 0) {
      this.setData({
        generateLoading: false,
        hasModified: false,
      });
      this.showMessage('没有颜色需要替换');
      return;
    }

    // 使用 requestAnimationFrame 进行分批处理
    let currentIndex = 0;
    const batchSize = 10000; // 每批处理的像素数

    const processNextBatch = () => {
      if (this.data.isCancelled) {
        this.setData({
          generateLoading: false,
        });
        return;
      }

      const endIndex = Math.min(currentIndex + batchSize, data.length);

      // 处理当前批次的像素
      for (let i = currentIndex; i < endIndex; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // 跳过透明像素
        if (a < 128) continue;

        // 将当前像素转换为RGB字符串格式
        const currentColor = `rgb(${r}, ${g}, ${b})`;

        // 查找是否需要替换当前颜色
        let shouldReplace = false;
        let newColor = null;

        // 遍历所有需要替换的颜色
        for (const [originalColor, replacementColor] of Object.entries(colorMapping)) {
          if (this.colorsMatch(currentColor, originalColor)) {
            shouldReplace = true;
            newColor = replacementColor;
            break;
          }
        }

        if (shouldReplace && newColor) {
          const rgbColor = this.hexToRgb(newColor);
          if (rgbColor) {
            data[i] = rgbColor.r;
            data[i + 1] = rgbColor.g;
            data[i + 2] = rgbColor.b;
          }
        }
      }

      currentIndex = endIndex;

      // 更新画布显示进度
      ctx.putImageData(imageData, 0, 0);

      // 如果还有未处理的像素，继续下一批
      if (currentIndex < data.length && !this.data.isCancelled) {
        canvas.requestAnimationFrame(processNextBatch);
      } else {
        this.setData({
          generateLoading: false,
          hasModified: true, // 标记已经修改过
          finished: true, // 标记转换完成
        });
        this.showMessage('颜色转换完成');
      }
    };

    // 开始处理第一批
    canvas.requestAnimationFrame(processNextBatch);
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
      h: h,
      s: s,
      v: v
    };
  },
  
  // HSV转RGB
  hsvToRgb(h, s, v) {
    let r, g, b;
    
    const i = Math.floor(h / 60) % 6;
    const f = h / 60 - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  },
  
  // RGB转HSL
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100)
    ];
  },

  // HSL转RGB
  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];
  },

  // HEX转RGB
  hexToRgb(hex) {
    // 移除可能的 # 前缀
    hex = hex.replace(/^#/, '');
    
    // 处理简写形式（例如 #FFF）
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // 解析 RGB 值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 检查解析是否成功
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }
    
    return { r, g, b };
  },
  
  // RGB转HEX
  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return '#' + toHex(r) + toHex(g) + toHex(b);
  },

  // 判断两个颜色是否匹配（支持容差）
  colorsMatch(color1, color2) {
    // 如果两个颜色完全相同，直接返回true
    if (color1 === color2) return true;

    // 解析RGB值
    const rgb1 = this.parseRgbString(color1);
    const rgb2 = this.parseRgbString(color2);

    if (!rgb1 || !rgb2) return false;

    // 计算颜色距离，设置容差为30
    const tolerance = 30;
    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );

    return distance <= tolerance;
  },

  // 解析RGB字符串格式
  parseRgbString(rgbString) {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return null;
  },

  // 点击颜色块
  onColorTap(e) {
    const index = e.currentTarget.dataset.index;
    console.log(index, this.data.newColorArr[index]);

    this.setData({
      showColorPicker: true,
      currentColor: this.data.newColorArr[index],
      currentColorIndex: index
    });
  },

  // 颜色选择确认
  onColorConfirm(e) {
    const { value, color } = e.detail;

    // 优先使用value字段，如果没有则使用color字段（向后兼容）
    const selectedColor = value || color;

    if (!selectedColor) {
      console.error('未接收到颜色值');
      return;
    }

    const { currentColorIndex } = this.data;

    const newColorArr = [...this.data.newColorArr];
    newColorArr[currentColorIndex] = selectedColor;

    this.setData({
      newColorArr,
      showColorPicker: false,
      hasModified: true
    });

    // 显示成功提示
    this.showMessage('颜色已更新');
  },

  // 颜色选择取消
  onColorCancel() {
    this.setData({
      showColorPicker: false
    });
  },

  // 绘制图片到canvas
  drawImageToCanvas() {
    if (!this.data.imageUrl) {
      console.log('没有图片URL，无法绘制');
      return;
    }

    console.log('开始绘制图片到canvas');
    console.log('图片URL:', this.data.imageUrl);
    console.log('原图尺寸:', this.data.imgWidth, this.data.imgHeight);
    console.log('原图比例:', this.data.imgRatio);

    // 获取屏幕宽度，计算canvas宽度（100%屏宽-40px）
    const systemInfo = wx.getSystemInfoSync();
    const canvasWidth = systemInfo.windowWidth - 40;
    const canvasHeight = canvasWidth / this.data.imgRatio;

    console.log('计算出的Canvas尺寸:', canvasWidth, canvasHeight);

    const query = wx.createSelectorQuery();
    query.select('#result-canvas').fields({ node: true, size: true }).exec((res) => {
      console.log('Canvas查询结果:', res);

      if (res[0] && res[0].node) {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('无法获取Canvas上下文');
          return;
        }

        console.log('Canvas节点获取成功');

        // 设置canvas的实际绘制尺寸
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        console.log('设置后的Canvas尺寸:', canvas.width, canvas.height);

        // 设置canvas的CSS样式尺寸，确保显示正确
        // 注意：在微信小程序中，需要通过setData来更新样式
        this.setData({
          canvasStyle: `width: ${canvasWidth}px; height: ${canvasHeight}px;`
        });

        // 创建图片对象
        const img = canvas.createImage();

        img.onload = () => {
          // 清空canvas
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);

          // 绘制图片到canvas，保持比例
          // 使用目标尺寸绘制，确保图片不会被压缩
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

          // 重置状态
          this.setData({
            hasModified: false,
            finished: false,
            originalImageData: null
          });
        };

        img.onerror = (error) => {
          this.showMessage('图片加载失败');
        };

        // 设置图片源
        console.log('设置图片源:', this.data.imageUrl);
        img.src = this.data.imageUrl;
      } else {
        console.error('Canvas节点获取失败:', res);
      }
    });
  }
})