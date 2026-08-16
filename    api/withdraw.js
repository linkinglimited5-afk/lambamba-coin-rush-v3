module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { accountNumber, bank, amount } = req.body || {};
    if (!accountNumber || !bank || !amount) return res.status(400).json({ error: 'Missing fields' });
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'No Paystack Key' });

    const vRes = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bank}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    const vData = await vRes.json();
    if (!vData.status) return res.status(400).json({ error: 'Invalid account' });

    const rRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'nuban', name: vData.data.account_name, account_number: accountNumber, bank_code: bank, currency: 'GHS' })
    });
    const rData = await rRes.json();
    if (!rData.status) return res.status(400).json({ error: rData.message });

    const tRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'balance', amount: Math.round(parseFloat(amount)*100), recipient: rData.data.recipient_code, reason: 'Lambamba Withdrawal' })
    });
    const tData = await tRes.json();
    if (tData.status) return res.status(200).json({ success: true, data: tData.data });
    return res.status(400).json({ error: tData.message });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};