// components/common/color-picker-drawer/index.js
const ColorFIll_Color_Data = [
  {
    "type": "international-10-classic-colors",
    "name": "国际10大经典色彩",
    "colors": [
      {
        "name": "克莱茵蓝",
        "value": "#002FA7"
      },
      {
        "name": "爱马仕橙",
        "value": "#D75F28"
      },
      {
        "name": "中国红",
        "value": "#D12C25"
      },
      {
        "name": "提香红",
        "value": "#FF6347"
      },
      {
        "name": "申布伦黄",
        "value": "#F7E14D"
      },
      {
        "name": "普鲁士蓝",
        "value": "#0D3869"
      },
      {
        "name": "波尔多红",
        "value": "#5E0004"
      },
      {
        "name": "凡戴克棕",
        "value": "#432913"
      },
      {
        "name": "马尔斯绿",
        "value": "#39855E"
      },
      {
        "name": "蒂芙尼蓝",
        "value": "#81D8CF"
      },
    ]
  },
  {
    "type": "chinese-painting-colors",
    "name": "中国国画色彩",
    "colors": [
      {
        "name": "银朱",
        "value": "#BF242A"
      },
      {
        "name": "胭脂",
        "value": "#9D2933"
      },
      {
        "name": "朱砂",
        "value": "#FF461F"
      },
      {
        "name": "朱膘",
        "value": "#F36838"
      },
      {
        "name": "赭石",
        "value": "#845A33"
      },
      {
        "name": "石青",
        "value": "#1685A9"
      },
      {
        "name": "石绿",
        "value": "#16A851"
      },
      {
        "name": "白粉",
        "value": "#FFF2DF"
      },
      {
        "name": "花青",
        "value": "#003472"
      },
      {
        "name": "藤黄",
        "value": "#FFB61E"
      },
      {
        "name": "雌黄",
        "value": "#FFC64B"
      },
      {
        "name": "洋红",
        "value": "#FF4777"
      },
      {
        "name": "墨色",
        "value": "#50616D"
      },
    ]
  },
  {
    "type": "gift-2mm",
    "name": "BigGift 2mm 空心棉",
    "colors": [
      {
        "name": "红色",
        "value": "#AB3C38"
      },
      {
        "name": "深蓝色",
        "value": "#47596E"
      },
      {
        "name": "黑色",
        "value": "#1A1C19"
      },
      {
        "name": "粉红色",
        "value": "#E6A3C5"
      },
      {
        "name": "天蓝色",
        "value": "#95C8DE"
      },
      {
        "name": "脏粉色",
        "value": "#E1CED1"
      },
      {
        "name": "深灰色",
        "value": "#73777A"
      },
      {
        "name": "浅灰色",
        "value": "#C3C6C7"
      },
      {
        "name": "奶茶色",
        "value": "#C4BDB2"
      },
      {
        "name": "驼色",
        "value": "#D4C8B6"
      },
      {
        "name": "紫红色",
        "value": "#763B3F"
      },
      {
        "name": "绯红",
        "value": "#8E5543"
      },
      {
        "name": "香芋色",
        "value": "#A18A9D"
      },
      {
        "name": "米白色",
        "value": "#ECEBE0"
      },
      {
        "name": "藏青色",
        "value": "#46505C"
      },
      {
        "name": "深棕色",
        "value": "#5D5249"
      },
      {
        "name": "棕色",
        "value": "#6E513A"
      },
      {
        "name": "姜黄色",
        "value": "#BAAB80"
      },
      {
        "name": "墨绿色",
        "value": "#4C655D"
      },
      {
        "name": "橘黄色",
        "value": "#D77C55"
      },
      {
        "name": "圣诞绿",
        "value": "#5C9272"
      },
      {
        "name": "淡绿色",
        "value": "#AA9F7E"
      },
      {
        "name": "奶黄色",
        "value": "#F5F1D4"
      },
      {
        "name": "荧光绿",
        "value": "#E0EB90"
      },
      {
        "name": "浅粉绿",
        "value": "#CCE3CA"
      },
      {
        "name": "嫩芽绿",
        "value": "#84CE7A"
      },
      {
        "name": "宝蓝色",
        "value": "#3C5CA4"
      },
      {
        "name": "tifuni蓝",
        "value": "#BBDCDF"
      },
      {
        "name": "浅粉色",
        "value": "#DCC4D9"
      },
      {
        "name": "浅紫色",
        "value": "#A69CC5"
      },
      {
        "name": "玫红色",
        "value": "#BF607C"
      },
      {
        "name": "桃红色",
        "value": "#DEB3B0"
      },
      {
        "name": "祖母绿",
        "value": "#4FA0AD"
      },
      {
        "name": "军绿色",
        "value": "#627053"
      },
      {
        "name": "水蓝色",
        "value": "#AFC4DB"
      },
      {
        "name": "藏红花",
        "value": "#8D3C63"
      },
      {
        "name": "柠檬黄",
        "value": "#ECD968"
      }
    ]
  },
  {
    "type": "gift-1mm",
    "name": "BigGift 1mm 空心棉",
    "colors": [
      {
        "name": "米白色",
        "value": "#FFF3E7"
      },
      {
        "name": "驼色",
        "value": "#DEC7B5"
      },
      {
        "name": "焦糖色",
        "value": "#9D5F45"
      },
      {
        "name": "紫色",
        "value": "#5C366C"
      },
      {
        "name": "淡紫色",
        "value": "#A395B9"
      },
      {
        "name": "宝蓝色",
        "value": "#304082"
      },
      {
        "name": "明黄色",
        "value": "#DDA443"
      },
      {
        "name": "棕色",
        "value": "#795237"
      },
      {
        "name": "牛仔蓝",
        "value": "#38425D"
      },
      {
        "name": "红色",
        "value": "#AF3130"
      },
      {
        "name": "圣诞绿",
        "value": "#4A9167"
      },
      {
        "name": "粉红色",
        "value": "#DDB4BD"
      },
      {
        "name": "桔红色",
        "value": "#CB4831"
      },
      {
        "name": "淡绿色",
        "value": "#BAA663"
      },
      {
        "name": "淡蓝色",
        "value": "#97BBD7"
      },
      {
        "name": "浅灰色",
        "value": "#A3A1A3"
      },
      {
        "name": "黑色",
        "value": "#232323"
      },
      {
        "name": "深灰色",
        "value": "#4C4C4C"
      },
      {
        "name": "军绿色",
        "value": "#737854"
      },
      {
        "name": "荧光绿",
        "value": "#C9DB7A"
      },
      {
        "name": "玫红色",
        "value": "#C84B6B"
      },
      {
        "name": "森林绿",
        "value": "#2E5F46"
      },
      {
        "name": "湖水绿",
        "value": "#C0CBC2"
      }
    ]
  },
  {
    "type": "萌4",
    "name": "萌4",
    "colors": [
      {
        "name": "01纯白",
        "value": "#F3F2F0"
      },
      {
        "name": "02奶白",
        "value": "#F5F6F1"
      },
      {
        "name": "03肤色",
        "value": "#F3EADB"
      },
      {
        "name": "04浅肉粉",
        "value": "#FAE9E1"
      },
      {
        "name": "05粉红",
        "value": "#FED5DD"
      },
      {
        "name": "06深粉",
        "value": "#FBA3C9"
      },
      {
        "name": "07胭脂红",
        "value": "#F67B97"
      },
      {
        "name": "08玫红",
        "value": "#FF6CBC"
      },
      {
        "name": "09大红",
        "value": "#C52D2C"
      },
      {
        "name": "10浅黄",
        "value": "#F0E4BC"
      },
      {
        "name": "11金黄",
        "value": "#FCE281"
      },
      {
        "name": "12亮黄",
        "value": "#F2E15D"
      },
      {
        "name": "13橘黄",
        "value": "#F6B453"
      },
      {
        "name": "14橘红",
        "value": "#DF5F3C"
      },
      {
        "name": "15粉紫",
        "value": "#D5B6DC"
      },
      {
        "name": "16紫色",
        "value": "#D08BDE"
      },
      {
        "name": "17若水",
        "value": "#E2FAE6"
      },
      {
        "name": "18天蓝",
        "value": "#98CAFA"
      },
      {
        "name": "19深蓝",
        "value": "#83A0E7"
      },
      {
        "name": "20宝蓝",
        "value": "#3850B0"
      },
      {
        "name": "21藏青",
        "value": "#272954"
      },
      {
        "name": "22湖绿",
        "value": "#AEE5E2"
      },
      {
        "name": "23祖母绿",
        "value": "#59A3BA"
      },
      {
        "name": "24嫩绿",
        "value": "#DCFAD3"
      },
      {
        "name": "25芽绿",
        "value": "#98BC44"
      },
      {
        "name": "26军绿",
        "value": "#415B2E"
      },
      {
        "name": "27翠绿",
        "value": "#048C62"
      },
      {
        "name": "28米色",
        "value": "#EAE1D0"
      },
      {
        "name": "29奶茶",
        "value": "#F0C892"
      },
      {
        "name": "30黄棕",
        "value": "#D5A268"
      },
      {
        "name": "31浅咖",
        "value": "#9B734C"
      },
      {
        "name": "32深咖",
        "value": "#6D473C"
      },
      {
        "name": "33灰色",
        "value": "#A4A4A4"
      },
      {
        "name": "34黑色",
        "value": "#000000"
      },
      {
        "name": "35麦香",
        "value": "#E8CEA2"
      },
      {
        "name": "36浅灰",
        "value": "#E4E4E4"
      },
      {
        "name": "37肉色",
        "value": "#FAB6AA"
      },
      {
        "name": "38烟紫",
        "value": "#D5A7BE"
      },
      {
        "name": "39桔色",
        "value": "#FD780F"
      },
      {
        "name": "40黄绿",
        "value": "#DAD46A"
      },
      {
        "name": "41间青",
        "value": "#81C7C7"
      },
      {
        "name": "42牛仔蓝",
        "value": "#6783A1"
      },
      {
        "name": "43樱花粉",
        "value": "#F2DDD5"
      },
      {
        "name": "44珊瑚粉",
        "value": "#EEC3C4"
      },
      {
        "name": "45群蓝",
        "value": "#70B8BE"
      },
      {
        "name": "46靛蓝",
        "value": "#196182"
      },
      {
        "name": "47薄荷",
        "value": "#BDCE9E"
      },
      {
        "name": "48秋黄",
        "value": "#D3B358"
      },
      {
        "name": "49深紫",
        "value": "#6A447A"
      },
      {
        "name": "50深红",
        "value": "#7F2735"
      },
      {
        "name": "51乳白",
        "value": "#F8F8F1"
      },
      {
        "name": "52桃红",
        "value": "#F49CB7"
      },
      {
        "name": "53紫红",
        "value": "#E4AFCF"
      },
      {
        "name": "54森林绿",
        "value": "#02937E"
      },
      {
        "name": "55浅军绿",
        "value": "#7F9351"
      },
      {
        "name": "56淡雪青",
        "value": "#C5B7D3"
      },
      {
        "name": "57雪青",
        "value": "#A58CBB"
      },
      {
        "name": "58湖蓝",
        "value": "#04A4C5"
      },
      {
        "name": "59仙踪绿",
        "value": "#1F6F5F"
      },
      {
        "name": "60浅棕",
        "value": "#995920"
      },
      {
        "name": "61棕色",
        "value": "#7D5121"
      },
      {
        "name": "62红棕",
        "value": "#944928"
      },
      {
        "name": "63小鸡黄",
        "value": "#F5C73D"
      },
      {
        "name": "64浅橘",
        "value": "#EABE8D"
      },
      {
        "name": "65橘粉",
        "value": "#EEA48F"
      },
      {
        "name": "66酒红",
        "value": "#99282D"
      },
      {
        "name": "67浅罗马红",
        "value": "#B15249"
      }
    ]
  },
  {
    "type": "lifeyarn 羽",
    "name": "lifeyarn 羽",
    "colors": [
      {
        "name": "本白",
        "value": "#EDEEE9"
      },
      {
        "name": "霜灰",
        "value": "#C9CACC"
      },
      {
        "name": "羊驼皮",
        "value": "#DFC6A7"
      },
      {
        "name": "浅蓝",
        "value": "#D5E5E8"
      },
      {
        "name": "珊瑚砂",
        "value": "#E4C0B4"
      },
      {
        "name": "香蕉色",
        "value": "#F7BE3F"
      },
      {
        "name": "森巴红",
        "value": "#A01D35"
      },
      {
        "name": "爬山虎",
        "value": "#9DAB70"
      },
      {
        "name": "雨林绿",
        "value": "#428271"
      },
      {
        "name": "森林",
        "value": "#436B50"
      },
      {
        "name": "公正绿",
        "value": "#A6C197"
      },
      {
        "name": "阳光橙",
        "value": "#E9884A"
      },
      {
        "name": "嫩绿",
        "value": "#D4DAC2"
      },
      {
        "name": "矿物灰",
        "value": "#A7B1B0"
      },
      {
        "name": "薰衣草",
        "value": "#A592BC"
      },
      {
        "name": "北欧蓝",
        "value": "#78B8CD"
      },
      {
        "name": "深度蓝",
        "value": "#283266"
      },
      {
        "name": "酒红",
        "value": "#6A3945"
      },
      {
        "name": "蘑菇灰",
        "value": "#A49B8F"
      },
      {
        "name": "咖啡棕",
        "value": "#524536"
      },
      {
        "name": "海草绿",
        "value": "#90CE57"
      },
      {
        "name": "马里蓝",
        "value": "#7A9CE0"
      },
      {
        "name": "春桃粉",
        "value": "#EDDFDB"
      },
      {
        "name": "香草奶昔",
        "value": "#F2EFDB"
      },
      {
        "name": "嫩黄",
        "value": "#F2E896"
      },
      {
        "name": "贝壳珊瑚",
        "value": "#DFA58E"
      },
      {
        "name": "尼罗河蓝",
        "value": "#96C9C8"
      },
      {
        "name": "钴蓝",
        "value": "#224AA1"
      },
      {
        "name": "紫罗兰",
        "value": "#453B6F"
      },
      {
        "name": "石蕊红",
        "value": "#D6C0C5"
      },
      {
        "name": "草莓冰",
        "value": "#E3A1AA"
      },
      {
        "name": "紫酱",
        "value": "#895E69"
      },
      {
        "name": "魆黑",
        "value": "#28272C"
      },
      {
        "name": "芝士",
        "value": "#E6E3DC"
      }
    ]
  },
  {
    "type": "superwash merino",
    "name": "superwash merino",
    "colors": [
      {
        "name": "1 ecru",
        "value": "#FBF6F4"
      },
      {
        "name": "2 lime",
        "value": "#D1CB6B"
      },
      {
        "name": "3 olive",
        "value": "#6F784B"
      },
      {
        "name": "4 cobalt blue",
        "value": "#61A3D2"
      },
      {
        "name": "5 indigo blue",
        "value": "#3E4B82"
      },
      {
        "name": "6 red",
        "value": "#AD251F"
      },
      {
        "name": "7 chocolate",
        "value": "#59342E"
      },
      {
        "name": "8 light grey",
        "value": "#C0C0C3"
      }
    ]
  },
]
Component({
  properties: {
    // 控制是否显示抽屉
    show: {
      type: Boolean,
      value: false
    },
    // 透传color-picker的属性
    value: {
      type: String,
      value: '#ffcbcb'
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 当前选择的颜色
    currentColor: '#ffcbcb',
    presetColors: [],
  },

  lifetimes: {
    attached() {
      this.setData({
        presetColors: ColorFIll_Color_Data.flatMap(item => item.colors.map(color => color.value)),
        currentColor: this.properties.value
      });
    }
  },

  observers: {
    'value': function(newValue) {
      this.setData({
        currentColor: newValue
      });
    }
  },

  methods: {
    // 阻止事件冒泡
    preventBubble() {
      return false;
    },

    // 关闭抽屉
    onClose() {
      this.triggerEvent('close');
    },

    // 取消选择
    onCancel() {
      this.triggerEvent('cancel');
    },

    // 确认选择
    onConfirm() {
      this.triggerEvent('confirm', { color: this.data.currentColor });
    },

    // 颜色变化事件（透传给父组件）
    onColorChange(e) {
      const { color } = e.detail;
      this.setData({
        currentColor: color
      });
      this.triggerEvent('change', { color });
    },

    // 预设颜色点击事件
    onPresetColorClick(e) {
      const { color } = e.currentTarget.dataset;
      if (color) {
        // 更新当前选择的颜色
        this.setData({
          currentColor: color
        });

        // 触发颜色变化事件，通知父组件进行实时预览
        this.triggerEvent('change', { color });

        // 直接确认选择，让用户点击预设颜色后立即应用
        this.triggerEvent('confirm', { color });
      }
    },
  }
});
