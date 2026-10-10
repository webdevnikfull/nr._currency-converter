(() => {
 'use strict';
 const UI=window.ToolUI,core=window.PortfolioTools;
 const codes=['PLN','EUR','USD','UAH','GBP','CHF','CZK','SEK','NOK','CAD'];
 const from=document.getElementById('from'),to=document.getElementById('to'),amount=document.getElementById('amount'),result=document.getElementById('result'),rateLabel=document.getElementById('rate'),status=document.getElementById('status');
 for (const select of [from,to]) for (const code of codes) {const option=document.createElement('option');option.value=code;option.textContent=code;select.append(option)}
 const preferences=UI.storage.get('nr-currency-preferences',{});
 from.value=codes.includes(preferences.from)?preferences.from:'EUR';to.value=codes.includes(preferences.to)?preferences.to:'PLN';
 let current=null,controller=null,version=0,amountTimer;
 let records=UI.storage.get('nr-currency-history',[]);
 if (!Array.isArray(records)) records=[];
 records=records.filter(r=>r&&codes.includes(r.from)&&codes.includes(r.to)&&Number.isFinite(r.amount)&&Number.isFinite(r.result)&&typeof r.date==='string').slice(0,10);
 const format=(value,code)=>new Intl.NumberFormat(UI.locale,{style:'currency',currency:code,maximumFractionDigits:2}).format(value);
 function setStatus(key,error=false){status.textContent=key?UI.t(key):'';status.classList.toggle('error',error)}
 function renderHistory(){const list=document.getElementById('history');list.replaceChildren();document.getElementById('history-empty').hidden=records.length>0;document.getElementById('clear-history').hidden=records.length===0;for(const record of records){const li=document.createElement('li');li.textContent=`${format(record.amount,record.from)} → ${format(record.result,record.to)}`;const small=document.createElement('small');small.textContent=`${UI.t('rateDate')}: ${record.date}${record.cached?' · '+UI.t('cached'):''}`;li.append(small);list.append(li)}}
 function calculate(){const value=core.parseAmount(amount.value);amount.setAttribute('aria-invalid',String(value===null));if(value===null){result.textContent='—';setStatus('invalid',true);return false}if(!current||current.base!==from.value||current.quote!==to.value){result.textContent='—';return false}result.textContent=format(core.convert(value,current.rate),to.value);rateLabel.textContent=from.value===to.value?UI.t('same'):`1 ${from.value} = ${new Intl.NumberFormat(UI.locale,{maximumFractionDigits:6}).format(current.rate)} ${to.value} · ${UI.t('rateDate')}: ${current.date}`;setStatus(current.cached?'cached':null);return true}
 async function loadRate(save=false){
  const thisVersion=++version;controller?.abort();controller=new AbortController();const requestController=controller;current=null;result.textContent='—';rateLabel.textContent='';
  const base=from.value,quote=to.value;UI.storage.set('nr-currency-preferences',{from:base,to:quote});
  if(core.parseAmount(amount.value)===null){calculate();return}
  if(base===quote) current={base,quote,rate:1,date:new Date().toISOString().slice(0,10),cached:false};
  else {
   setStatus('loading');const timeout=setTimeout(()=>requestController.abort(),10000);
   try {
    const response=await fetch(`https://api.frankfurter.dev/v2/rate/${base.toLowerCase()}/${quote.toLowerCase()}`,{signal:requestController.signal,cache:'no-store'});
    if(!response.ok)throw new Error('Rate unavailable');const data=await response.json();
    if(!Number.isFinite(data.rate)||data.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(data.date))throw new Error('Invalid rate');
    if(thisVersion!==version)return;
    current={base,quote,rate:data.rate,date:data.date,cached:false};UI.storage.set(`nr-rate-${base}-${quote}`,current);
   } catch(error) {
    if(thisVersion!==version)return;
    const cached=UI.storage.get(`nr-rate-${base}-${quote}`);
    if(cached&&cached.base===base&&cached.quote===quote&&Number.isFinite(cached.rate)&&cached.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(cached.date))current={...cached,cached:true};
    else {setStatus('failed',true);return}
   } finally {clearTimeout(timeout)}
  }
  if(thisVersion!==version)return;
  if(calculate()&&save)saveResult();
 }
 function saveResult(){if(!calculate())return;const value=core.parseAmount(amount.value);records.unshift({from:from.value,to:to.value,amount:value,result:core.convert(value,current.rate),date:current.date,cached:current.cached});records=records.slice(0,10);UI.storage.set('nr-currency-history',records);renderHistory();if(!current.cached)setStatus('saved')}
 document.getElementById('converter').addEventListener('submit',event=>{event.preventDefault();if(current&&current.base===from.value&&current.quote===to.value)saveResult();else loadRate(true)});
 amount.addEventListener('input',()=>{clearTimeout(amountTimer);if(current)calculate();else if(core.parseAmount(amount.value)===null){amount.setAttribute('aria-invalid','true');setStatus('invalid',true)}else{amount.setAttribute('aria-invalid','false');amountTimer=setTimeout(()=>loadRate(),250)}});
 from.addEventListener('change',()=>loadRate());to.addEventListener('change',()=>loadRate());
 document.getElementById('swap').addEventListener('click',()=>{[from.value,to.value]=[to.value,from.value];loadRate()});
 document.getElementById('refresh').addEventListener('click',()=>loadRate());
 document.getElementById('clear-history').addEventListener('click',()=>{records=[];UI.storage.set('nr-currency-history',records);renderHistory()});
 window.addEventListener('tool-languagechange',()=>{renderHistory();if(current)calculate();else loadRate()});
 renderHistory();loadRate();
})();
