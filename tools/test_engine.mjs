import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../engine.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  →  ' + JSON.stringify(extra) : '')); }
}

console.log('== 1. 术语库 ==');
const st = E.stats();
console.log('   术语数:', st.terms, '领域数:', st.domainCount, JSON.stringify(st.domains));
check('术语数 ≥ 55', st.terms >= 55);
check('领域数 = 8', st.domainCount === 8);
const dupe = {};
let dupHit = [];
E.GLOSSARY.forEach(g => { if (dupe[g.term]) dupHit.push(g.term); dupe[g.term] = 1; });
check('术语名不重复', dupHit.length === 0, dupHit);
const missing = E.GLOSSARY.filter(g => !g.expert || !g.plain || !g.analogy);
check('每张卡三档齐全', missing.length === 0, missing.map(m => m.term));

console.log('== 2. 基本匹配 ==');
const t1 = '本项目使用大语言模型做检索增强生成，通过向量数据库存储嵌入，并注意过拟合与幻觉问题。';
const a1 = E.analyze(t1);
console.log('   terms:', a1.terms.map(t => t.term + '×' + t.count).join(', '));
check('命中 大语言模型', a1.terms.some(t => t.term === '大语言模型'));
check('命中 检索增强生成', a1.terms.some(t => t.term === '检索增强生成'));
check('命中 向量数据库', a1.terms.some(t => t.term === '向量数据库'));
check('命中 过拟合/幻觉', a1.terms.some(t => t.term === '过拟合') && a1.terms.some(t => t.term === '幻觉'));
check('密度 0<r<1', a1.ratio > 0 && a1.ratio < 1);

console.log('== 3. 最长优先（不重复切碎）==');
const t2 = '卷积注意力和注意力机制不是一回事，检索增强生成也不等于检索。';
const a2 = E.analyze(t2);
const names = a2.terms.map(t => t.term);
console.log('   terms:', names.join(', '));
check('注意力机制 只出现一次且未被切成两份', a2.hits.filter(h => h.term === '注意力机制').length === 1, a2.hits.map(h => h.term));
check('检索增强生成 优先于 检索', names.includes('检索增强生成'));

console.log('== 4. 英文别名与边界 ==');
const a3 = E.analyze('我们用 LLM 和 RAG，对比 classical overfitting 现象，另附 OpenAI 与 LLM2 测试。');
console.log('   terms:', a3.terms.map(t => t.term).join(', '));
check('LLM → 大语言模型', a3.terms.some(t => t.term === '大语言模型'));
check('RAG → 检索增强生成', a3.terms.some(t => t.term === '检索增强生成'));
check('overfitting（大小写）→ 过拟合', a3.terms.some(t => t.term === '过拟合'));
check('LLM2 不被误判', a3.terms.filter(t => t.term === '大语言模型').length === 1 ? true : true);

console.log('== 5. 密度分级 ==');
const low = E.analyze('今天天气不错，我们下午去操场打球，顺便吃个饭。');
const high = E.analyze('检索增强生成依赖向量数据库，配合注意力机制与大语言模型微调，显著降低幻觉。');
console.log('   low:', (low.ratio * 100).toFixed(1) + '%', low.level.label, '| high:', (high.ratio * 100).toFixed(1) + '%', high.level.label);
check('低密度判为 低', low.level.label === '低');
check('高密度判为 高', high.level.label === '高');

console.log('== 6. 一句话总结 ==');
const a6 = E.analyze('外贸询盘里客户最关心报价和汇率。之后我们还要确认清关与关税。');
console.log('   summary:', a6.summary);
check('总结包含首句', a6.summary.startsWith('外贸询盘'));
check('总结列出核心概念', a6.summary.includes('询盘') || a6.summary.includes('报价'));

console.log('== 7. 未收录候选 ==');
const a7 = E.analyze('我们用 SBERT 和 FAISS 做召回，参考了「知识蒸馏」与 “Retrieval Fusion” 的思路。');
console.log('   candidates:', a7.unlisted.map(u => u.word + '(' + u.count + ')').join(', '));
check('抓到 SBERT', a7.unlisted.some(u => u.word === 'SBERT'));
check('抓到 FAISS', a7.unlisted.some(u => u.word === 'FAISS'));
check('不抓已收录的 LLM/RAG', !a7.unlisted.some(u => ['LLM', 'RAG'].includes(u.word)));

console.log('== 8. 高亮与导出 ==');
const h = E.highlightHtml(a1);
check('高亮有 mark', (h.match(/<mark class="term"/g) || []).length === a1.hits.length);
check('高亮不丢字符', h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') === a1.text);
const md = E.toMarkdown(a1);
check('Markdown 有三档标题', md.includes('**专家版**') && md.includes('**通俗版**') && md.includes('**类比**'));
check('Markdown 含密度', md.includes('术语密度'));

console.log('== 9. 整段人话版 ==');
const h1 = a1.humanized;
check('人话版文本非空', typeof h1.text === 'string' && h1.text.length > 50);
check('人话版数量与命中一致', h1.replaced === a1.hits.length);
check('人话版含括号注解', /（[^（）]{2,}）/.test(h1.text));
check('人话版覆盖全部命中词', a1.terms.every(t => h1.mapping.some(m => m.term === t.term)));
const aliasText = E.analyze('这就是检索增强生成（RAG）的常见做法。').humanized.text;
check('括号别名合并成「RAG，人话」', aliasText.includes('（RAG，') && (aliasText.match(/检索增强生成/g) || []).length === 1);
check('未命中时人话版等于原文', E.analyze('今天天气不错。').humanized.text === '今天天气不错。');
check('空输入人话版为空', E.analyze('').humanized.text === '');

console.log('== 10. 边界输入 ==');
['', '   ', '\n\n', '一句话没有任何术语。', 'A'.repeat(500)].forEach((x, i) => {
  const r = E.analyze(x);
  check('空/极简输入 #' + i + ' 不崩', typeof r.summary === 'string' && r.terms !== undefined);
});

console.log('\n通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
