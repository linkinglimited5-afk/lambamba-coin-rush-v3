let withdrawals = global.withdrawals || [];
global.withdrawals = withdrawals;

export default function handler(req, res) {
  if (req.method === 'PUT') {
    const { id, action } = req.body;
    const item = withdrawals.find(w => w.id === id);
    if(item) item.status = action;
    return res.json(item);
  }
  if (req.method === 'GET') {
    return res.json(withdrawals);
  }
  // POST = new withdrawal request
  const { amount, phone } = req.body;
  if (parseFloat(amount) < 50) {
    return res.status(400).json({ message: 'Minimum withdrawal is GHS 50. Keep playing!' });
  }
  const newReq = {
    id: Date.now().toString(),
    amount: parseFloat(amount),
    payAmount: parseFloat(amount) - 2,
    phone,
    status: 'pending',
    date: new Date().toLocaleString()
  };
  withdrawals.unshift(newReq);
  global.withdrawals = withdrawals;
  return res.json({ message: `Request GHS ${amount} sent! You get GHS ${newReq.payAmount} (GHS 2 fee). Within 24h.` });
}