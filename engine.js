/*!
 * 术语三档解释器 · 核心引擎
 * 纯本地运行：术语库 + 匹配 + 三档解释 + 密度估计 + 一句话总结 + 未收录候选
 * 不依赖任何第三方库，浏览器与 Node 均可加载
 */
(function (root) {
  'use strict';

  /* ---------------- 术语库 ---------------- */
  var GLOSSARY = [
    /* 计算机 / AI */
    { term: '过拟合', domain: '计算机/AI', aliases: ['overfitting'],
      expert: '模型在训练集上误差持续下降、在验证集上误差反而回升的现象，本质是对训练样本噪声的记忆。',
      plain: '学得太死，练习题全对，换一道新题就崩。',
      analogy: '像把去年真题的答案背下来，题型一改就完全不会。' },
    { term: '梯度下降', domain: '计算机/AI', aliases: ['gradient descent'],
      expert: '沿损失函数负梯度方向迭代更新参数的一阶优化方法，步长由学习率控制。',
      plain: '每次朝着「最陡的下坡方向」挪一小步，慢慢走到谷底。',
      analogy: '蒙着眼下山，用脚探哪边更陡就往哪边走。' },
    { term: '注意力机制', domain: '计算机/AI', aliases: ['attention'],
      expert: '用查询与键的点积计算权重、对值做加权求和，使模型按相关性动态聚合上下文的算子。',
      plain: '读到一句话时，自动决定该重点看前面哪个词。',
      analogy: '开会时你只盯着正在发言的人，别人说话自动变小声。' },
    { term: '大语言模型', domain: '计算机/AI', aliases: ['LLM', 'large language model'],
      expert: '在海量文本上以「预测下一个词」为目标训练的、参数规模通常在十亿级以上的生成式模型。',
      plain: '读了很多书、能接着你话往下说的程序。',
      analogy: '一个背了整座图书馆的接话高手，但未必真懂。' },
    { term: '检索增强生成', domain: '计算机/AI', aliases: ['RAG'],
      expert: '先从外部知识库检索相关片段，再把片段拼进提示词交由模型生成答案的框架。',
      plain: '先去资料库翻到相关段落，再照着段落回答，而不是凭记忆瞎说。',
      analogy: '开卷考试：先查书，再答题。' },
    { term: '向量数据库', domain: '计算机/AI', aliases: ['vector database'],
      expert: '存储高维嵌入向量并支持近似最近邻检索的数据库，用于语义相似度查询。',
      plain: '按「意思像不像」来找东西，而不是按关键词一模一样来找。',
      analogy: '按味道找菜，而不是按菜名找菜。' },
    { term: '微调', domain: '计算机/AI', aliases: ['fine-tuning'],
      expert: '在预训练权重基础上用领域数据继续训练，使模型适配特定任务或风格。',
      plain: '在已经学会说话的基础上，再补课学你这一行的话。',
      analogy: '会开车之后再学开卡车，不用从认方向盘开始。' },
    { term: '幻觉', domain: '计算机/AI', aliases: ['hallucination'],
      expert: '模型输出与事实不符、却以高置信语气呈现内容的现象，源于概率生成而非事实核查。',
      plain: '一本正经地编。',
      analogy: '不懂装懂的同事，说得比谁都肯定。' },
    { term: '提示词', domain: '计算机/AI', aliases: ['prompt'],
      expert: '输入给模型的指令文本，通过约束任务、格式与角色来影响输出分布。',
      plain: '你对它说的话，说得越清楚它答得越准。',
      analogy: '点菜时说清「不要辣、少油」，端上来的才对。' },
    { term: '上下文窗口', domain: '计算机/AI', aliases: ['context window'],
      expert: '模型单次前向计算可容纳的最大 token 数，超出部分需截断或压缩。',
      plain: '它一次能记住多少字，超了就忘前面。',
      analogy: '桌面只有这么大，摊开的资料多了就放不下。' },
    { term: '量化', domain: '计算机/AI', aliases: ['quantization'],
      expert: '把权重从高精度浮点映射到低位宽整数，以显存换速度与部署成本的压缩方法。',
      plain: '把数字用更省的格式存，模型变小、跑得更快、稍笨一点。',
      analogy: '把无损照片压成 JPEG，体积小很多，细节差一点。' },

    /* 数据库 / 数据 */
    { term: '索引', domain: '数据库', aliases: ['index'],
      expert: '为加速检索而额外维护的有序数据结构（如 B+ 树），以写放大和存储换取查询复杂度下降。',
      plain: '书的目录，不用一页页翻就知道该去哪儿找。',
      analogy: '图书馆的索书号，直接带你走到那一排。' },
    { term: '事务', domain: '数据库', aliases: ['transaction'],
      expert: '一组满足原子性、一致性、隔离性、持久性的数据库操作序列。',
      plain: '要么全做完，要么当没发生过。',
      analogy: '转账：扣钱和到账必须一起成功，不能只扣不到。' },
    { term: '范式', domain: '数据库', aliases: ['normal form'],
      expert: '通过函数依赖分解消除冗余与更新异常的关系模式设计准则（1NF 到 BCNF）。',
      plain: '把表拆到不重复、不矛盾为止。',
      analogy: '同一份地址别在十个表里各抄一遍，改一次要改十处。' },
    { term: '分片', domain: '数据库', aliases: ['sharding'],
      expert: '按分片键把数据水平拆分到多个物理节点，以扩展写入吞吐与存储容量。',
      plain: '一张大表切成几块，分给几台机器一起扛。',
      analogy: '一个收银台排队太长，开五个窗口分流。' },
    { term: '物化视图', domain: '数据库', aliases: ['materialized view'],
      expert: '把查询结果预先计算并持久化存储的视图，读快但需刷新维护。',
      plain: '把常算的结果先存下来，用的时候直接取。',
      analogy: '提前把常点的菜做好放保温柜，来了就端。' },

    /* 编译 / 程序语言 */
    { term: '词法分析', domain: '编译原理', aliases: ['lexical analysis', 'lexer'],
      expert: '用有限自动机把字符流切分为 token 序列的第一阶段。',
      plain: '把一串字符切成一个个有意义的词。',
      analogy: '把连笔字拆成一个个能认的字。' },
    { term: '语法分析', domain: '编译原理', aliases: ['parsing'],
      expert: '依据文法规则把 token 序列构造成语法树，检查结构合法性。',
      plain: '检查这些词按规矩能不能拼成一句话。',
      analogy: '语文老师判断句子成分搭不搭。' },
    { term: '抽象语法树', domain: '编译原理', aliases: ['AST'],
      expert: '去掉括号、分号等表层语法后表示程序结构的树形中间表示。',
      plain: '把代码变成一棵树，先乘除后加减的次序一目了然。',
      analogy: '把句子画成主谓宾的结构图。' },
    { term: '中间表示', domain: '编译原理', aliases: ['IR'],
      expert: '介于源语言与目标机器之间的规范化表示，便于分析与优化。',
      plain: '编译过程中的通用草稿格式。',
      analogy: '把各种方言先翻译成普通话，再统一翻成外语。' },
    { term: '寄存器分配', domain: '编译原理', aliases: ['register allocation'],
      expert: '把无限虚拟寄存器映射到有限物理寄存器、溢出部分写入栈的图着色问题。',
      plain: '把变量尽量塞进 CPU 最快的几个格子里，塞不下的放到内存。',
      analogy: '桌上只有六个抽屉，常用的放抽屉，不常用的堆柜子。' },

    /* 软件工程 */
    { term: '单元测试', domain: '软件工程', aliases: ['unit test'],
      expert: '对最小可测单元隔离验证输入输出，通常由开发者编写并纳入持续集成。',
      plain: '给每个小零件单独做体检。',
      analogy: '整车下线前先逐个测螺丝和刹车片。' },
    { term: '持续集成', domain: '软件工程', aliases: ['CI'],
      expert: '代码合入主干后自动触发构建与测试，尽早暴露集成缺陷的实践。',
      plain: '每次改完代码自动跑一遍检查，坏了立刻知道。',
      analogy: '流水线上的探伤仪，每过一个件都扫一遍。' },
    { term: '技术债', domain: '软件工程', aliases: ['technical debt'],
      expert: '为短期交付而选择的低质量实现，未来需以额外维护成本偿还。',
      plain: '先糊上去能用，以后还的账。',
      analogy: '刷墙前没补裂缝，过两年整面重刷。' },
    { term: '回归测试', domain: '软件工程', aliases: ['regression test'],
      expert: '修改后重跑既有用例，确认旧功能未被破坏的测试集。',
      plain: '改完新功能，回头确认老功能没坏。',
      analogy: '装修完厨房，把水电全屋再试一遍。' },

    /* 金融 / 经贸 */
    { term: '汇率', domain: '金融经贸', aliases: ['exchange rate'],
      expert: '两种货币之间的兑换比率，受利率、国际收支与市场预期共同影响。',
      plain: '一块钱能换多少外币。',
      analogy: '两国商品之间的「翻译价」。' },
    { term: '信用证', domain: '金融经贸', aliases: ['L/C', 'letter of credit'],
      expert: '银行以自身信用承诺付款的结算工具，以单据相符为付款条件。',
      plain: '银行出面担保：货和单据对得上就一定付钱。',
      analogy: '支付宝的担保交易，只不过担保人是银行。' },
    { term: '期权', domain: '金融经贸', aliases: ['option'],
      expert: '赋予买方在约定日期以约定价格买入或卖出标的的权利而非义务的合约。',
      plain: '先付一笔钱，锁定以后按这个价买不买的权利。',
      analogy: '定金锁房价：涨了照原价买，跌了可以不要。' },
    { term: '对冲', domain: '金融经贸', aliases: ['hedging'],
      expert: '建立方向相反的头寸以抵消既有风险的交易安排。',
      plain: '买一份反向的保险，涨跌都不至于伤筋动骨。',
      analogy: '既押主队赢又押客队赢，只为不输太惨。' },
    { term: '流动性', domain: '金融经贸', aliases: ['liquidity'],
      expert: '资产在不显著影响价格的前提下快速变现的能力。',
      plain: '想卖的时候能不能马上卖掉、还不掉价。',
      analogy: '菜市场的青菜随时能出手，房子挂半年也未必卖得掉。' },
    { term: '关税', domain: '金融经贸', aliases: ['tariff'],
      expert: '一国对进出口商品课征的税，用于财政收入与产业保护。',
      plain: '进出海关时要交的过路费。',
      analogy: '进小区要交的停车费，交多少由物业定。' },
    { term: '询盘', domain: '金融经贸', aliases: ['inquiry'],
      expert: '买方向卖方发出的价格与条款询问，是外贸成交链条的起点。',
      plain: '客户先来问「这个多少钱、怎么发」。',
      analogy: '打电话到餐厅问「有没有位、人均多少」。' },
    { term: '报价', domain: '金融经贸', aliases: ['quotation'],
      expert: '卖方向买方给出的含价格、贸易术语与有效期的正式回复。',
      plain: '正式回一个价，并说清含不含运费、多久有效。',
      analogy: '装修师傅给你一张写清项目和工期的报价单。' },
    { term: '清关', domain: '金融经贸', aliases: ['customs clearance'],
      expert: '货物进出口时向海关申报、查验、缴税并放行的完整流程。',
      plain: '货到口岸要办手续，海关点头才能放行。',
      analogy: '进机场过安检和边检，手续齐了才让走。' },
    { term: '原产地证', domain: '金融经贸', aliases: ['certificate of origin'],
      expert: '证明货物生产或制造国家/地区的官方文件，直接影响适用税率。',
      plain: '证明这批货是哪儿造的，决定交多少税。',
      analogy: '农产品的产地标签，决定能不能卖溢价。' },

    /* 生物医药 */
    { term: '离岸价', domain: '金融经贸', aliases: ['FOB', 'free on board'],
      expert: '卖方在装运港把货物装上船即完成交货的贸易术语，运费与保险由买方承担。',
      plain: '报的价里只含送到港口上船，船开出去之后的费用不归我。',
      analogy: '送到快递站的价，寄出去之后的运费你自己掏。' },
    { term: '到岸价', domain: '金融经贸', aliases: ['CIF', 'cost insurance freight'],
      expert: '卖方承担成本、保险费与运至目的港运费的贸易术语，风险仍在装运港转移。',
      plain: '价里已经含了运费和保险，货到对方港口前的路费我出。',
      analogy: '包邮到门，路上磕碰算你的。' },
    { term: '滞期费', domain: '金融经贸', aliases: ['demurrage'],
      expert: '租船方未在装卸期限内完成作业而向船东支付的赔偿费用。',
      plain: '货没在约定时间内装卸完，超出的时间要按天赔钱。',
      analogy: '搬家货车在楼下等你超时，按小时加钱。' },
    { term: '靶点', domain: '生物医药', aliases: ['target'],
      expert: '药物结合并发挥作用的生物大分子，通常是受体、酶或离子通道。',
      plain: '药在身体里要「锁」住的那个点。',
      analogy: '一把钥匙只认一把锁，靶点就是那把锁。' },
    { term: '双盲试验', domain: '生物医药', aliases: ['double-blind'],
      expert: '受试者与研究者均不知分组情况的对照试验，用于排除期望偏倚。',
      plain: '医生和病人都不知道吃的是真药还是糖片。',
      analogy: '盲测饮料，谁都不知道杯子里是哪一款。' },
    { term: '安慰剂', domain: '生物医药', aliases: ['placebo'],
      expert: '无药理活性的对照制剂，用于量化心理预期带来的疗效。',
      plain: '没有药效的「假药」，用来对比真药到底有没有用。',
      analogy: '给球员一瓶普通水，说这是能量饮料，他也觉得更有劲。' },
    { term: '生物标志物', domain: '生物医药', aliases: ['biomarker'],
      expert: '可客观测量并指示生理或病理状态的分子指标，用于诊断与疗效预测。',
      plain: '血液里能反映身体状态的那个数字或分子。',
      analogy: '汽车仪表盘的故障灯，亮了说明某个系统有问题。' },
    { term: '半衰期', domain: '生物医药', aliases: ['half-life'],
      expert: '药物血药浓度下降一半所需时间，决定给药间隔。',
      plain: '药在体内浓度掉一半要多久。',
      analogy: '一杯热水的温度掉一半要多久，决定你多久再加热。' },
    { term: '剂量', domain: '生物医药', aliases: ['dosage'],
      expert: '单次或单位时间内给药的量，需在疗效与毒性之间取窗。',
      plain: '一次吃多少。',
      analogy: '盐放多少：少了没味，多了没法吃。' },
    { term: '队列研究', domain: '生物医药', aliases: ['cohort study'],
      expert: '按暴露与否分组、随访观察结局发生差异的观察性研究设计。',
      plain: '长期跟着两拨人看谁更容易得病。',
      analogy: '跟拍两组人十年，看抽烟那组是不是更早出问题。' },

    /* 气候 / 能源 */
    { term: '碳排放', domain: '气候能源', aliases: ['carbon emission'],
      expert: '活动过程中以二氧化碳当量计的直接与间接温室气体排放总量。',
      plain: '烧了多少煤和气，折算成的温室气体。',
      analogy: '家里的水电账单，只不过记的是温室气体。' },
    { term: '碳中和', domain: '气候能源', aliases: ['carbon neutrality'],
      expert: '排放量与碳汇、碳移除量相抵，净排放为零的状态。',
      plain: '排多少就吸收多少，净账为零。',
      analogy: '花多少赚多少，月底结余为零。' },
    { term: '光伏', domain: '气候能源', aliases: ['photovoltaic', 'PV'],
      expert: '利用半导体的光生伏特效应把太阳辐射直接转换为电能的技术。',
      plain: '太阳能板把阳光变成电。',
      analogy: '给屋顶装一张会发电的太阳膜。' },
    { term: '储能', domain: '气候能源', aliases: ['energy storage'],
      expert: '把电能以化学、机械或热的形式暂存、按需释放的系统。',
      plain: '把电先存起来，等要用的时候再放。',
      analogy: '充电宝，只不过给电网用。' },
    { term: '电网调峰', domain: '气候能源', aliases: ['peak shaving'],
      expert: '在负荷高峰削减出力、低谷补足，以平抑供需曲线的调度手段。',
      plain: '用电高峰时少发一点、多用存的，低谷时反过来。',
      analogy: '早晚高峰限流、平峰多放车，让地铁不挤。' },
    { term: '氢能', domain: '气候能源', aliases: ['hydrogen energy'],
      expert: '以氢气为能量载体，通过燃料电池或燃烧释放能量的二次能源体系。',
      plain: '用氢气存和运能量，用的时候只排水。',
      analogy: '一个空瓶子装能量，用完只剩水。' },
    { term: '生命周期评估', domain: '气候能源', aliases: ['LCA'],
      expert: '从原料获取到废弃处理全过程核算资源消耗与环境影响的系统方法。',
      plain: '从头到尾算一个产品到底污染多少。',
      analogy: '算一道菜的总成本：种、运、做、洗锅都算。' },

    /* 科研方法 */
    { term: '显著性', domain: '科研方法', aliases: ['significance', 'p 值', 'p-value'],
      expert: '在原假设下观察到当前或更极端结果的概率低于预设阈值，即认为效应显著。',
      plain: '这个差别不太可能是碰巧出现的。',
      analogy: '掷硬币连出十次正面，就不太像纯运气。' },
    { term: '置信区间', domain: '科研方法', aliases: ['confidence interval'],
      expert: '在给定置信水平下对总体参数的区间估计，宽度反映估计精度。',
      plain: '真值大概率落在哪个区间里。',
      analogy: '报天气说「明天 20 到 24 度」，而不是死咬 22 度。' },
    { term: '消融实验', domain: '科研方法', aliases: ['ablation study'],
      expert: '逐个移除模型组件、其余条件不变，以归因各组件贡献的实验设计。',
      plain: '一次拆掉一个零件，看性能掉多少，就知道谁在起作用。',
      analogy: '拆发动机测试：拔掉哪个零件车就不走了。' },
    { term: '基准测试', domain: '科研方法', aliases: ['benchmark'],
      expert: '在统一数据集与评测协议下比较方法性能的可复现实验设置。',
      plain: '大家用同一套题、同一套打分标准来比。',
      analogy: '统一考题的联考，分数才能横着比。' },
    { term: '元分析', domain: '科研方法', aliases: ['meta-analysis'],
      expert: '对多个独立研究的结果做定量合并，以提高统计效力与结论稳健性。',
      plain: '把很多篇小研究的数据合起来算一次。',
      analogy: '把各班的小测验成绩合起来，看整体水平。' },
    { term: '同行评审', domain: '科研方法', aliases: ['peer review'],
      expert: '由同领域专家对稿件方法、数据与结论做独立评议的学术质量机制。',
      plain: '同行先挑毛病，挑不出大问题才能发。',
      analogy: '菜品上桌前，先让后厨老师傅尝一口。' }
  ];

  /* ---------------- 匹配 ---------------- */
  function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* 这些英文词本身是通用词，单独出现时不算命中（中文术语仍可命中） */
  var AMBIG_EN = { prompt: 1, index: 1, option: 1, target: 1, option_: 1, quote: 1, place: 1 };

  function findHits(text) {
    var hits = [];
    for (var i = 0; i < GLOSSARY.length; i++) {
      var g = GLOSSARY[i];
      var keys = [g.term].concat(g.aliases || []);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (!key) continue;
        if (AMBIG_EN[String(key).toLowerCase()]) continue;
        if (/^[\x00-\x7F]+$/.test(key)) {
          var re = new RegExp('(^|[^A-Za-z0-9_])(' + escapeReg(key) + ')(?![A-Za-z0-9_])', 'gi');
          var m;
          while ((m = re.exec(text)) !== null) {
            var start = m.index + m[1].length;
            hits.push({ start: start, end: start + m[2].length, term: g.term, domain: g.domain });
            re.lastIndex = start + m[2].length;
          }
        } else {
          var idx = 0;
          while ((idx = text.indexOf(key, idx)) !== -1) {
            hits.push({ start: idx, end: idx + key.length, term: g.term, domain: g.domain });
            idx += key.length;
          }
        }
      }
    }
    hits.sort(function (a, b) {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });
    var out = [];
    var last = -1;
    for (var h = 0; h < hits.length; h++) {
      if (hits[h].start >= last) { out.push(hits[h]); last = hits[h].end; }
    }
    return out;
  }

  /* ---------------- 统计 ---------------- */
  function summarize(hits) {
    var map = {};
    var order = [];
    for (var i = 0; i < hits.length; i++) {
      var t = hits[i].term;
      if (!map[t]) { map[t] = { term: t, domain: hits[i].domain, count: 0, first: hits[i].start }; order.push(t); }
      map[t].count += 1;
    }
    return order.map(function (t) { return map[t]; });
  }

  function densityOf(text, hits) {
    var covered = 0;
    var seen = {};
    for (var i = 0; i < hits.length; i++) {
      var key = hits[i].start + ':' + hits[i].end;
      if (seen[key]) continue;
      seen[key] = 1;
      covered += hits[i].end - hits[i].start;
    }
    var total = text.replace(/\s+/g, '').length;
    if (!total) return 0;
    return covered / total;
  }

  function levelOf(ratio) {
    if (ratio < 0.05) return { label: '低', hint: '这段文字门槛不高，普通人直接读也问题不大。' };
    if (ratio < 0.12) return { label: '中', hint: '有几个专业词会卡住人，建议先过一遍术语卡。' };
    return { label: '高', hint: '专业词密集，不看解释基本读不下去。' };
  }

  function firstSentence(text) {
    var s = text.replace(/\s+/g, ' ').trim();
    if (!s) return '';
    var m = s.match(/^[^。！？!?；;\n]{1,120}[。！？!?]?/);
    var out = m ? m[0] : s.slice(0, 60);
    if (out.length > 90) out = out.slice(0, 90) + '…';
    return out.trim();
  }

  function oneLineSummary(text, terms) {
    var head = firstSentence(text);
    var names = terms.slice(0, 3).map(function (t) { return t.term; });
    var tail = names.length ? '核心概念：' + names.join('、') + '。' : '';
    return (head ? head : '') + (tail ? ' ' + tail : '');
  }

  /* ---------------- 未收录候选 ---------------- */
  var STOP = { 'THE': 1, 'AND': 1, 'FOR': 1, 'WITH': 1, 'PDF': 1, 'API': 1, 'APP': 1, 'PPT': 1, 'OK': 1, 'AI': 0 };

  function unlistedCandidates(text, glossaryTerms) {
    var known = {};
    for (var i = 0; i < GLOSSARY.length; i++) {
      known[GLOSSARY[i].term] = 1;
      (GLOSSARY[i].aliases || []).forEach(function (a) { known[a.toUpperCase()] = 1; });
    }
    var out = {};
    var order = [];
    var push = function (w) {
      var key = w.toUpperCase();
      if (known[key] || known[w] || STOP[key]) return;
      if (!out[key]) { out[key] = { word: w, count: 0 }; order.push(key); }
      out[key].count += 1;
    };
    var reAcro = /\b[A-Z][A-Za-z0-9]{1,12}\b/g;
    var m;
    while ((m = reAcro.exec(text)) !== null) {
      var w = m[0];
      /* 只收全大写缩写或带数字的型号，避免把普通英文单词误当术语 */
      if (/^[A-Z0-9]{2,}$/.test(w) || /[0-9]/.test(w)) push(w);
    }
    var reQuote = /[“"「『]([^”"」』]{2,20})[”"」』]/g;
    while ((m = reQuote.exec(text)) !== null) {
      if (/[\u4e00-\u9fa5]/.test(m[1]) || /^[A-Za-z][A-Za-z0-9 \-]+$/.test(m[1])) push(m[1].trim());
    }
    var list = order.map(function (k) { return out[k]; })
      .filter(function (o) { return o.count >= 1; });
    /* 去掉被更长候选包含的碎片：如 Retrieval Fusion 与 Retrieval/Fusion */
    list = list.filter(function (o) {
      return !list.some(function (other) {
        return other.word.length > o.word.length &&
          other.word.toLowerCase().indexOf(o.word.toLowerCase()) !== -1;
      });
    });
    return list.slice(0, 12);
  }

  /* ---------------- 主流程 ---------------- */
  function analyze(text) {
    var t = String(text || '');
    var clean = t.replace(/\r\n?/g, '\n');
    var hits = findHits(clean);
    var terms = summarize(hits);
    var ratio = densityOf(clean, hits);
    var level = levelOf(ratio);
    var chars = clean.replace(/\s+/g, '').length;
    return {
      text: clean,
      hits: hits,
      terms: terms,
      ratio: ratio,
      level: level,
      chars: chars,
      sentences: (clean.match(/[^。！？!?\n]+[。！？!?]?/g) || []).filter(function (s) { return s.trim(); }).length,
      domains: (function () {
        var d = {};
        terms.forEach(function (x) { d[x.domain] = (d[x.domain] || 0) + x.count; });
        return d;
      })(),
      summary: oneLineSummary(clean, terms),
      unlisted: unlistedCandidates(clean, {})
    };
  }

  function highlightHtml(analysis) {
    var text = analysis.text;
    var hits = analysis.hits;
    var html = '';
    var cursor = 0;
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      html += esc(text.slice(cursor, h.start));
      html += '<mark class="term" data-term="' + esc(h.term) + '" title="' + esc(h.term) + '">' + esc(text.slice(h.start, h.end)) + '</mark>';
      cursor = h.end;
    }
    html += esc(text.slice(cursor));
    return html;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toMarkdown(a) {
    var lines = [];
    lines.push('# 术语三档解释｜分析结果', '');
    lines.push('**一句话总结**：' + (a.summary || '（空）'), '');
    lines.push('**术语密度**：' + (a.ratio * 100).toFixed(1) + '%（' + a.level.label + '）｜' +
      a.chars + ' 字 / ' + a.sentences + ' 句 / 命中 ' + a.terms.length + ' 个术语', '');
    lines.push('## 术语卡', '');
    for (var i = 0; i < a.terms.length; i++) {
      var t = a.terms[i];
      var g = byTerm(t.term);
      if (!g) continue;
      lines.push('### ' + g.term + '（' + g.domain + '）出现 ' + t.count + ' 次', '');
      lines.push('- **专家版**：' + g.expert);
      lines.push('- **通俗版**：' + g.plain);
      lines.push('- **类比**：' + g.analogy, '');
    }
    if (a.unlisted && a.unlisted.length) {
      lines.push('## 未收录候选（建议补进术语库）', '');
      lines.push(a.unlisted.map(function (u) { return u.word + '(' + u.count + ')'; }).join('、'), '');
    }
    return lines.join('\n');
  }

  function byTerm(term) {
    for (var i = 0; i < GLOSSARY.length; i++) if (GLOSSARY[i].term === term) return GLOSSARY[i];
    return null;
  }

  function stats() {
    var domains = {};
    for (var i = 0; i < GLOSSARY.length; i++) {
      domains[GLOSSARY[i].domain] = (domains[GLOSSARY[i].domain] || 0) + 1;
    }
    return { terms: GLOSSARY.length, domains: domains, domainCount: Object.keys(domains).length };
  }

  var api = {
    GLOSSARY: GLOSSARY,
    analyze: analyze,
    findHits: findHits,
    summarize: summarize,
    densityOf: densityOf,
    levelOf: levelOf,
    highlightHtml: highlightHtml,
    toMarkdown: toMarkdown,
    byTerm: byTerm,
    stats: stats,
    unlistedCandidates: unlistedCandidates,
    version: '0.3.0'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TermLens = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
