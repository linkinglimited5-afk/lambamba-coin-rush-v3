export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, momoName, momoNumber, network } = req.body;

    if (!amount || !momoNumber) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    if (amount < 20) {
      return res.status(400).json({ error: 'Minimum GHS 20' });
    }

    // TODO: Add Paystack transfer here later
    // For now, simulate success so frontend works

    return res.status(200).json({ 
      success: true, 
      message: `Withdrawal of GHS ${amount} to ${momoNumber} queued!`,
      amount: amount
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}