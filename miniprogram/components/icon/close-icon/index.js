// components/icon/close-icon/index.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    top:{
      type: Number,
      value: 0,
    },
    right:{
      type: Number,
      value: 0,
    },
    color:{
      type: String,
      value: 'var(--ckt-gray-9)',
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onCloseTap(){
      this.triggerEvent('close')
    }
  }
})