const express = require("express")
const router = express.Router()
const dotenv = require('dotenv')
const axios = require('axios')
const crypto = require('crypto')
const PAYMONGO_KEY = process.env.PAYMONGO_API_KEY
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET

dotenv.config()

const { verifyToken } = require("./verify.js")

router.get("/checkpistat", verifyToken, async (req, res) => {
    const { piid } = req.query
    console.log("checkoutSessionsId:",piid);
    
    const auth = Buffer.from(PAYMONGO_KEY + ':').toString('base64')
    const options = {
    method: 'GET',
    url: `https://api.paymongo.com/v1/payment_intents/${piid}`,
    headers: {
        accept: 'application/json',
        authorization: `Basic ${auth}`
    }
    };

    axios
    .request(options)
    .then((response) => {
        console.log(response.data)
        return res.status(200).json(response.data);
    })
    .catch(err => console.log(err));
})

router.post('/create-checkout-session' ,verifyToken, async (req,res) => {
    const {items} = req.body    
    const io = req.app.get('io')
    const auth = Buffer.from(PAYMONGO_KEY + ':').toString('base64')
    
    const line_items = items.map(item => ({
        currency: 'PHP',
        amount: Math.round(Number(item.sell_price) * 100),
        name: item.description,
        quantity: item.quantity       
    }))

    const options = {
    method: 'POST',
    url: 'https://api.paymongo.com/v1/checkout_sessions',
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${auth}`
    },
    data: {
        data: {
        attributes: {
            line_items,
            payment_method_types: ['gcash', 'paymaya'],
            send_email_receipt: false,
            show_description: false,
            show_line_items: true,
            statement_descriptor: 'TIA STORE'
        }
        }
    }
    }

    axios
    .request(options)
    .then((response) => {
        // console.log(response.data)
        return res.status(200).json(response.data);
    })
    .catch((err) => {
        console.error(err)
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    })       
})

router.post(
  '/api/paymongo/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signatureHeader = req.headers['paymongo-signature'];
    if (!signatureHeader) return res.status(400).send('Missing signature');

    
    const tMatch = signatureHeader.match(/t=(\d+)/);
    const teMatch = signatureHeader.match(/te=([^,]+)/);
    if (!tMatch || !teMatch) return res.status(400).send('Invalid signature format');

    const timestamp = tMatch[1];
    const receivedSignature = teMatch[1];
    
    const signedPayload = `${timestamp}.${req.body.toString()}`;
    const expectedSignature = crypto
      .createHmac('sha256', PAYMONGO_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');

    if (receivedSignature !== expectedSignature) {
      console.log('❌ Signature mismatch');
      console.log('Received:', receivedSignature);
      console.log('Expected:', expectedSignature);
      return res.status(401).send('Invalid signature');
    }

    const rawBody = req.body.toString();
    let event;

    try {
    event = JSON.parse(rawBody);
    } catch (err) {
    console.error("Failed to parse webhook body:", rawBody, err);
    return res.status(400).send("Invalid JSON");
    }

    // console.log("Full webhook payload:", JSON.stringify(event, null, 2));
    // console.log(event.data.attributes.type);
    const io = req.app.get('io')
    switch (event.data.attributes.type) {
      case 'payment.paid':        
        break;

      case 'payment.failed':
        handleCheckoutFailed(event.data,io)
        break;

      case 'checkout_session.payment.paid':     
        handleCheckoutPaid(event.data,io)   
        break;

      case 'checkout_session.payment.failed':        
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ message: "success" });
  }
);

function handleCheckoutPaid(data,io) {
    const paymentIntent = data.attributes.data.attributes.payment_intent.id
    const methodUsed = data.attributes.data.attributes.payment_method_used
    const paidAmount = data.attributes.data.attributes.payments[0].attributes.amount

    // console.log('✅ Checkout paid:', paymentIntent , " METHOD USED:", methodUsed)
    io.to(paymentIntent).emit('payment-success', {
        paymentIntent,
        methodUsed,
        paidAmount,
        status: 'PAID'
    })
}

function handleCheckoutFailed(data,io) {
    // console.log('❌ Checkout failed:', data)
    const paymentIntent = data.attributes.data.attributes.payment_intent_id
    const methodUsed = data.attributes.data.attributes.source.type
    io.to(paymentIntent).emit('payment-failed', {
        paymentIntent,
        methodUsed,
        status: 'FAILED'
    })
}

module.exports = router