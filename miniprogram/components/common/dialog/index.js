Component({
  properties: {
    // 是否显示对话框
    visible: {
      type: Boolean,
      value: false
    },
    // 对话框标题
    title: {
      type: String,
      value: '提示'
    },
    // 对话框内容
    content: {
      type: String,
      value: ''
    },
    // 取消按钮文字
    cancelText: {
      type: String,
      value: '取消'
    },
    // 确定按钮文字
    confirmText: {
      type: String,
      value: '确定'
    },
    // 是否显示取消按钮
    showCancel: {
      type: Boolean,
      value: true
    },
    // 是否显示确定按钮
    showConfirm: {
      type: Boolean,
      value: true
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      value: true
    },
    // 是否点击遮罩层关闭
    maskClosable: {
      type: Boolean,
      value: true
    }
  },

  data: {
    
  },

  methods: {
    // 关闭对话框
    onClose() {
      this.triggerEvent('close');
    },

    // 取消按钮点击
    onCancel() {
      this.triggerEvent('cancel');
      this.onClose();
    },

    // 确定按钮点击
    onConfirm() {
      this.triggerEvent('confirm');
      this.onClose();
    },

    // 点击遮罩层
    onMaskTap() {
      if (this.data.maskClosable) {
        this.onClose();
      }
    },

    // 阻止事件冒泡
    preventTap() {
      // 空函数，阻止点击事件冒泡到遮罩层
    }
  }
})
