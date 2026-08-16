export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountNumber, bank, amount } = req.body;

    if (!accountNumber || !bank || !amount) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    
    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ error: 'Server not configured' });
    }

    // 1. Verify account name
    const verifyRes = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bank}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    
    const verifyData = await verifyRes.json();
    if (!verifyData.status) {
      return res.status(400).json({ error: 'Invalid account number' });
    }

    // 2. Create recipient
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nuban',
        name: verifyData.data.account_name,
        account_number: accountNumber,
        bank_code: bank,
        currency: 'GHS'
      })
    });

    const recipientData = await recipientRes.json();
    if (!recipientData.status) {
      return res.status(400).json({ error: recipientData.message });
    }

    // 3. Transfer
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(parseFloat(amount) * 100),
        recipient: recipientData.data.recipient_code,
        reason: 'Lambamba Coin Rush Withdrawal'
      })
    });

    const transferData = await transferRes.json();
    
    if (transferData.status) {
      return res.status(200).json({ success: true, message: 'Transfer initiated', data: transferData.data });
    } else {
      return res.status(400).json({ error: transferData.message });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}