Component({
  properties: {
    imageUrl: {
      type: String,
      value: ''
    },
    width: {
      type: String,
      value: '100%'
    },
    height: {
      type: String,
      value: '160px'
    },
    placeholderText: {
      type: String,
      value: '点击选择图片'
    },
    multiple:{
      type:Boolean,
      value: false,
    },
    maxSize: {
      type: Number,
      value: 2 * 1024 * 1024 // 默认2MB
    }
  },
  
  data: {
    loading: false // 上传加载状态
  },
  
  methods: {
    // 选择图片
    async chooseImage() {
      try {
        const res = await wx.chooseMedia({
          count: this.data.multiple ? 20:1,
          mediaType: ['image'],
        });

        if(!this.data.multiple){
          const tempFilePath = res.tempFiles[0].tempFilePath;

          // 选择完照片后显示加载状态
          this.setData({ loading: true });

          // 获取图片信息
          const imageInfo = await wx.getImageInfo({
            src: tempFilePath
          });
          const fileInfo = await wx.getFileInfo({
            filePath: tempFilePath
          });

          // 检查文件大小
          if (fileInfo.size > this.data.maxSize) {
            const maxSizeMB = (this.data.maxSize / (1024 * 1024)).toFixed(1);
            const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
            this.showAlert(`图片过大(${fileSizeMB}MB)，请选择小于${maxSizeMB}MB的图片`, 'error');
            // 隐藏加载状态
            this.setData({ loading: false });
            return;
          }

          // 触发事件，将图片信息传递给父组件
          this.triggerEvent('imageSelected', {
            imageUrl: tempFilePath,
            width: imageInfo.width,
            height: imageInfo.height,
            size: fileInfo.size
          });

          // 隐藏加载状态
          this.setData({ loading: false });
        }else{
          // 选择完照片后显示加载状态
          this.setData({ loading: true });

          const resData = [];
          const oversizedFiles = [];

          for (let i = 0; i < res.tempFiles.length; i++) {
            const tempFilePath = res.tempFiles[i].tempFilePath;

            try {
              const imageInfo = await wx.getImageInfo({
                src: tempFilePath
              });
              const fileInfo = await wx.getFileInfo({
                filePath: tempFilePath
              });

              // 检查文件大小
              if (fileInfo.size > this.data.maxSize) {
                oversizedFiles.push(i + 1);
                continue;
              }

              resData.push({
                imageUrl: tempFilePath,
                width: imageInfo.width,
                height: imageInfo.height,
                size: fileInfo.size
              });
            } catch (infoError) {
              console.error('获取图片信息失败:', infoError);
              // 跳过获取信息失败的图片
            }
          }

          // 如果有超大文件，显示提示
          if (oversizedFiles.length > 0) {
            const maxSizeMB = (this.data.maxSize / (1024 * 1024)).toFixed(1);
            this.showAlert(`第${oversizedFiles.join('、')}张图片过大，已跳过，请选择小于${maxSizeMB}MB的图片`, 'warning');
          }

          if (resData.length > 0) {
            this.triggerEvent('imageSelected', { resData });
          } else if (oversizedFiles.length === res.tempFiles.length) {
            // 所有图片都超大
            const maxSizeMB = (this.data.maxSize / (1024 * 1024)).toFixed(1);
            this.showAlert(`所有图片都过大，请选择小于${maxSizeMB}MB的图片`);
          }

          // 隐藏加载状态
          this.setData({ loading: false });
        }
      } catch (error) {
        console.log('选择图片失败:', error);
        this.handleChooseMediaError(error);
        // 隐藏加载状态
        this.setData({ loading: false });
      }
    },
    // 处理chooseMedia的具体错误
    handleChooseMediaError(error) {
      let errorMessage = '选择图片失败';

      if (error && error.errMsg) {
        const errMsg = error.errMsg.toLowerCase();

        if (errMsg.includes('cancel')) {
          // 用户取消选择
          errorMessage = '您已取消选择图片';
          this.showAlert(errorMessage, 'info');
          return;
        } else if (errMsg.includes('permission')) {
          // 权限被拒绝
          errorMessage = '请授权访问相册权限';
        } else if (errMsg.includes('system')) {
          // 系统错误
          errorMessage = '系统错误，请稍后重试';
        } else if (errMsg.includes('network')) {
          // 网络错误
          errorMessage = '网络错误，请检查网络连接';
        } else if (errMsg.includes('file')) {
          // 文件错误
          errorMessage = '文件格式不支持或文件损坏';
        } else if (errMsg.includes('limit')) {
          // 超出限制
          errorMessage = '选择的图片数量超出限制';
        } else {
          // 其他未知错误，显示原始错误信息
          errorMessage = `选择图片失败: ${error.errMsg}`;
        }
      } else {
        // 没有错误信息的情况
        errorMessage = '选择图片失败，请重试';
      }

      this.showAlert(errorMessage);
    },

    showAlert(message) {
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 1500
      });
    }
  }
});