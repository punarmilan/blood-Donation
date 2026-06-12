import Razorpay from 'razorpay';

export default new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SNw35MkokY8h1y',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '5swKLrcRVYl1bc512r868sqP'
});
