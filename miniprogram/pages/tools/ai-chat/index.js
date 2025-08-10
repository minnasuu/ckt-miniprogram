// pages/tools/ai-ck-style/index.js
const towxml = require('../../../towxml/index'); 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 88,
    keyboardHeight: 0,
    author:null,
    inputValue: '',
    messages: [],
    messageId: 0,
    // 加载中
    loading: false,
    // 思考中
    thinking: false,
    scrollToMessage: '',
    showAlert: false,
    alertMessage: '',
    messagesWxml:[],
    scrollTop: 0,
    isAutoSCroll:false,
    dragStartScrollTop:0,
    lastScrollTop: 0,
    deepThink:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });

    // 检查用户是否登录，获取用户头像
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        author: userInfo
      });
    }

    const hour = new Date().getHours();
    let txt = '你好'
    if (hour >= 5 && hour < 12) {
      txt = '早上好';
    } else if (hour >= 12 && hour < 18) {
      txt = '下午好';
    } else {
      txt = '晚上好';
    }   
    
    // 添加欢迎消息
    const username = userInfo.username
    this.addMessage({
      role: 'ai',
      content: `${txt}, ${username||''}${username?'。':''}有什么想要问我的吗？`.trim(),
      thinkContent:'',
    });
    // this.loadMockData()
    this.scrollToBottom()
  },
  scrollToBottom(){
    const query = wx.createSelectorQuery();
    query.select('#dialogue-scroll-inner').boundingClientRect();
    query.exec((res) => {
      query.select('#dialogue-scroll-container').boundingClientRect();
      query.exec((res) => {
        const innerHeight = res[0].height;
        const containerHeight = res[1].height;        
        const scrollTop = innerHeight-containerHeight;
        this.setData({
          scrollTop
        });
      })
    });
  },
  updateMessagesWxml(){
    // 只处理需要转换的消息
    const messagesWxml = this.data.messages.map(msg => {
      // 如果content和thinkContent都已经是对象类型，说明已经转换过，直接返回
      if (msg.content && typeof msg.content === 'object' && 
          msg.thinkContent && typeof msg.thinkContent === 'object') {
        return msg;
      }

      const convertedMsg = { ...msg };

      // 转换content
      if (typeof msg.content === 'string') {
        convertedMsg.content = towxml(msg.content || '', 'markdown', {});
      }

      // 转换thinkContent
      if (typeof msg.thinkContent === 'string') {
        convertedMsg.thinkContent = towxml(msg.thinkContent || '', 'markdown', {});
      }

      return convertedMsg;
    });

    this.setData({ messagesWxml });
  },

  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },
  
  onKeyboardHeightChange(e) {
    this.setData({
      keyboardHeight: e.detail.height
    });
  },
  
  // 添加消息到聊天列表
  addMessage(message) {
    const messageId = this.data.messageId + 1;
    const newMessage = {
      ...message,
      id: messageId
    };
    
    const messages = [...this.data.messages,newMessage];
    
    this.setData({
      messages,
      messageId,
      scrollToMessage: `message-${messageId}`
    },()=>{
      wx.nextTick(()=>{
        this.updateMessagesWxml();
        this.scrollToBottom();
      })
    });
    return messageId;
  },
  
  // 发送消息
  sendMessage() {
    if (!this.data.inputValue.trim()) return;
    if(this.data.loading||this.data.thinking)return;
    
    const userMessage = {
      role: 'user',
      content: this.data.inputValue.trim(),
      thinkContent:''
    };
    
    // 添加用户消息
    this.addMessage(userMessage);
    
    // 清空输入框
    this.setData({
      inputValue: '',
      thinking:true
    });
    
    // 添加AI正在生成的消息
    const aiMessageId = this.addMessage({
      role: 'ai',
      content: '',
      thinkContent: ''
    });
    
    // 调用GPT生图API
    this.generateImageWithGPT(userMessage.content, aiMessageId);
  },
  
  // 使用GPT生成图片
  async generateImageWithGPT(prompt,aiMessageId) {
    const model = wx.cloud.extend.AI.createModel("deepseek");
    // 将系统提示词和用户输入，传入大模型
    const res = await model.streamText({
      data: {
        model: this.data.deepThink?"deepseek-r1":"deepseek-v3", // 指定具体的模型
        messages: [
          { role: "system", content: "你是一个AI助手，如果用户的提问和手工编织相关，请根据用户的问题给出回答。如果用户的提问和手工编织无关，则告诉用户只能回答和手工编织相关的问题。" },
          { role: "user", content: prompt },
        ],
      },
    });
    for await (let event of res.eventStream) {
      if (event.data === '[DONE]') {
        break;
      }
      const data = JSON.parse(event.data);
      const think = (data?.choices?.[0]?.delta)?.reasoning_content;
      if (think) {
        this.setData({
          messages: this.data.messages.map(msg => {
            if (msg.id === aiMessageId) {
              return {
               ...msg,
                thinkContent: (msg.thinkContent + think).trim(),
              };
            }
            return msg;
          })
        },()=>{
          wx.nextTick(() => {
           this.updateMessagesWxml();
           this.scrollToBottom()
          });
        });
      }else{
        this.setData({
          thinking:false,
          loading:true
        });
      }
      const text = data?.choices?.[0]?.delta?.content;
      this.setData({
        messages: this.data.messages.map(msg => {
          if (msg.id === aiMessageId) {
            return {
             ...msg,
              content: (msg.content + text).trim(),
            };
          }
          return msg;
        })
      },()=>{
        wx.nextTick(() => {
         this.updateMessagesWxml()
         this.scrollToBottom()
        });
      });
      this.setData({
        loading: false,
      });
    }
  },
  onDragStart(e) {
    // 记录开始拖拽时的滚动位置
    this.setData({
      dragStartScrollTop: this.data.scrollTop,
      lastScrollTop: this.data.scrollTop
    });
  },
  onDragging(e) {
    const currentScrollTop = e.detail.scrollTop;
    const lastScrollTop = this.data.lastScrollTop;
    
    // 判断滚动方向
    if (currentScrollTop < lastScrollTop) {
      // 向上滚动，关闭自动滚动
      this.setData({
        isAutoSCroll: false
      });
    }
    
    // 更新最后的滚动位置
    this.setData({
      lastScrollTop: currentScrollTop
    });
  },
  onDragEnd(e) {
    if(this.data.isLoadingHistory)return;
    const query = wx.createSelectorQuery();
    query.select('#dialogue-scroll-inner').boundingClientRect();
    query.select('#dialogue-scroll-container').boundingClientRect();

    query.exec((res) => {
      if(this.data.lastScrollTop===0)return
      if (res[0] && res[1]) {
        const innerHeight = res[0].height;
        const containerHeight = res[1].height;
        const currentScrollTop = e.detail.scrollTop;
       if(innerHeight>containerHeight){
         // 计算最大可滚动距离
         const maxScrollTop = innerHeight - containerHeight;
         
         // 判断是否滚动到底部（允许一定的误差）
         const isAtBottom = Math.abs(maxScrollTop - currentScrollTop) <= 10;
         
         if (isAtBottom) {
           // 如果滚动到底部，开启自动滚动
           this.setData({
             isAutoSCroll: true
           });
         }
       }
      }
    });
  },
  onDeepThinkChange(){
    this.setData({
      deepThink: !this.data.deepThink
    });
  },
  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },
  
  // 显示提示消息
  showMessage(msg) {
    this.setData({
      showAlert: true,
      alertMessage: msg
    });
    
    // 2秒后自动隐藏
    setTimeout(() => {
      this.setData({
        showAlert: false,
        alertMessage: ''
      });
    }, 2000);
  },
  loadMockData(){
    wx.nextTick(()=>{
      this.addMessage({
        role: 'user',
        content:'列举三个头脑风暴的方法',
        thinkContent:''
      })
      wx.nextTick(()=>{
        this.addMessage({
          role: 'ai',
          content:`好的，这里有三种常用且有效的头脑风暴方法，各有侧重：

自由联想/传统头脑风暴：

核心思想： 鼓励参与者不加评判、天马行空地抛出任何与主题相关的想法，无论多么疯狂、离谱或不切实际。目标是追求想法的数量而非质量。

如何操作：

明确清晰地提出核心问题或主题。

设定一个时间限制（例如 10-15 分钟）。

参与者依次或自由地大声说出想法。

严格遵循规则： 绝对禁止批评、评价或讨论任何想法（即使是积极的评价也可能抑制其他想法）。所有想法都被记录下来（通常写在白板或便签上）。

鼓励在他人想法的基础上进行“搭便车”或联想，衍生出新想法。

结束后，再对所有想法进行整理、分类、评估和筛选。

优点： 简单易行，能快速产生大量想法，营造开放、自由的氛围。

适用场景： 需要大量原始创意、希望打破思维定式、团队氛围融洽时。

逆向思维法：

核心思想： 打破常规思维模式，通过思考问题的反面、对立面或完全颠倒的假设来激发创意。迫使参与者从不同寻常的角度审视问题。

如何操作：

清晰定义要解决的核心问题或目标。

提出与问题/目标相反或逆向的问题/陈述。

例如：问题“如何提高客户满意度？” → 逆向问题：“如何让客户极度不满意？”

问题“如何让产品更畅销？” → 逆向问题：“如何让产品完全卖不出去？”

围绕这个逆向问题进行头脑风暴，列出所有能想到的导致反面结果的原因或方法。

审视列出的负面原因/方法，思考如何将其反转或避免，从而得到解决原始问题的正面方案或启发。

优点： 有效打破思维定式，揭示隐藏的假设和潜在风险，常能产生意想不到的洞见和独特解决方案。

适用场景： 常规方法陷入僵局、问题复杂难以入手、需要突破性创新或全面考虑风险时。

六顶思考帽法：

核心思想： 由爱德华·德·博诺提出，提供一种结构化的平行思维框架。参与者“戴上”不同颜色的“帽子”，代表不同的思维模式，在同一时间只专注于一种思考角度。这有助于将情感、事实、创意、批判等分开讨论，使头脑风暴更全面、高效且减少争论。

六顶帽子代表的思维模式：

白帽： 客观事实与数据。我们现在知道什么？需要什么信息？

红帽： 情感与直觉。对问题的感觉是什么？无需解释。

黑帽： 谨慎与批判。风险是什么？缺点在哪里？为什么行不通？

黄帽： 乐观与积极。优点、价值、可行性在哪里？为什么能行？

绿帽： 创意与探索。新想法、替代方案、可能性是什么？

蓝帽： 管理与控制。过程控制。我们现在在做什么？下一步是什么？需要哪种帽子？

如何操作（用于头脑风暴）：

蓝帽主持，设定议程和规则，决定帽子的使用顺序（例如：白->红->绿->黄->黑->蓝）。

按照顺序，所有参与者同时“戴上”同一顶帽子，从该角度出发贡献想法（例如，在绿帽时间，只进行创造性思考，不评判）。

主持人（蓝帽）确保大家遵守当前帽子的规则，并适时切换帽子。

最后，蓝帽进行总结，梳理所有观点。

优点： 全面考虑问题各个维度（事实、情感、创意、评估），减少思维混乱和对抗，促进建设性讨论，提高效率。

适用场景： 需要系统化、多角度分析复杂问题，团队讨论容易跑题或陷入争论，需要平衡创新与风险评估时。

选择哪种方法？

想要快速产生大量原始创意？选自由联想。

想要打破常规、寻求颠覆性想法？选逆向思维。

想要系统、全面、结构化地探讨问题，平衡各方因素？选六顶思考帽。

记住，无论哪种方法，暂缓评判和追求数量都是核心原则。在创意发散阶段，让想法自由流淌是关键!`,
          thinkContent:`嗯，用户让我列举三个头脑风暴的方法。这个问题看起来挺直接的，应该是想了解一些实用的创意激发技巧。

用户可能是学生、职场人士，或者正在参与团队项目的人。ta需要快速获得几种不同方向的头脑风暴方法，而不是深入的理论。从简洁的提问方式看，用户可能希望立即应用这些方法，所以需要具体可操作的建议。

考虑到使用场景，我选三个最经典且效果显著的方法：传统自由联想式能快速打开思路，逆向思维法适合突破常规，六顶思考帽则提供结构化框架。这样覆盖了发散、逆向和系统化三种不同维度。

用户没指定领域，所以保持通用性很重要。不过如果ta后续追问，我可以补充行业特定的变体。比如设计行业常用的SCAMPER法，或者写作常用的随机词汇刺激法。

对了，要强调核心原则：暂缓评判和追求数量。很多人头脑风暴无效就是因为过早否定想法，这点必须提醒。另外六顶思考帽的蓝帽角色很关键，实际使用时容易被忽略，需要特别说明。

最后加一句开放式结尾，给用户继续提问的空间。如果ta正在准备工作会议或小组作业，可能还需要具体操作案例。`
        })
      })
    })
  }
});