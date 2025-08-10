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
    this.pickMainColorH();
  },
  pickMainColorH(){
    if (!this.data.imageUrl) {
      this.showMessage('请先上传图片');
      return;
    }
    const {imgWidth,imgHeight} = this.data;
    wx.getImageInfo({
      src: this.data.imageUrl,
      success: (res) => {
        // 创建离屏 canvas 处理图片
        const canvas = wx.createOffscreenCanvas({ type: '2d', width: imgWidth, height: imgHeight });
        const ctx = canvas.getContext('2d');
        
        const img = canvas.createImage();
        img.src = res.path;
        
        img.onload = () => {
          // 绘制图片到 canvas
          ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
          
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
            newColorArr: resultArr.map(_c => '#FFF'),
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
            const img = new Image();
            img.src = imgUrl;
            img.onload = () => {
                // 重置画布
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // 开始新的颜色替换
                this.startColorReplacement(canvas,ctx);
            };
        } else {
            // 直接开始颜色替换
            this.startColorReplacement(canvas,ctx);
        }
    });
  },
  startColorReplacement(canvas,ctx){
    if (!ctx) return;
    this.setData({
      generateLoading:true,
      isCancelled:false,
    })
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 使用 requestAnimationFrame 进行分批处理
        let currentIndex = 0;
        const batchSize = 10000; // 每批处理的像素数

        const processNextBatch = () => {
            if (this.data.isCancelled) {
              this.setData({
                generateLoading:false,
              })
                return;
            }

            const endIndex = Math.min(currentIndex + batchSize, data.length);
            
            // 处理当前批次的像素
            for (let i = currentIndex; i < endIndex; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
        
                // 查找是否需要替换当前颜色
                const colorToReplace = this.data.newColorArr.find(c => {
                    if (!c || !c.original || typeof c.original !== 'string') return false;
                    const matches = c.original.match(/\d+/g);
                    if (!matches) return false;
                    const [origR, origG, origB] = matches.map(Number);
                    
                    if (hueMode) {
                        const [origH] = rgbToHsl(origR, origG, origB);
                        const [currentH] = rgbToHsl(r, g, b);
                        return Math.abs(currentH - origH) < 10;
                    } else {
                        const tolerance = 30;
                        return Math.abs(r - origR) <= tolerance && 
                               Math.abs(g - origG) <= tolerance && 
                               Math.abs(b - origB) <= tolerance;
                    }
                });
        
                if (colorToReplace) {
                    const newColor = hexToRgb(colorToReplace.new);
                    if (newColor) {
                        if (hueMode) {
                            const [, origS, origL] = rgbToHsl(r, g, b);
                            const [newH] = rgbToHsl(newColor.r, newColor.g, newColor.b);
                            const [newR, newG, newB] = hslToRgb(newH, origS, origL);
                            data[i] = newR;
                            data[i + 1] = newG;
                            data[i + 2] = newB;
                        } else {
                            data[i] = newColor.r;
                            data[i + 1] = newColor.g;
                            data[i + 2] = newColor.b;
                        }
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
                  generateLoading:false,
                  hasModified:true,
                })
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
  }
})