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
        title: "插图版",
        image: 'https://suminhan.cn/ckt/images/crochet/szhen4.jpg',
        level: '⭐️⭐️⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-base/index?id=base_character'
      },
      {
        key: "2",
        title: "实物图片版",
        image: 'https://suminhan.cn/ckt/images/knit/szhen2-1.jpg',
        level: '⭐️⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-base/index?id=base_picture',
        disabled: true
      },
      {
        key: "3",
        title: "视频版",
        image: 'https://suminhan.cn/ckt/images/knit/ysdxian.jpg',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-base/index?id=base_video',
        disabled: true
      },
    ],
    testList: [
      {
        key: "3",
        title: "蝴蝶结挎包",
        image: 'https://suminhan.cn/ckt/images/crochet/zmfhao.jpg',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-base/index?id=test_1',
        disabled: true
      },
    ],
    proList: [
      {
        key: "2",
        title: "实物图片版",
        image: 'https://suminhan.cn/ckt/images/crochet/szhen4.jpg',
        level: '⭐️⭐️⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-base/index?id=pro_picture',
        disabled: true
      },
    ],
    materialList: [
      {
        key: "1",
        title: "图示符号",
        image: 'https://suminhan.cn/ckt/images/crochet/zmfhao.jpg',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-symbol-table/index?id=material_symbol'
      },
      {
        key: "2",
        title: "文字符号",
        image: 'https://suminhan.cn/ckt/images/crochet/zmfhao.jpg',
        level: '⭐️⭐️⭐️',
        link: '/pages/tutorial/crochet/crochet-symbol-table/index?id=material_text_symbol'
      }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})