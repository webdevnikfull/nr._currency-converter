(() => {
 'use strict';
 const UI=window.ToolUI,core=window.PortfolioTools,Rates=window.CurrencyRates,$=id=>document.getElementById(id);
 const t=k=>(window.CurrencyRateText[UI.lang]||window.CurrencyRateText.pl)[k]||UI.t(k);
 const codes=['PLN','EUR','USD','UAH','GBP','CHF','CZK','SEK','NOK','CAD'];
 const from=$('from'),to=$('to'),amount=$('amount'),result=$('result'),source=$('rate-source'),keyField=$('market-key');
 for(const select of [from,to])for(const code of codes){const option=document.createElement('option');option.value=option.textContent=code;select.append(option)}
 const prefs=UI.storage.get('nr-currency-preferences',{});
 from.value=codes.includes(prefs?.from)?prefs.from:'EUR';to.value=codes.includes(prefs?.to)?prefs.to:'PLN';source.value=prefs?.source==='reference'?'reference':'market';
 const endpoint=window.CurrencyRateConfig?.marketEndpoint||'';
 let key='',current=null,controller,version=0,amountTimer,lastActive=Date.now(),blockedUntil=0,statusKey='',statusError=false;
 const liveCache=new Map();
 let records=UI.storage.get('nr-currency-history',[]);
 if(!Array.isArray(records))records=[];
 records=records.filter(r=>r&&codes.includes(r.from)&&codes.includes(r.to)&&Number.isFinite(r.amount)&&Number.isFinite(r.result)&&typeof r.date==='string').slice(0,10);
 const format=(v,c)=>new Intl.NumberFormat(UI.locale,{style:'currency',currency:c,maximumFractionDigits:2}).format(v);
 const formatTime=s=>new Intl.DateTimeFormat(UI.locale,{dateStyle:'short',timeStyle:'medium'}).format(new Date(s*1000));
 function setStatus(k='',error=false){statusKey=k;statusError=error;$('status').textContent=k?t(k):'';$('status').classList.toggle('error',error)}
 function sourceName(q){return q?.source==='identity'?t('local'):Rates.sources[q?.source==='market'?'market':'reference'].name}
 function describe(q){
  if(q.source==='identity')return UI.t('same');
  const kind=q.source==='market'?t('marketType'):t('daily');
  return `${t('sourceLabel')}: ${sourceName(q)} · ${kind} · ${q.timestamp?t('quoteTime')+': '+formatTime(q.timestamp):UI.t('rateDate')+': '+q.date}${q.cached?' · '+t('cached'):''}`;
 }
 function updateSettings(){
  const market=source.value==='market';$('market-key-panel').hidden=!market||Boolean(endpoint);$('auto-panel').hidden=!market;$('disconnect-market').hidden=!key;
  $('source-note').textContent=t(market?'marketNote':'referenceNote');
  const provider=Rates.sources[source.value];$('source-link').textContent=`${provider.name} ↗`;$('source-link').href=provider.url;
  $('currency-intro').textContent=t('intro');document.querySelectorAll('[data-rate-i18n]').forEach(el=>{el.textContent=t(el.dataset.rateI18n)});
 }
 function renderHistory(){
  const list=$('history');list.replaceChildren();$('history-empty').hidden=records.length>0;$('clear-history').hidden=!records.length;
  for(const r of records){const li=document.createElement('li');li.textContent=`${format(r.amount,r.from)} → ${format(r.result,r.to)}`;const small=document.createElement('small');small.textContent=describe({...r,source:r.source||'reference'});li.append(small);list.append(li)}
 }
 function calculate(){
  const value=core.parseAmount(amount.value);amount.setAttribute('aria-invalid',String(value===null));
  if(value===null){result.textContent='—';$('rate').textContent='';setStatus('invalid',true);return false}
  if(!current||current.base!==from.value||current.quote!==to.value){result.textContent='—';return false}
  result.textContent=format(core.convert(value,current.rate),to.value);
  $('rate').textContent=current.source==='identity'?UI.t('same'):`1 ${current.base} = ${new Intl.NumberFormat(UI.locale,{maximumFractionDigits:8}).format(current.rate)} ${current.quote} · ${describe(current)}`;
  if(current.cached)setStatus('cached',true);
  else if(current.timestamp&&Date.now()-current.timestamp*1000>900000)setStatus('oldQuote');else setStatus();
  return true;
 }
 function reset(){version++;controller?.abort();controller=null;current=null;result.textContent='—';$('rate').textContent=''}
 function saveResult(){
  if(!calculate())return;
  const value=core.parseAmount(amount.value);
  records.unshift({from:from.value,to:to.value,amount:value,result:core.convert(value,current.rate),rate:current.rate,date:current.date,timestamp:current.timestamp,source:current.source,cached:current.cached});
  records=records.slice(0,10);UI.storage.set('nr-currency-history',records);renderHistory();
  if(!current.cached&&(!current.timestamp||Date.now()-current.timestamp*1000<900000))setStatus('saved');
 }
 async function loadRate(save=false){
  reset();const thisVersion=version,base=from.value,quote=to.value,selectedSource=source.value;
  UI.storage.set('nr-currency-preferences',{from:base,to:quote,source:selectedSource});updateSettings();
  if(core.parseAmount(amount.value)===null){calculate();return}
  if(base===quote){current={base,quote,rate:1,date:new Date().toISOString(),source:'identity',fetchedAt:Date.now(),cached:false};calculate();if(save)saveResult();return}
  if(selectedSource==='market'&&!key&&!endpoint){setStatus('keyRequired');$('rate-settings').open=true;return}
  if(selectedSource==='market'&&Date.now()<blockedUntil){setStatus('limit',true);return}
  controller=new AbortController();const requestController=controller,timeout=setTimeout(()=>requestController.abort(),12000);setStatus('loading');
  const cacheKey=`${base}/${quote}`;
  try{
   const data=await Rates.fetchRate({base,quote,source:selectedSource,key,endpoint,signal:requestController.signal});
   if(thisVersion!==version)return;current=data;
   if(selectedSource==='market')liveCache.set(cacheKey,data);else UI.storage.set(`nr-reference-${base}-${quote}`,data);
  }catch(error){
   if(thisVersion!==version)return;
   const errorKey=['limit','access','invalidRate','keyRequired'].includes(error.message)?error.message:'failed';
   if(errorKey==='limit')blockedUntil=Date.now()+61000;
   let cached;
   if(!['access','invalidRate','keyRequired'].includes(errorKey)){
    if(selectedSource==='market')cached=liveCache.get(cacheKey);
    else{const stored=UI.storage.get(`nr-reference-${base}-${quote}`);try{if(stored?.source==='reference'&&stored.base===base&&stored.quote===quote)cached=Rates.validateReference(stored,base,quote)}catch{}}
   }
   if(cached)current={...cached,cached:true};else{setStatus(errorKey,true);return}
  }finally{clearTimeout(timeout);if(thisVersion===version)controller=null}
  if(thisVersion!==version)return;if(calculate()&&save)saveResult();
 }
 $('converter').addEventListener('submit',e=>{e.preventDefault();lastActive=Date.now();if(current&&!current.cached&&(current.source!=='market'||Date.now()-current.fetchedAt<60000))saveResult();else loadRate(true)});
 amount.addEventListener('input',()=>{lastActive=Date.now();clearTimeout(amountTimer);if(current)calculate();else if(core.parseAmount(amount.value)===null)calculate();else if(!controller)amountTimer=setTimeout(()=>loadRate(),300)});
 for(const select of [from,to,source])select.addEventListener('change',()=>{lastActive=Date.now();loadRate()});
 $('swap').addEventListener('click',()=>{lastActive=Date.now();[from.value,to.value]=[to.value,from.value];loadRate()});
 $('refresh').addEventListener('click',()=>{lastActive=Date.now();loadRate()});
 $('connect-market').addEventListener('click',()=>{const entered=keyField.value.trim();if(!entered){setStatus('keyRequired',true);keyField.focus();return}key=entered;keyField.value='';blockedUntil=0;liveCache.clear();lastActive=Date.now();source.value='market';loadRate()});
 keyField.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('connect-market').click()}});
 $('disconnect-market').addEventListener('click',()=>{key='';keyField.value='';liveCache.clear();reset();updateSettings();setStatus('keyRequired');$('rate-settings').open=true});
 $('clear-history').addEventListener('click',()=>{records=[];UI.storage.set('nr-currency-history',records);renderHistory()});
 window.addEventListener('tool-languagechange',()=>{updateSettings();renderHistory();if(current)calculate();else setStatus(statusKey,statusError)});
 function autoRefresh(){
  if(document.hidden||!$('auto-refresh').checked||source.value!=='market'||(!key&&!endpoint)||controller||Date.now()-lastActive>300000||Date.now()<blockedUntil||from.value===to.value)return;
  if(!current||Date.now()-current.fetchedAt>=60000)loadRate();
 }
 setInterval(autoRefresh,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastActive=Date.now();autoRefresh()}});
 window.CurrencyStudio={getSnapshot(){return current&&core.parseAmount(amount.value)!==null?{...current,amount:core.parseAmount(amount.value),result:core.convert(core.parseAmount(amount.value),current.rate)}:null},describe,sourceName,t};
 renderHistory();updateSettings();loadRate();
})();
