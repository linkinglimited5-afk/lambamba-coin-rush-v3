module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { amount, momo_number, name, network } = req.body;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'No Paystack key' });
    let code = 'MTN';
    if (network === 'vod') code = 'VOD';
    if (network === 'atl' || network === 'tigo') code = 'ATL';
    const r1 = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mobile_money', name: name, account_number: momo_number, bank_code: code, currency: 'GHS' })
    });
    const d1 = await r1.json();
    if (!d1.status) return res.status(400).json({ success: false, message: d1.message, data: d1 });
    const r2 = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'balance', amount: Math.round(Number(amount) * 100), recipient: d1.data.recipient_code, reason: 'Lambamba payout' })
    });
    const d2 = await r2.json();
    if (!d2.status) return res.status(400).json({ success: false, message: d2.message, data: d2 });
    return res.json({ success: true, data: d2.data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};