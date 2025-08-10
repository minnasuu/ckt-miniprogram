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
      value: '320rpx'
    },
    placeholderText: {
      type: String,
      value: '点击选择图片'
    },
    multiple:{
      type:Boolean,
      value: false,
    }
  },
  
  data: {
    
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
        
        // 获取图片信息
        const imageInfo = await wx.getImageInfo({
          src: tempFilePath
        });
        const fileInfo = await wx.getFileInfo({
          filePath: tempFilePath
        });
        
        // 触发事件，将图片信息传递给父组件
        this.triggerEvent('imageSelected', {
          imageUrl: tempFilePath,
          width: imageInfo.width,
          height: imageInfo.height,
          size: fileInfo.size
        });
        }else{
          const resData = [];
          res.tempFiles.map(i => {
            const tempFilePath = i.tempFilePath;
            const imageInfo = wx.getImageInfo({
              src: tempFilePath
            });
            const fileInfo = wx.getFileInfo({
              filePath: tempFilePath
            });
            resData.push({
              imageUrl: tempFilePath,
              width: imageInfo.width,
              height: imageInfo.height,
              size: fileInfo.size
            })
          })
          this.triggerEvent('imageSelected',{resData})
        }
      } catch (error) {
        console.log(error);
        
        wx.showToast({
          title: '图片上传失败',
          icon: 'error'
        });
      }
    }
  }
});