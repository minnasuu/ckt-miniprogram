Component({
  properties: {
    mainColors: {
      type: Array,
      value: []
    },
    imgUrl: {
      type: String,
      value: ''
    },
    colorNum: {
      type: Number,
      value: 5,
    }
  },
  data:{
    colorList:[],
    isLoading:true,
    colorIndexArray: [1,2,3,4,5]
  },
  lifetimes: {
    attached() {
      // 在组件实例进入页面节点树时执行
      this.getMainColors();
    },
    detached() {
      // 在组件实例被从页面节点树移除时执行
    }
  },
  observers: {
    'colorNum': function(colorNum) {
      const arr = [];
      for (let i = 1; i <= colorNum; i++) {
        arr.push(i);
      }
      this.setData({
        colorIndexArray: arr
      });
    }
  },
  methods: {
    getMainColors() {
      wx.getImageInfo({
        src: this.data.imgUrl,
        success: (res) => {
          const result = this.processImage(res.path); // 处理图片数据
          result.then((processedRes) => {
            this.setData({
              colorList: processedRes?.map(i =>i.value),
              isLoading: false
            });
          });
        },
        fail: (error) => {
          console.error('获取图片信息失败:', error);
        }
      });
    },
  
    // 处理图片数据
    async processImage(imgPath) {
      try {
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
        const res = await this.extractColors(imageData.data);
        return res;
      } catch (error) {
        console.error('处理图片出错:', error);
      }
    },
  
    // 设置颜色数组
    async extractColors(imageData) {
      try {
        const colors = await this.getTopColors(imageData);
        if (!colors || !colors.length) {
          return;
        }
  
        const mainColors = colors.map(itm => ({
          id: itm[0] + itm[1] + itm[2],
          value: this.rgbToHex(itm[0], itm[1], itm[2])
        }));
  
        return mainColors;
      } catch (error) {
        console.error('提取颜色错误:', error);
      }
    },
  
    // 根据像素获取主色
    async getTopColors(pixelData) {
      try {
        if (!pixelData || pixelData.length === 0) {
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
          return [];
        }
  
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
        const maxColors = this.properties.colorNum; // 假设取前5个颜色
        const similarityThreshold = 32;
  
        for (const color of sortedColors) {
          if (filteredColors.length >= maxColors) break;
  
          if (!this.isGrayColor(color) &&
            !filteredColors.some(c => this.areColorsSimilar(color, c, similarityThreshold))) {
            filteredColors.push(color);
          }
        }
  
        return filteredColors;
      } catch (error) {
        console.error('提取主色失败:', error);
        return [];
      }
    },
  
    // 中性色判断
    isGrayColor(color) {
      const filter = 10;
      const hsv = this.rgbToHsv(color[0], color[1], color[2]);
      if (hsv.s <= filter / 100 || hsv.v <= filter / 100) {
        return true;
      } else {
        return false;
      }
    },
  
    // 颜色相似度判断
    areColorsSimilar(color1, color2, threshold = 32) {
      if (this.isGrayColor(color1)) {
        return true;
      }
      const rDiff = color1[0] - color2[0];
      const gDiff = color1[1] - color2[1];
      const bDiff = color1[2] - color2[2];
      return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff) < threshold;
    },
      // 原代码中缺失 rgbToHex 和 rgbToHsv 方法，需补充
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0; // achromatic
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h, s, v };
  }
  }
});