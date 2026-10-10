/* Pure calculations are shared by both apps and can also run in Node. */
(function (root) {
 'use strict';
 function parseAmount(value) {
  const normalized=String(value).trim().replace(/[\s\u00a0\u202f]/g,'').replace(',','.');
  if (!/^\d+(?:\.\d{1,8})?$/.test(normalized)) return null;
  const number=Number(normalized);
  return Number.isFinite(number)&&number<=1e12?number:null;
 }
 function convert(amount,rate) {
  if (!Number.isFinite(amount)||amount<0||!Number.isFinite(rate)||rate<=0) throw new Error('Invalid conversion');
  return amount*rate;
 }
 function analyze(text,locale='pl') {
  const words=[...text.matchAll(/[\p{L}\p{N}]+(?:['’ʼ\-][\p{L}\p{N}]+)*/gu)].map(m=>m[0]);
  const graphemes=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(locale,{granularity:'grapheme'}).segment(text)].map(s=>s.segment):Array.from(text);
  const sentences=text.trim()?text.split(/[.!?…]+(?:[\s\n]+|$)/u).filter(s=>/[\p{L}\p{N}]/u.test(s)).length:0;
  const paragraphs=text.trim()?text.trim().split(/\n\s*\n/u).filter(s=>s.trim()).length:0;
  const frequency=new Map();
  for (const word of words) { const key=word.toLocaleLowerCase(locale); frequency.set(key,(frequency.get(key)||0)+1); }
  const top=[...frequency].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],locale)).slice(0,10);
  return {words:words.length,characters:graphemes.length,noSpaces:graphemes.filter(c=>!/^\s+$/u.test(c)).length,sentences,paragraphs,reading:Math.ceil(words.length/200),unique:frequency.size,top};
 }
 const api={parseAmount,convert,analyze};
 if (typeof module==='object'&&module.exports) module.exports=api;
 else root.PortfolioTools=api;
})(typeof globalThis==='object'?globalThis:this);
