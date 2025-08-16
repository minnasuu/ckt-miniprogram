Component({
  properties: {
    value: {
      type: String,
      value: '#202020' // 默认红色，完全不透明
    },
    width: {
      type: String,
      value: '60px' // 默认宽度，单位rpx
    },
    height: {
      type: String,
      value: '60px' // 默认高度，单位rpx
    },
    disabled: {
      type: Boolean,
      value: false
    },
    hueColors: {
      type: Array,
      value:[
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
        '#00FFFF', '#0000FF', '#8B00FF', '#FF0000'
      ]
    },
    text:{
      type: String,
      value: ''
    }
  },

  data: {
    showColorPanel: false,
    hue: 0,
    saturation: 100,
    lightness: 50,
    opacity: 100,
    rgbColor: 'rgb(255, 0, 0)',
    hexColor: '#202020',
    currentColor: '#202020FF'
  },

  lifetimes: {
    attached() {
      this.parseColor(this.data.value);
    }
  },

  methods: {
    // 解析传入的颜色值
    parseColor(color) {
      // 处理十六进制颜色值 #RRGGBB 或 #RRGGBBAA
      if (color.startsWith('#')) {
        let hex = color.substring(1);
        let opacity = 100;
        
        if (hex.length === 8) {
          // 处理带透明度的颜色 #RRGGBBAA
          opacity = parseInt(hex.substring(6, 8), 16) / 255 * 100;
          hex = hex.substring(0, 6);
        } else if (hex.length === 3) {
          // 处理简写的颜色 #RGB
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        // 将十六进制转换为RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // 更新数据
        this.setData({
          hexColor: '#' + hex,
          rgbColor: `rgb(${r}, ${g}, ${b})`,
          opacity: opacity,
          currentColor: color
        });
        
        // 计算HSL值
        this.rgbToHsl(r, g, b);
      }
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
        h = s = 0; // 灰色
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
      
      this.setData({
        hue: Math.round(h * 360),
        saturation: Math.round(s * 100),
        lightness: Math.round(l * 100)
      });
    },
    
    // HSL转RGB
    hslToRgb(h, s, l) {
      h /= 360;
      s /= 100;
      l /= 100;
      
      let r, g, b;
      
      if (s === 0) {
        r = g = b = l; // 灰色
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
      
      const rgb = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
      ];
      
      // 更新RGB和十六进制颜色
      const hexColor = '#' + rgb.map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      
      this.setData({
        rgbColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
        hexColor: hexColor
      });
      
      return rgb;
    },
    
    // 更新当前颜色
    updateCurrentColor() {
      const rgb = this.hslToRgb(this.data.hue, this.data.saturation, this.data.lightness);
      const opacity = this.data.opacity;
      const alpha = Math.round(opacity * 255 / 100).toString(16).padStart(2, '0');
      const currentColor = this.data.hexColor + alpha.toUpperCase();
      
      this.setData({ currentColor });
      this.triggerEvent('change', { color: currentColor });
    },
    
    // 显示/隐藏颜色面板
    toggleColorPanel() {
      if (this.data.disabled) return;
      
      this.setData({
        showColorPanel: !this.data.showColorPanel
      });
    },
    
    // 关闭颜色面板
    closeColorPanel() {
      this.setData({
        showColorPanel: false
      });
    },
    
    // 处理色相滑块变化
    onHueChange(e) {
      const hue = e.detail.value;
      this.setData({ hue });
      this.hslToRgb(hue, this.data.saturation, this.data.lightness);
      this.updateCurrentColor();
    },
    
    // 处理饱和度滑块变化
    onSaturationChange(e) {
      const saturation = e.detail.value;
      this.setData({ saturation });
      this.hslToRgb(this.data.hue, saturation, this.data.lightness);
      this.updateCurrentColor();
    },
    
    // 处理亮度滑块变化
    onLightnessChange(e) {
      const lightness = e.detail.value;
      this.setData({ lightness });
      this.hslToRgb(this.data.hue, this.data.saturation, lightness);
      this.updateCurrentColor();
    },
    
    // 处理不透明度滑块变化
    onOpacityChange(e) {
      const opacity = e.detail.value;
      this.setData({ opacity });
      this.updateCurrentColor();
    },
    
    // 点击预设颜色
    onPresetColorTap(e) {
      const color = e.currentTarget.dataset.color;
      this.parseColor(color);
      this.updateCurrentColor();
    },
    
    // 阻止事件冒泡
    preventBubble() {
      return false;
    }
  }
})