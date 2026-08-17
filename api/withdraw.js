export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { phone, amount, network } = req.body;

  if (!phone || !amount || amount < 1) {
    return res.status(400).json({ error: 'Valid phone and amount required' });
  }

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) {
    return res.status(500).json({ error: 'Server not configured - missing PAYSTACK_SECRET_KEY' });
  }

  try {
    // Step 1: Create recipient for Ghana Mobile Money
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'mobile_money',
        name: phone,
        account_number: phone,
        bank_code: network === 'vodafone' ? 'VOD' : network === 'airteltigo' ? 'ATL' : 'MTN',
        currency: 'GHS'
      }),
    });

    const recipientData = await recipientRes.json();
    if (!recipientRes.ok || !recipientData.data) {
      throw new Error(recipientData.message || 'Failed to create recipient');
    }

    // Step 2: Send money
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amount * 100),
        recipient: recipientData.data.recipient_code,
        reason: `Lambamba withdrawal GHS ${amount}`
      }),
    });

    const transferData = await transferRes.json();
    if (!transferRes.ok) {
      throw new Error(transferData.message || 'Transfer failed');
    }

    return res.status(200).json({ success: true, message: `GHS ${amount} sent to ${phone}`, data: transferData.data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}