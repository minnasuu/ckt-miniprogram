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
      link: '/pages/tutorial/knit/knit-detail/index?id=base_character',
      disabled: true
    },
    {
      key: "2",
      title:"实物图片版",
      image:'https://suminhan.cn/ckt/images/knit/zsdxian.jpg',
      level:'⭐️⭐️⭐️⭐️',
      link: '/pages/tutorial/knit/knit-detail/index?id=base_picture'
    },
    {
      key: "3",
      title:"视频版",
      image:'https://suminhan.cn/ckt/images/knit/qzhen1.jpg',
      level:'⭐️⭐️⭐️',
      link: '/pages/tutorial/knit/knit-detail/index?id=base_video',
      disabled: true
    }
    ],
    materialList: [
      {
        key: "1",
        title: "图示符号",
        image: 'https://suminhan.cn/ckt/images/crochet/zmfhao.jpg',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-symbol-table/index?id=knit_symbol',
        disabled: true
      },
      {
        key: "2",
        title: "文字符号",
        image: 'https://suminhan.cn/ckt/images/crochet/zmfhao.jpg',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-symbol-table/index?id=knit_text_symbol',
        disabled: true
      }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})