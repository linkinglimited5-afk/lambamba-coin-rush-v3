const https = require('https');
module.exports = async function(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const key = process.env.PAYSTACK_SECRET_KEY;
      const code = data.network === 'vod' ? 'VOD' : data.network === 'atl' ? 'ATL' : 'MTN';
      const post = (path, payload) => new Promise((ok, fail) => {
        const b = JSON.stringify(payload);
        const r = https.request({ hostname: 'api.paystack.co', path, method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Content-Length': b.length }}, resp => {
          let d=''; resp.on('data', c=>d+=c); resp.on('end', ()=>ok(JSON.parse(d)));
        });
        r.on('error', fail); r.write(b); r.end();
      });
      const r1 = await post('/transferrecipient', { type: 'mobile_money', name: data.name, account_number: data.momo_number, bank_code: code, currency: 'GHS' });
      if (!r1.status) return res.json({ success:false, message:r1.message });
      const r2 = await post('/transfer', { source:'balance', amount:Math.round(data.amount*100), recipient:r1.data.recipient_code, reason:'Lambamba' });
      return res.json(r2.status ? { success:true } : { success:false, message:r2.message });
    } catch(e){ return res.json({ success:false, error:e.message }); }
  });
};