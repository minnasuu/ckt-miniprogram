// pages/tutorial/crochet-basic/index.js
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
        key: "1",
      title:"图解版",
      image: 'https://suminhan.cn/ckt/images/knit/bzchua.jpg',
      level:'⭐️⭐️⭐️⭐️⭐️',
      link: '/pages/tutorial/knit/knit-detail/index?index=0'
    },
    {
      key: "2",
      title:"实物图片版",
      image:'https://suminhan.cn/ckt/images/knit/qzhen1.jpg',
      level:'⭐️⭐️⭐️⭐️',
      link: '/pages/tutorial/knit/knit-detail/index?index=1'
    },
    {
      key: "3",
      title:"视频版",
      image:'https://suminhan.cn/ckt/images/knit/qzhen1.jpg',
      level:'⭐️⭐️⭐️',
      link: '/pages/tutorial/knit/knit-detail/index?index=1'
    }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})