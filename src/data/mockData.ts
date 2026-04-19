export const MOCK_CHAT_HISTORY = [
  {
    id: '1',
    role: 'ai' as const,
    content: '您好！我是大闸蟹精准养殖智能决策助手。请问有什么我可以帮您的？您可以直接提问，或者点击右侧的快捷问题。',
    timestamp: new Date().toISOString(),
  }
];

export const QUICK_QUESTIONS = [
  "如何判断大闸蟹即将蜕壳？",
  "池塘溶氧量低怎么办？",
  "当前季节应该投喂什么饲料？",
  "发现大闸蟹有黑鳃病怎么处理？"
];

export const GROWTH_STAGES = [
  { id: 'stage-1', name: '扣蟹入池', months: [2, 3], description: '放养准备与早期适应' },
  { id: 'stage-2', name: '第一次蜕壳', months: [4], description: '体质恢复与促生长' },
  { id: 'stage-3', name: '第二次蜕壳', months: [5], description: '水草培育与营养强化' },
  { id: 'stage-4', name: '第三次蜕壳', months: [6], description: '高温期前准备' },
  { id: 'stage-5', name: '第四次蜕壳', months: [7], description: '度夏与溶氧管理' },
  { id: 'stage-6', name: '第五次蜕壳', months: [8], description: '最后冲刺与育肥' },
  { id: 'stage-7', name: '成熟采收', months: [9, 10, 11], description: '品质提升与捕捞上市' }
];

export const STAGE_ADVICE = {
  'stage-1': {
    feeding: '投喂高蛋白配合饲料（蛋白含量40%以上），辅以少量冰鲜鱼，每日投喂量为蟹体重的1-2%。',
    water: '水位保持在60-80cm，透明度30-40cm，pH值7.5-8.5，溶氧量>5mg/L。',
    disease: '重点预防纤毛虫病和肠炎。入池前用生石灰或漂白粉彻底清塘，蟹种用3-5%食盐水浸泡消毒。'
  },
  'stage-2': {
    feeding: '增加植物性饵料比例，如南瓜、煮熟的玉米等，保持蛋白含量在38%左右。',
    water: '逐渐加深水位至80-100cm，注意补充钙磷等微量元素，促进蜕壳。',
    disease: '注意观察蜕壳情况，预防蜕壳不遂。保持水质清新，避免使用刺激性强的药物。'
  },
  'stage-3': {
    feeding: '增加动物性饵料，如螺蛳、小鱼虾，促进营养积累。',
    water: '保持水体高溶氧，定期使用微生态制剂调节水质。',
    disease: '重点预防黑鳃病和水肿病，定期巡塘观察。'
  }
};

export const MARKET_DATA = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    '2两母': 45 + Math.random() * 10 + (i * 0.5),
    '3两公': 55 + Math.random() * 12 + (i * 0.6),
    '4两公': 80 + Math.random() * 15 + (i * 0.8),
  };
});
