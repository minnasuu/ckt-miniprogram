/**
 * 水印工具函数
 * 用于在图片下载时自动添加"织作时光"水印
 */

/**
 * 为canvas添加水印
 * @param {Object} canvas - canvas对象
 * @param {Object} ctx - canvas上下文
 * @param {string} watermarkText - 水印文字，默认为"织作时光"
 * @param {Object} options - 水印配置选项
 */
function addWatermarkToCanvas(canvas, ctx, watermarkText = '织作时光', options = {}) {
  const {
    fontSize = 12,
    color = 'rgba(0, 0, 0, 0.3)',
    position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    padding = 10
  } = options;

  // 获取canvas尺寸
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // 设置文字样式
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';

  // 计算文字尺寸
  const textMetrics = ctx.measureText(watermarkText);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // 根据位置计算坐标
  let x, y;
  switch (position) {
    case 'bottom-right':
      x = canvasWidth - textWidth - padding;
      y = canvasHeight - padding;
      break;
    case 'bottom-left':
      x = padding;
      y = canvasHeight - padding;
      break;
    case 'top-right':
      x = canvasWidth - textWidth - padding;
      y = textHeight + padding;
      break;
    case 'top-left':
      x = padding;
      y = textHeight + padding;
      break;
    default:
      x = canvasWidth - textWidth - padding;
      y = canvasHeight - padding;
  }

  // 绘制水印文字
  ctx.fillText(watermarkText, x, y);
}

/**
 * 为图片添加水印（通过canvas）
 * @param {string} imagePath - 图片路径
 * @param {string} watermarkText - 水印文字
 * @param {Object} options - 水印配置选项
 * @returns {Promise} 返回带有水印的临时文件路径
 */
function addWatermarkToImage(imagePath, watermarkText = '织作时光', options = {}) {
  return new Promise((resolve, reject) => {
    // 创建临时canvas
    const query = wx.createSelectorQuery();
    query.select('#temp-watermark-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          // 如果没有找到临时canvas，创建一个
          const canvas = wx.createOffscreenCanvas({
            type: '2d',
            width: 800,
            height: 600
          });
          const ctx = canvas.getContext('2d');
          
          // 加载图片
          const img = canvas.createImage();
          img.onload = () => {
            // 设置canvas尺寸为图片尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 绘制原图
            ctx.drawImage(img, 0, 0);
            
            // 添加水印
            addWatermarkToCanvas(canvas, ctx, watermarkText, options);
            
            // 导出为临时文件
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (result) => {
                resolve(result.tempFilePath);
              },
              fail: reject
            });
          };
          img.onerror = reject;
          img.src = imagePath;
        } else {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 加载图片
          const img = canvas.createImage();
          img.onload = () => {
            // 设置canvas尺寸为图片尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 绘制原图
            ctx.drawImage(img, 0, 0);
            
            // 添加水印
            addWatermarkToCanvas(canvas, ctx, watermarkText, options);
            
            // 导出为临时文件
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (result) => {
                resolve(result.tempFilePath);
              },
              fail: reject
            });
          };
          img.onerror = reject;
          img.src = imagePath;
        }
      });
  });
}

/**
 * 为canvas导出添加水印的包装函数
 * @param {Object} canvas - canvas对象
 * @param {Object} ctx - canvas上下文
 * @param {Object} exportOptions - 导出选项
 * @param {string} watermarkText - 水印文字
 * @param {Object} watermarkOptions - 水印配置选项
 * @returns {Promise} 返回带有水印的临时文件路径
 */
function exportCanvasWithWatermark(canvas, ctx, exportOptions = {}, watermarkText = '织作时光', watermarkOptions = {}) {
  return new Promise((resolve, reject) => {
    // 添加水印
    addWatermarkToCanvas(canvas, ctx, watermarkText, watermarkOptions);
    
    // 导出canvas
    wx.canvasToTempFilePath({
      canvas: canvas,
      ...exportOptions,
      success: (result) => {
        resolve(result.tempFilePath);
      },
      fail: reject
    });
  });
}

module.exports = {
  addWatermarkToCanvas,
  addWatermarkToImage,
  exportCanvasWithWatermark
};
