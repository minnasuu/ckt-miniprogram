// components/icon/close-icon/index.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    color: {
      type:String,
      value: 'var(--ckt-gray-11)'
    },
    rotate:{
        type:Number,
        value:0
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
    onArrowTap(){
      this.triggerEvent('arrow')
    }
  }
})