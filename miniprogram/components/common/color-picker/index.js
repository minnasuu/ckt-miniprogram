// components/common/color-picker/index.js
Component({
  properties: {
    value: {
      type: String,
      value: '#ffcbcb'
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  observers: {
    // 监听value属性变化，自动重新解析颜色
    'value': function (newValue) {
      if (newValue && newValue !== this.data.currentColor) {
        console.log('value属性变化，重新解析颜色:', newValue);
        this.parseColor(newValue);
      }
    }
  },

  data: {
    // 颜色相关数据 - 这些值将在parseColor中被正确设置
    hue: 0,
    saturation: 100,
    lightness: 100,
    opacity: 100,

    // RGB值 - 这些值将在parseColor中被正确设置
    red: 255,
    green: 203,
    blue: 203,

    // 颜色面板触摸相关
    colorPanelSize: 160,
    colorPanelWidth: 0,
    selectorX: 0,
    selectorY: 0,

    // 当前颜色 - 这些值将在parseColor中被正确设置
    currentColor: '#ffcbcb',
    hexColor: '#ffcbcb',

    // 组件状态
    isDragging: false
  },

  lifetimes: {
    attached() {
      this.initColor();
      this.initColorPanelSize();
    }
  },

  methods: {
    // 初始化颜色
    initColor() {
      this.parseColor(this.data.value);
    },

    // 初始化颜色面板尺寸
    initColorPanelSize() {
      const systemInfo = wx.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      const colorPanelWidth = screenWidth - 40; // 屏幕宽度减去40px的边距

      this.setData({
        colorPanelWidth: colorPanelWidth,
        colorPanelSize: 160 // 高度固定为160px
      });

      console.log('颜色面板尺寸初始化:', {
        screenWidth,
        colorPanelWidth,
        colorPanelSize: 160
      });
    },

    // 解析颜色值
    parseColor(color) {
      let r, g, b, opacity = 100;

      if (color.startsWith('#')) {
        // HEX格式处理
        let hex = color.substring(1);
        
        if (hex.length === 8) {
          opacity = parseInt(hex.substring(6, 8), 16) / 255 * 100;
          hex = hex.substring(0, 6);
        } else if (hex.length === 3) {
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else if (color.startsWith('rgb')) {
        // RGB/RGBA格式处理
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
          r = parseInt(rgbMatch[1]);
          g = parseInt(rgbMatch[2]);
          b = parseInt(rgbMatch[3]);
          opacity = rgbMatch[4] ? Math.round(parseFloat(rgbMatch[4]) * 100) : 100;
        }
      }

      // 如果成功解析了RGB值，则更新所有色板数据
      if (r !== undefined && g !== undefined && b !== undefined) {
        this.updateColorFromRgb(r, g, b, opacity);
      }
    },

    // 从RGB值更新颜色数据
    updateColorFromRgb(r, g, b, opacity = 100) {
      const hsl = this.rgbToHsl(r, g, b);
      const hex = this.rgbToHex(r, g, b);
      console.log(r, g, b, opacity);

      this.setData({
        hue: hsl.h,
        saturation: hsl.s,
        lightness: hsl.l,
        opacity: opacity,
        hexColor: hex,
        currentColor: opacity < 100 ? hex + Math.round(opacity * 255 / 100).toString(16).padStart(2, '0') : hex,
        red: r,
        green: g,
        blue: b
      });

      this.updateSelectorPosition();
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
      
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
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
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      
      return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
      ];
    },

    // RGB转HEX
    rgbToHex(r, g, b) {
      const toHex = (n) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return '#' + toHex(r) + toHex(g) + toHex(b);
    },

    // 更新选择器位置
    updateSelectorPosition() {
      const { saturation, lightness, colorPanelWidth, colorPanelSize } = this.data;
      const x = (saturation / 100) * colorPanelWidth;
      const y = ((100 - lightness) / 100) * colorPanelSize;
      
      this.setData({
        selectorX: x,
        selectorY: y
      });
    },



    // 触摸事件处理（微信小程序兼容）
    onTouchStart(e) {
      this.setData({ isDragging: true });
      this.onTouchMove(e);
    },

    onTouchMove(e) {
      if (!this.data.isDragging) return;

      const touch = e.touches[0];
      const query = wx.createSelectorQuery().in(this);
      query.select('.color-panel-bg').boundingClientRect((rect) => {
        if (rect) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          // 限制在面板范围内，使用宽度和高度分别计算
          const clampedX = Math.max(0, Math.min(x, this.data.colorPanelWidth));
          const clampedY = Math.max(0, Math.min(y, this.data.colorPanelSize));

          const saturation = Math.round((clampedX / this.data.colorPanelWidth) * 100);
          const lightness = Math.round(((this.data.colorPanelSize - clampedY) / this.data.colorPanelSize) * 100);

          this.setData({
            saturation,
            lightness,
            selectorX: clampedX,
            selectorY: clampedY
          });

          this.updateCurrentColor();
        }
      }).exec();
    },

    onTouchEnd(e) {
      this.setData({ isDragging: false });
    },

    // 色相滑块变化
    onHueChange(e) {
      const hue = e.detail.value;
      this.setData({ hue });
      this.updateCurrentColor();
    },

    // 透明度滑块变化
    onOpacityChange(e) {
      const opacity = e.detail.value;
      this.setData({ opacity });
      this.updateCurrentColor();
    },

    // 更新当前颜色
    updateCurrentColor() {
      const { hue, saturation, lightness, opacity } = this.data;
      const rgb = this.hslToRgb(hue, saturation, lightness);
      const alpha = Math.round(opacity * 255 / 100).toString(16).padStart(2, '0');

      const hexColor = '#' + rgb.map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');

      const currentColor = hexColor + alpha.toUpperCase();

      this.setData({
        hexColor,
        currentColor,
        red: rgb[0],
        green: rgb[1],
        blue: rgb[2]
      });

      // 统一事件数据格式，同时支持color和value字段
      this.triggerEvent('change', {
        color: currentColor,
        value: currentColor,
        hex: hexColor,
        rgb: rgb,
        hsl: { h: hue, s: saturation, l: lightness },
        opacity: opacity
      });
    },

    // HEX输入框变化
    onHexInput(e) {
      const value = e.detail.value;
      if (value.startsWith('#') && (value.length === 4 || value.length === 7 || value.length === 9)) {
        this.parseColor(value);
        this.updateCurrentColor();
      }
    },

    // RGB输入框变化
    onRgbInput(e) {
      const { type, value } = e.detail;
      const numValue = parseInt(value) || 0;
      const clampedValue = Math.max(0, Math.min(255, numValue));

      let rgb = [this.data.red, this.data.green, this.data.blue];
      switch (type) {
        case 'red':
          rgb[0] = clampedValue;
          break;
        case 'green':
          rgb[1] = clampedValue;
          break;
        case 'blue':
          rgb[2] = clampedValue;
          break;
      }

      this.updateColorFromRgb(rgb[0], rgb[1], rgb[2], this.data.opacity);
      this.updateCurrentColor();
    },

    // 阻止事件冒泡
    preventBubble() {
      return false;
    }
  }
});