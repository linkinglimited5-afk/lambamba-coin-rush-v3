export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { phone, amount, network } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ error: 'Phone and amount required' });
    console.log('Withdraw:', { phone, amount, network });
    return res.status(200).json({ success: true, message: 'Withdrawal queued', transactionId: 'TXN' + Date.now() });
  } catch (e) {
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
}