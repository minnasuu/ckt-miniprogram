Component({
  properties: {
    palette: {
      type: Object,
      value: {},
      observer: function (newVal, oldVal) {
        if (newVal && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          this.initCanvas();
        }
      }
    }
  },

  data: {
    picURL: '',
    showCanvas: true,
    painterStyle: ''
  },

  methods: {
    initCanvas() {
      const palette = this.data.palette;
      if (!palette || !palette.width || !palette.height) {
        return;
      }

      this.setData({
        painterStyle: `width:${palette.width}px;height:${palette.height}px;`
      });

      const query = this.createSelectorQuery();
      query.select('#canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('Canvas 节点未找到');
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;

          canvas.width = palette.width * dpr;
          canvas.height = palette.height * dpr;
          ctx.scale(dpr, dpr);

          this.drawCanvas(ctx, palette);
        });
    },

    async drawCanvas(ctx, palette) {
      // 绘制背景
      if (palette.background) {
        ctx.fillStyle = palette.background;
        ctx.fillRect(0, 0, palette.width, palette.height);
      }

      // 绘制渐变背景
      if (palette.gradient) {
        const gradient = ctx.createLinearGradient(
          0, 0, 
          palette.width, 
          palette.height
        );
        palette.gradient.forEach(item => {
          gradient.addColorStop(item.offset, item.color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, palette.width, palette.height);
      }

      // 绘制视图列表
      if (palette.views && palette.views.length > 0) {
        for (let view of palette.views) {
          await this.drawView(ctx, view);
        }
      }

      // 导出图片
      this.exportImage();
    },

    async drawView(ctx, view) {
      if (view.type === 'text') {
        await this.drawText(ctx, view);
      } else if (view.type === 'image') {
        await this.drawImage(ctx, view);
      } else if (view.type === 'rect') {
        this.drawRect(ctx, view);
      }
    },

    async drawText(ctx, view) {
      ctx.save();
      
      // 设置字体
      const fontSize = view.fontSize || 14;
      const fontWeight = view.fontWeight || 'normal';
      const fontFamily = view.fontFamily || 'sans-serif';
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      
      // 设置颜色
      ctx.fillStyle = view.color || '#000000';
      
      // 设置对齐
      ctx.textAlign = view.textAlign || 'left';
      ctx.textBaseline = view.baseline || 'top';
      
      // 设置透明度
      if (view.opacity !== undefined) {
        ctx.globalAlpha = view.opacity;
      }

      // 处理文本换行
      const text = view.text || '';
      const maxWidth = view.width || 0;
      
      if (maxWidth > 0) {
        const lines = this.wrapText(ctx, text, maxWidth);
        const lineHeight = view.lineHeight || fontSize * 1.2;
        
        lines.forEach((line, index) => {
          ctx.fillText(line, view.left || 0, (view.top || 0) + index * lineHeight);
        });
      } else {
        ctx.fillText(text, view.left || 0, view.top || 0);
      }
      
      ctx.restore();
    },

    async drawImage(ctx, view) {
      return new Promise((resolve) => {
        if (!view.url) {
          resolve();
          return;
        }

        wx.getImageInfo({
          src: view.url,
          success: (res) => {
            ctx.save();
            
            if (view.opacity !== undefined) {
              ctx.globalAlpha = view.opacity;
            }

            const left = view.left || 0;
            const top = view.top || 0;
            const width = view.width || res.width;
            const height = view.height || res.height;

            ctx.drawImage(res.path, left, top, width, height);
            ctx.restore();
            resolve();
          },
          fail: () => {
            resolve();
          }
        });
      });
    },

    drawRect(ctx, view) {
      ctx.save();
      
      if (view.color) {
        ctx.fillStyle = view.color;
      }
      
      if (view.opacity !== undefined) {
        ctx.globalAlpha = view.opacity;
      }

      const left = view.left || 0;
      const top = view.top || 0;
      const width = view.width || 0;
      const height = view.height || 0;

      ctx.fillRect(left, top, width, height);
      ctx.restore();
    },

    wrapText(ctx, text, maxWidth) {
      const words = text.split('');
      const lines = [];
      let currentLine = '';

      for (let word of words) {
        const testLine = currentLine + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    },

    exportImage() {
      const query = this.createSelectorQuery();
      query.select('#canvas')
        .fields({ node: true })
        .exec((res) => {
          if (!res || !res[0]) {
            return;
          }

          const canvas = res[0].node;
          
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: (res) => {
              this.setData({
                picURL: res.tempFilePath
              });
              
              this.triggerEvent('imgOK', {
                path: res.tempFilePath
              });
            },
            fail: (err) => {
              console.error('导出图片失败:', err);
              this.triggerEvent('imgErr', err);
            }
          });
        });
    }
  }
});
