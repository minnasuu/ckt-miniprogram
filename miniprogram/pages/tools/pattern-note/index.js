Page({
  data: {
    statusBarHeight: 0,
    initData:[
        {id:'1',title:'第 1 部分',values:'',nums: '',edited:false},
    ],
    data:[],
    cur: '1',
    curItem: {},
    titleInputId: '-1',
    lineNumbers: [],
    curLine: -1,
    showStich:false,
    stiches: [],
    saving:false,
    autoSave:false,
    showPreviewDialog:false,
    saveLoading:false
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
    if(this.data.data.length === 0){
      this.setData({
        data: this.data.initData
      });
      this.updateCurItem();
      this.calculateLineNumbers();
      this.caculateStiches();
    }
  },

  // 更新 curItem 的方法
  updateCurItem() {
    const { data, cur } = this.data;
    const newCurItem = data.find(item => item.id === cur) || {};
    this.setData({
      curItem: newCurItem
    }, () => {
      this.calculateLineNumbers();
    });
  },

  calculateLineNumbers() {
    const { curItem } = this.data;
    if (curItem) {
      const lineNumbers = curItem.values.split('\n').map((_, index) => `R${index + 1}: `);
      this.setData({
        lineNumbers: lineNumbers
      });
    }
  },
  caculateStiches(){
    const data = this.data.data;
    const newData = data.map(i=>{
      Object.assign(i,{
        nums: i.values.split('\n').map((i) => i.values.split('\n').map(j =>calculateExpression(j)).join('\n'))
      })
    })
    this.setData({
      data: newData
    })
  },

  // 当 cur 发生变化时调用
  setCur(newCur) {
    this.setData({
      cur: newCur
    }, () => {
      this.updateCurItem();
    });
  },

  // 当 data 发生变化时调用
  updateData(newData) {
    this.setData({
      data: newData
    }, () => {
      this.updateCurItem();
    });
  },

  // 当 curItem 或者其 values 发生变化时，需要重新计算
  handleInputChange(e) {
    const cur = this.data.cur;
    const val = e.detail.value;
    const newData = this.data.data.map((i) => i.id===cur ? Object.assign(i,{values: val}):i);
    this.setData({
      data: newData,
      curItem: newData.find(i => i.id === cur),
    })
    this.calculateLineNumbers();
    this.caculateStiches();
  },
  lastTapTime: 0, // 记录上次点击的时间

  handleTitleTap(e) {
    const id = e.currentTarget.dataset.id;
    const now = Date.now();
    const timeDiff = now - this.lastTapTime;
    this.lastTapTime = now;

    if (timeDiff < 300) {
      // 双击事件处理逻辑
      this.handleTitleDoubleTap(id);
    } else {
      // 单击事件处理逻辑
      this.setData({
        cur: id
      }, () => {
        this.updateCurItem();
      });
    }
  },

  handleTitleDoubleTap(id) {
    this.setData({
      titleInputId: id
    });
  },
  handleTitleBlur(){
    this.setData({
      titleInputId: '-1'
    });
  },
  handleTItleChange(e){
    const val = e.detail.value;
    const data = this.data.data;
    const titleInputId = this.data.titleInputId;
    if(!val||data.filter(i=>i.id===titleInputId)[0].title === val)return
    const newData = data?.map(i=>i.id===titleInputId ? Object.assign(i,{title: val}) : i);
   this.setData({
    data: newData
   })
  },
  handleAddPart(){
    const data = this.data.data;
    const newData = [...data,{id:`${data?.length+1}`,title:`第 ${data?.length+1} 部分`,values: '',nums:'',edited:false}];
    this.setData({
      data: newData,
      cur: `${data?.length+1}`,
    })
    this.updateCurItem()
  },
  handleShowStich(){
    this.setData({
      showStich: !this.data.showStich
    })
  },
  calculateExpression(input) {
    // 定义字母对应的值
    const valueMap = {
        'x': 1, 'X': 1,
        'v': 2, 'V': 2,
        'w': 3, 'W': 3,
        'a': 1, 'A': 1,
        'ch': 1, 'CH': 1
    };

    // 解析单个表达式（数字+字母或字母组合）
    function parseSingle(expr) {
        // 如果是数字，直接返回
        if (/^\d+$/.test(expr)) {
            return parseInt(expr, 10);
        }

        // 如果是字母或字母组合，返回对应的值
        if (valueMap[expr]) {
            return valueMap[expr];
        }

        // 如果是其他字母，返回 1
        if (/^[a-zA-Z]+$/.test(expr)) {
            return 1;
        }

        // 如果是数字+字母的组合
        const match = expr.match(/^(\d+)([a-zA-Z]+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            const letter = match[2];
            const value = valueMap[letter] || 1; // 如果字母不在映射中，默认为 1
            return num * value;
        }

        // 如果无法解析，返回 0
        return 0;
    }

    // 解析整个表达式
    function parse(expr) {
        // 去掉空格
        expr = expr.replace(/\s+/g, '');

        // 如果表达式是括号内的内容，递归解析
        if (expr.startsWith('(') && expr.endsWith(')')) {
            return parse(expr.slice(1, -1));
        }

        // 如果表达式包含括号，先解析括号内的内容
        const bracketMatch = expr.match(/\(([^()]+)\)/);
        if (bracketMatch) {
            const insideBracket = bracketMatch[1];
            const outsideBefore = expr.slice(0, bracketMatch.index);
            const outsideAfter = expr.slice(bracketMatch.index + bracketMatch[0].length);
            return parse(outsideBefore + parse(insideBracket) + outsideAfter);
        }

        // 如果表达式是多个部分的组合（如 "2X3V"），按顺序解析并相加
        const parts = expr.split(/(\d+[a-zA-Z]+|[a-zA-Z]+)/).filter(Boolean);
        return parts.reduce((sum, part) => sum + parseSingle(part), 0);
    }

    // 将输入字符串按空格分割成多个表达式，分别解析后相加
    const expressions = input.split(/\s+/);
    return expressions?.reduce((sum, expr) => sum + parse(expr), 0);
}
});