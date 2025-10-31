// components/icon/input/index.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    color: {
      type: String,
      value: 'var(--ckt-gray-12)'
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
    onInputTap() {
      this.triggerEvent('input')
    }
  }
})