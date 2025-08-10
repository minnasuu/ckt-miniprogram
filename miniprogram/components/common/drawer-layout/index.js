// components/common/drawer-layout/index.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    title:{
      type: String,
      value:'抽屉标题'
    },
    showCancelBtn:{
      type:Boolean,
      value:true
    },
    showSubmitBtn:{
      type:Boolean,
      value:true
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
    onCancel(){
      this.triggerEvent('cancel')
    },
    onSubmit(){
      this.triggerEvent('submit')
    },
    onClose(){
      this.triggerEvent('close')
    }
  }
})