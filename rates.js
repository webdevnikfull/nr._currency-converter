/* Provider responses retain the original quote precision and publication time. */
(() => {
  'use strict';
  const sources = {
    market:{name:'Twelve Data', url:'https://twelvedata.com/forex'},
    reference:{name:'Frankfurter', url:'https://frankfurter.dev/'}
  };
  function validateMarket(data,base,quote,now = Date.now()) {
    if (data?.status === 'error') throw Error(Number(data.code) === 429 ? 'limit' : [401,403].includes(Number(data.code)) ? 'access' : 'failed');
    if (data?.symbol !== `${base}/${quote}` || typeof data.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0 || !Number.isInteger(data.timestamp) || data.timestamp <= 0 || data.timestamp * 1000 > now + 300000) throw Error('invalidRate');
    return {base,quote,rate:data.rate,timestamp:data.timestamp,date:new Date(data.timestamp*1000).toISOString(),source:'market',fetchedAt:now,cached:false};
  }
  function validateReference(data,base,quote,now = Date.now()) {
    const date = data?.date;
    if (typeof data?.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date > new Date(now).toISOString().slice(0,10)) throw Error('invalidRate');
    if ((data.base && data.base.toUpperCase() !== base) || (data.quote && data.quote.toUpperCase() !== quote)) throw Error('invalidRate');
    return {base,quote,rate:data.rate,date,source:'reference',fetchedAt:now,cached:false};
  }
  async function fetchRate({base,quote,source,key,endpoint,signal}) {
    let url;
    if (source === 'market') {
      if (endpoint) {
        url = new URL(endpoint); if (url.protocol !== 'https:') throw Error('access');
        url.searchParams.set('symbol',`${base}/${quote}`);
      } else {
        if (!key) throw Error('keyRequired');
        url = new URL('https://api.twelvedata.com/exchange_rate');
        url.searchParams.set('symbol',`${base}/${quote}`); url.searchParams.set('apikey',key);
      }
    } else url = `https://api.frankfurter.dev/v2/rate/${base.toLowerCase()}/${quote.toLowerCase()}`;
    const response = await fetch(url,{signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if (response.status === 429) throw Error('limit');
    if ([401,403].includes(response.status)) throw Error('access');
    if (!response.ok) throw Error('failed');
    const data = await response.json();
    return source === 'market' ? validateMarket(data,base,quote) : validateReference(data,base,quote);
  }
  window.CurrencyRates = {sources,validateMarket,validateReference,fetchRate};
})();
