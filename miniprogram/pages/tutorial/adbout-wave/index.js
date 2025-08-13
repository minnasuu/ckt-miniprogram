// pages/tutorial/adbout-wave/index.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    list: [
      {
        key: 'xc',
        title: '线材种类&特性',
        image: '/assets/images/tutorial/about-wave/xc.png',
        content: '适用于钩针编织或棒针编织，常见纱线种类及其特点整理。',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/adbout-wave/xc/index'
      },
      {
        key: 'qc',
        title: '编织工具&配材',
        image: '/assets/images/tutorial/about-wave/qc.png',
        content: '钩针或棒针编织时用到的常见工具及辅助材料。',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/adbout-wave/qc/index'
      }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})