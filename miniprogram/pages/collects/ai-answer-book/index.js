// pages/collects/ai-answer-book/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    question: '',
    answer: '',
    displayedText: '',
    showAnswer: false,
    isThinking: false,
    showButton: false,
    isExceeded: false,
    remainingChars: 25,
    typingTimer: null,
    isAIMode: false, // 默认为普通版（置灰）
    shareTime: '', // 分享图片时间戳
    shareImagePath: '', // 分享图片路径
    normalAnswers: [
      "是的，毫无疑问。",
      "现在不是时候。",
      "相信你的直觉。",
      "答案就在你心中。",
      "时机未到。",
      "放手去做吧。",
      "保持耐心。",
      "这值得一试。",
      "重新考虑一下。",
      "跟随你的心。",
      "等待更好的时机。",
      "是的，但要谨慎。",
      "不，现在不行。",
      "寻求他人的建议。",
      "相信过程。",
      "保持开放的心态。",
      "专注于当下。",
      "让时间告诉你答案。",
      "勇敢一点。",
      "保持希望。",
      "这需要更多思考。",
      "听从你的内心。",
      "现在行动。",
      "等待信号。",
      "相信你的能力。",
      "保持积极。",
      "这很复杂。",
      "简单就是答案。",
      "继续前进。",
      "停下来反思。",
        "一切都会顺利。",
        "相信自己，你已经准备好了。",
        "这正是时候。",
        "毫无疑问，答案是肯定的。",
        "你正在走对的路。",
        "勇敢地去做吧。",
        "成功近在眼前。",
        "你会为自己的决定感到骄傲。",
        "宇宙正在回应你的意愿。",
        "这是命中注定的机会。",
        "坚持就会有奇迹。",
        "一切都在朝你希望的方向前进。",
        "你会被支持。",
        "尽情去尝试，命运会眷顾你。",
        "答案比你想象的更好。",
        "你值得被善待。",
        "心中的光不会熄灭。",
        "好运正在靠近。",
        "你的努力正在被看见。",
        "💫命运站在你这边。",
        "暂时不要行动。",
        "保持观察。",
        "时间会告诉你答案。",
        "等待更清晰的信号。",
        "这需要更多的耐心。",
        "不确定的结果也可能是礼物。",
        "再等等，一切会变得明朗。",
        "有时候，不动也是一种前进。",
        "顺其自然。",
        "保持中立，直到真相浮现。",
        "不妨让别人先开口。",
        "你的直觉还需要一点时间。",
        "答案正在形成。",
        "不妨暂停片刻。",
        "保持平衡，不偏不倚。",
        "让时间替你回答。",
        "或许你并不需要立刻知道答案。",
        "此刻的沉默很重要。",
        "再看一眼，你会发现不同。",
        "事情还未到转折点。",
        "云散开后你会看清。",
        "别急着下结论。",
        "静静等待，风向会变。",
        "现在不是最佳时机。",
        "你还没有准备好。",
        "这条路太危险。",
        "别轻易相信表象。",
        "结果可能让你失望。",
        "你需要更多的信息。",
        "放弃，比执着更勇敢。",
        "这不属于你。",
        "再坚持会适得其反。",
        "不要在今天做决定。",
        "它不会像你想的那样发展。",
        "你的心已经知道答案——是否定的。",
        "退一步，会看得更清楚。",
        "别让欲望蒙蔽了判断。",
        "拒绝，是一种保护。",
        "此刻行动，会失去更多。",
        "不要赌上你的直觉。",
        "那只是幻觉。",
        "一切都太仓促。",
        "你需要停下来。",
        "让它过去吧。",
        "💫命运已写好，只等你翻页。",
        "你梦见过答案。",
        "风中的信号已经出现。",
        "宇宙正在试探你。",
        "听从夜晚的低语。",
        "一次巧合正在酝酿。",
        "答案隐藏在你的问题里。",
        "再问一次，也许答案会变。",
        "命运的骰子已掷出。",
        "你不需要知道所有。",
        "星辰在注视着你。",
        "旧的门关上了，新的门正在开启。",
        "这是一场注定的巧合。",
        "留意第一个闪过脑海的想法。",
        "答案在沉默中。",
        "命运正以另一种语言与你交谈。",
        "你的梦境藏着线索。",
        "这是宇宙的回声。",
        "你已被选中去发现某件事。",
        "🌙在星光下你会明白。",
        "换个角度看问题。",
        "先把问题写下来。",
        "直觉是你最好的向导。",
        "你需要的是行动，而不是犹豫。",
        "别让别人替你决定。",
        "调整节奏，一切会变顺。",
        "记得问问自己真正想要什么。",
        "学会说“不”。",
        "试着去简化。",
        "结果没你想得那么重要。",
        "用更轻松的心态面对它。",
        "与其担心，不如准备。",
        "决定之前，先睡一觉。",
        "对话会带来答案。",
        "先照顾好自己。",
        "停下来，深呼吸。",
        "有时候，答案是继续前行。",
        "把问题交给时间。",
        "你已经知道答案，只是还没承认。",
        "去做能让你平静的事。",
        "阳光正在穿透阴影。",
        "让直觉成为你的罗盘。",
        "你的好奇心是线索。",
        "结果未定，你可以改变它。",
        "🌿成长在不安中发生。",
        "听听你心的声音。",
        "改变是安全的。",
        "你比想象中更坚强。",
        "命运正轻推你一把。",
        "这一切都会成为故事。",
        "你正处于转折点。",
        "不要忽略小的信号。",
        "世界正在倾听你的问题。",
        "不要害怕重来。",
        "先放下控制。",
        "答案会在你放松时出现。",
        "有时候“不知道”也是答案。",
        "🍃未来在等待你的决定。",
        "试着倾听，而不是判断。",
        "你需要一点勇敢。",
        "保持谦逊，会让路更开阔。",
        "奇迹藏在平凡中。",
        "下一步就会揭晓。",
        "直觉比逻辑更快一步。",
        "你的能量会吸引正确的方向。",
        "让一切自然展开。",
        "未知并不可怕。",
        "你不必急于解释。",
        "去做第一个让你心动的选择。",
        "这一刻的犹豫也有意义。",
        "命运正在编排细节。",
        "🌙你的问题正在改变你。",
        "不妨相信偶然。",
        "时间比你想象的更温柔。",
        "结果并不是重点，过程才是。",
        "风会告诉你答案。",
        "隐藏的真相正在靠近。",
        "先相信，再看见。",
        "宇宙正在重组路径。",
        "一个更好的开始在等待。",
        "放轻脚步，答案会跟上。",
        "别把问题看得太大。",
        "你并不孤单。",
        "学会等待也是力量。",
        "🍀幸运会在你松手时出现。",
        "命运在测试你的耐心。",
        "现在的沉默是一种指引。",
        "再走一步，你就会知道。",
        "放下预设的结局。",
        "答案不在远方，而在此刻。",
        "停下来感受风的方向。",
        "内心的声音正变得更清晰。",
        "这不是结束，而是转化。",
        "🌤一切都在对的轨迹上。",
        "尝试相信未知。",
        "你正在靠近真相。",
        "让好奇心引导你。",
        "也许你该笑一笑。",
        "你的答案会在意外中出现。",
        "这不是偶然，是必然。",
        "命运在轻声暗示。",
        "你的心已经提前知道结局。",
        "💫相信巧合的力量。",
        "今天不必知道全部真相。",
        "有时放弃比继续更有力量。",
        "善意会指引你。",
        "不要让焦虑代替决心。",
        "所有问题终将过去。",
        "你已在路上。",
        "答案在路途里，不在终点。",
        "这件事会让你成长。",
        "未来会给出补偿。",
        "现在的困惑是一种邀请。",
        "🌿让不确定成为朋友。",
        "心软不是弱点，是信号。",
        "有时你需要一个新的问题。",
        "命运在等你回应。",
        "你的坚持会被回报。",
        "你可以信任直觉。",
        "风会带走多余的担忧。",
        "再多问一次内心。",
        "你已经跨过最难的一步。",
        "此刻的决定，会定义新的你。",
        "答案藏在平静之后。",
        "有时候“不是现在”才是最好的回应。",
        "宇宙此刻保持沉默，是一种回答。",
        "别忘了呼吸。",
        "🌙夜晚会告诉你真相。",
        "让光透进来。",
        "别低估了你的温柔。",
        "明天的你会理解今天。",
        "放慢一点没关系。",
        "答案总会找到你。",
        "让心安静，答案自来。",
        "你会被引导到正确的地方。",
        "你是自己最好的预言家。",
        "💫新的章节正在开启。"  
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 先获取云存储文件的临时链接
    wx.cloud.getTempFileURL({
      fileList: ['cloud://cloud1-8gzjqovx9c2ec2e9.636c-cloud1-8gzjqovx9c2ec2e9-1307913003/MFBoHeHaiYan.otf'],
      // fileList: ['cloud://cloud1-8gzjqovx9c2ec2e9.636c-cloud1-8gzjqovx9c2ec2e9-1307913003/Momozhuanji.ttf'],
      success: res => {
        if (res.fileList && res.fileList.length > 0) {
          const tempFileURL = res.fileList[0].tempFileURL;
          console.log('获取临时链接成功:', tempFileURL);
          
          // 使用临时链接加载字体
          wx.loadFontFace({
            family: 'Momozhuanji',
            source: `url("${tempFileURL}")`,
            success: () => {
              console.log('字体加载成功');
            },
            fail: (err) => {
              console.error('字体加载失败:', err);
            }
          });
        }
      },
      fail: err => {
        console.error('获取临时链接失败:', err);
        // 降级方案：使用公网链接
        wx.loadFontFace({
          family: 'Momozhuanji',
          source: 'url("https://suminhan.cn/MFBoHeHaiYan.otf")',
          success: () => {
            console.log('字体加载成功（降级方案）');
          },
          fail: (err) => {
            console.error('字体加载失败:', err);
          }
        });
      }
    });
  },

  /**
   * 处理输入
   */
  handleInput(e) {
    const value = e.detail.value || '';
    const remaining = 30 - value.length;
    this.setData({
      question: value,
      remainingChars: remaining,
      isExceeded: remaining < 0
    });
  },

  /**
   * 处理回车确认
   */
  handleConfirm(e) {
    const question = e.detail.value.trim();
    if (!question || question.length > 30) {
      wx.showToast({
        title: '请输入1-30字的问题',
        icon: 'none'
      });
      return;
    }
    this.getAnswer(question);
  },

  /**
   * 切换 AI 模式
   */
  toggleAIMode() {
    const newMode = !this.data.isAIMode;
    this.setData({
      isAIMode: newMode
    });
    
    wx.showToast({
      title: newMode ? '已切换到 AI 版' : '已切换到经典版',
      icon: 'none',
      duration: 1000
    });
  },

  /**
   * 获取答案
   */
  async getAnswer(question) {
    this.setData({
      isThinking: true,
      showAnswer: false,
      showButton: false
    });

    // 如果是普通版，直接使用本地答案库
    if (!this.data.isAIMode) {
      setTimeout(() => {
        const randomAnswer = this.data.normalAnswers[Math.floor(Math.random() * this.data.normalAnswers.length)];
        
        this.setData({
          isThinking: false,
          answer: randomAnswer,
          showAnswer: true,
          displayedText: ''
        });

        // 打字机效果
        this.typeWriter(randomAnswer);
      }, 500); // 模拟思考时间
      return;
    }

    // AI 版：使用微信云开发 AI SDK
    try {
      // 创建 AI 模型实例
      const model = wx.cloud.extend.AI.createModel('deepseek');
      
      // 调用 AI 生成文本
      const res = await model.generateText({
        model: 'deepseek-v3', // 使用 DeepSeek V3 模型
        messages: [
          {
            role: 'system',
            content: `你是一个智慧的答案之书AI助手。用户会提出一个问题，你需要针对这个问题生成16条不同类型的回答。

要求：
1. 所有回答必须与用户的问题相关
2. 每条回答控制在15-30字以内
3. 回答要简短、富有哲理、充满智慧
4. 必须严格按照以下JSON格式返回，不要有任何其他文字

{
  "affirmative": ["肯定回答1", "肯定回答2", "肯定回答3", "肯定回答4", "肯定回答5"],
  "negative": ["否定回答1", "否定回答2", "否定回答3", "否定回答4", "否定回答5"],
  "mysterious": ["神秘回答1", "神秘回答2"],
  "neutral": ["中立回答1", "中立回答2"],
  "advice": ["建议回答1", "建议回答2"]
}

分类说明：
- affirmative（肯定类，5条）：给予肯定、支持、积极的答案
- negative（否定类，5条）：给予否定、警示、消极的答案
- mysterious（神秘类，2条）：模糊、神秘、引人思考的答案
- neutral（中立类，2条）：客观、中立、不偏不倚的答案
- advice（建议类，2条）：给出建议、指导的答案`
          },
          {
            role: 'user',
            content: question
          }
        ],
        // 可选参数
        temperature: 0.8, // 控制随机性，0-1 之间
      });

      console.log('AI 调用成功:', res);

      // 解析 AI 返回的答案
      let answer = '命运之书暂时无法给出答案';
      
      // 获取AI返回的内容
      let aiContent = '';
      if (res && res.choices && res.choices.length > 0) {
        aiContent = res.choices[0].message.content.trim();
      } else if (res && res.content) {
        aiContent = res.content.trim();
      } else if (res && res.reply) {
        aiContent = res.reply.trim();
      }

      // 尝试解析JSON并随机选择一条答案
      if (aiContent) {
        try {
          // 提取JSON内容（可能包含在代码块中）
          let jsonStr = aiContent;
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }

          const answersObj = JSON.parse(jsonStr);
          
          // 将所有答案合并到一个数组
          const allAnswers = [
            ...(answersObj.affirmative || []),
            ...(answersObj.negative || []),
            ...(answersObj.mysterious || []),
            ...(answersObj.neutral || []),
            ...(answersObj.advice || [])
          ];

          // 过滤掉空答案
          const validAnswers = allAnswers.filter(a => a && a.trim());

          // 随机选择一条答案
          if (validAnswers.length > 0) {
            answer = validAnswers[Math.floor(Math.random() * validAnswers.length)];
            console.log('从AI生成的', validAnswers.length, '条答案中随机选择:', answer);
          } else {
            console.warn('AI返回的答案数组为空');
          }
        } catch (parseError) {
          console.error('解析AI返回的JSON失败:', parseError);
          console.log('原始内容:', aiContent);
          // 如果解析失败，尝试直接使用返回的内容
          answer = aiContent.substring(0, 50); // 截取前50字符
        }
      }

      this.setData({
        isThinking: false,
        answer: answer,
        showAnswer: true,
        displayedText: ''
      });

      // 打字机效果
      this.typeWriter(answer);

    } catch (err) {
      console.error('AI 调用失败:', err);
      
      // 使用本地备用答案
      const randomAnswer = this.data.normalAnswers[Math.floor(Math.random() * this.data.normalAnswers.length)];
      
      this.setData({
        isThinking: false,
        answer: randomAnswer,
        showAnswer: true,
        displayedText: ''
      });

      // 打字机效果
      this.typeWriter(randomAnswer);

      // 提示用户
      wx.showToast({
        title: 'AI 暂时不可用，使用离线答案',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 打字机效果
   */
  typeWriter(text) {
    let index = 0;
    const speed = 100; // 每个字的显示速度（毫秒）
    
    const timer = setInterval(() => {
      if (index < text.length) {
        this.setData({
          displayedText: text.substring(0, index + 1)
        });
        index++;
      } else {
        clearInterval(timer);
        this.setData({
          showButton: true
        });
      }
    }, speed);

    this.setData({
      typingTimer: timer
    });
  },

  /**
   * 重置
   */
  onReset() {
    if (this.data.typingTimer) {
      clearInterval(this.data.typingTimer);
    }
    this.setData({
      question: '',
      answer: '',
      displayedText: '',
      showAnswer: false,
      isThinking: false,
      showButton: false,
      isExceeded: false,
      remainingChars: 30,
      typingTimer: null
    });
  },

  /**
   * 使用 Canvas 生成图片（保存到相册）
   */
  onPhoto() {
    this.generateImage('save');
  },

  /**
   * 分享图片给微信好友
   */
  onShare() {
    this.generateImage('share');
  },

  /**
   * 生成图片（统一方法）
   * @param {string} action - 'save' 保存到相册 | 'share' 分享给好友
   */
  generateImage(action = 'save') {
    if (!this.data.answer || !this.data.question) {
      wx.showToast({
        title: '请先获取答案',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: action === 'save' ? '生成图片中...' : '准备分享...',
      mask: true
    });

    // 获取 Canvas 实例
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          wx.hideLoading();
          wx.showToast({
            title: 'Canvas 初始化失败',
            icon: 'none'
          });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 设置 Canvas 尺寸
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = 800 * dpr;
        canvas.height = 800 * dpr;
        ctx.scale(dpr, dpr);

        // 绘制图片
        this.drawCanvas(canvas, ctx, action);
      });
  },

  /**
   * Canvas 绘制方法
   * @param {Object} canvas - Canvas 实例
   * @param {Object} ctx - Canvas 上下文
   * @param {string} action - 'save' 保存到相册 | 'share' 分享给好友
   */
  drawCanvas(canvas, ctx, action = 'save') {
    // 随机渐变背景色组合
    const gradientColors = [
      ['#f5f7fa', '#c3cfe2'], // 浅蓝灰
      ['#ffecd2', '#fcb69f'], // 暖橙
      ['#e0c3fc', '#8ec5fc'], // 紫蓝
      ['#fbc2eb', '#a6c1ee'], // 粉紫
      ['#fdcbf1', '#e6dee9'], // 粉灰
      ['#a1c4fd', '#c2e9fb'], // 天蓝
      ['#ffd1ff', '#ffeaa7'], // 粉黄
      ['#cfd9df', '#e2ebf0'], // 冷灰
      ['#ffeaa7', '#fdcb6e'], // 金黄
      ['#dfe6e9', '#b2bec3'], // 银灰
      ['#fab1a0', '#ffeaa7'], // 橙黄
      ['#a29bfe', '#dfe6e9'], // 紫灰
    ];

    // 随机选择一组颜色
    const randomColors = gradientColors[Math.floor(Math.random() * gradientColors.length)];

    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 800, 800);
    gradient.addColorStop(0, randomColors[0]);
    gradient.addColorStop(1, randomColors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);

    // 绘制背景问题（大字、半透明）
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.font = '120px Momozhuanji';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 处理问题文本换行
    const questionLines = this.wrapText(ctx, this.data.question, 700);
    const questionLineHeight = 120;
    const questionStartY = 400 - ((questionLines.length - 1) * questionLineHeight) / 2;
    
    questionLines.forEach((line, index) => {
      ctx.fillText(line, 400, questionStartY + index * questionLineHeight);
    });
    ctx.restore();

    // 绘制答案文字（前景、清晰）
    ctx.save();
    ctx.fillStyle = '#202020';
    ctx.font = '60px Momozhuanji';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 处理答案文本换行
    const answerLines = this.wrapText(ctx, this.data.answer, 680);
    const answerLineHeight = 60;
    const answerStartY = 400 - ((answerLines.length - 1) * answerLineHeight) / 2;
    
    answerLines.forEach((line, index) => {
      ctx.fillText(line, 400, answerStartY + index * answerLineHeight);
    });
    ctx.restore();

    // 绘制右下角水印
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    // 格式化时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // 绘制时间
    ctx.font = '16px sans-serif';
    ctx.fillText(timeString, 760, 745);

    // 绘制来源
    ctx.font = '16px sans-serif';
    ctx.fillText('答案之书 Agent 生成', 760, 770);
    ctx.restore();

    // 导出图片
    wx.canvasToTempFilePath({
      canvas: canvas,
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        
        if (action === 'save') {
          // 保存到相册
          this.saveImageToAlbum(tempFilePath);
        } else if (action === 'share') {
          // 分享给好友
          this.shareImageToFriend(tempFilePath);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('导出图片失败:', err);
        wx.showToast({
          title: '生成图片失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 保存图片到相册
   */
  saveImageToAlbum(filePath) {
    wx.hideLoading();
    
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({
          title: '已保存到相册',
          icon: 'none',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error('保存失败:', err);
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要授权保存图片到相册',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 分享图片给微信好友
   * 使用 wx.showShareImageMenu 显示分享菜单
   */
  shareImageToFriend(filePath) {
    wx.hideLoading();
    
    // 保存图片路径到 data
    this.setData({
      shareImagePath: filePath
    });

    // 使用 wx.showShareImageMenu 显示分享菜单
    wx.showShareImageMenu({
      path: filePath,
      success: (res) => {
        console.log('分享菜单显示成功', res);
        // 用户可以选择：发送给朋友、保存图片、收藏等
      },
      fail: (err) => {
        console.error('显示分享菜单失败:', err);
        
        // 如果 API 不支持，提供备选方案
        wx.showModal({
          title: '分享提示',
          content: '当前微信版本不支持此功能，是否保存图片到相册后手动分享？',
          confirmText: '保存图片',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.saveImageToAlbum(filePath);
            }
          }
        });
      }
    });
  },

  /**
   * 文本换行处理
   */
  wrapText(ctx, text, maxWidth) {
    // 防御性检查
    if (!text || typeof text !== 'string') {
      return [''];
    }

    const words = text.split('');
    let line = '';
    const lines = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    
    return lines;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})