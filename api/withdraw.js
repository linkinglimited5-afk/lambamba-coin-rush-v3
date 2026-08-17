export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const { phone, amount } = req.body || {};
  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone and amount required' });
  }
  return res.status(200).json({ success: true, message: 'Withdraw API is working!' });
}