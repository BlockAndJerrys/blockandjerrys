/*
   server.js - server with websockets for real time communication
   2018 Robert Durst
   https://github.com/robertDurst/blockandjerrys
*/

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const {
  Order,
  Icecream,
  OrderIcecream,
} = require('./utils/postgres');
const lightning = require('./utils/lightning');
const routes = require('./utils/routes');
const twilio = require('./utils/twilio');
const { getBtcPrice, btcToSat } = require('./utils/getBtcPrice');

app.use(routes);

let coneCount = 0;
let cart = [];
let btcPrice;

const invoiceSocketMap = {};
const call = lightning.streamInvoices();

// lightning network event listener
call.on('data', async (data) => {
  const invoice = data.payment_request;
  const o = await Order.findOne({ where: { invoice } });
  await o.update({ status: 'paid' });
  const oi = await OrderIcecream.findAll({ where: { order_id: o.id }, include: [{ model: Icecream }] });
  coneCount = await OrderIcecream.coneCount();
  invoiceSocketMap[invoice].socket.emit('PAID');
  io.emit('CONE_UPDATE', { coneCount }); // TODO: This only emits to the purchasing socket, not all sockets as would be expected

  twilio.messages.create({
    to: o.phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: 'Your Lightning Network payment has been accepted 🍦 Your ETA is being calculated 🧐',
  });

  const msg = {
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `Order paid\nid: ${o.id}\nAddress: ${o.address}\nPhone: ${o.phone}\nName: ${o.name}\n===========`,
  };
  oi.forEach(x => msg.body += `\n${x.quantity} ${x.icecream.flavor}`);
  msg.to = process.env.JEFF_PHONE;
  twilio.messages.create(msg);
  msg.to = process.env.ROB_PHONE;
  twilio.messages.create(msg);
});

// call.on('end', () => {
//   // The server has finished sending
// });
// call.on('status', () => {
//   // Process status
// });

// socketio event listener
io.on('connection', (socket) => {
  console.log('New connect');
  socket.emit('INIT', { coneCount, cart, btcPrice });
  console.log('INIT CALLED');
  socket.on('GENERATE_INVOICE', async ({ name, address, phone, cartTotal, cartOrder }) => {
    const btcCartTotal = parseFloat(cartTotal) / (await getBtcPrice()) / btcToSat;
    const invoiceData = (new Date()).getTime() + name + address + phone;
    const genInvoice = await lightning.generateInvoice(btcCartTotal, `Block and Jerry's for ${name}.`);
    const invoice = genInvoice.payment_request;
    const o = await Order.create({ name, address, phone, invoice });
    invoiceSocketMap[invoice] = { socket, order_id: o.id };
    socket.emit('INVOICE', { invoice });
    cartOrder.forEach(x => {
      if (x.quantity > 0) {
        OrderIcecream.create({
          order_id: o.id,
          icecream_id: x.id,
          quantity: x.quantity,
        });
      }
    });
  });
  socket.on('EMAIL', async ({ email, phone }) => {
    const o = await Order.findOne({ where: { phone } });
    await o.update({ email });
  });
});

async function init() {
  // Since this is centralized, only need to get cone count on init
  coneCount = await OrderIcecream.coneCount();
  cart = await Icecream.cart();
  btcPrice = await getBtcPrice();
}

http.listen(5000, () => {
  console.log('SERVER RUNNING');
  init();
});
