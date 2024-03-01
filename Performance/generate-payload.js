'use strict';

module.exports.generatePayload = (context, events, done) => {
  context.vars.payload = {
    customerId: `customer${Math.floor(Math.random() * 1000)}`,
    orderId: `order${Math.floor(Math.random() * 100000)}`,
    items: [{ productId: "product789", quantity: 1 }],
    totalAmount: Math.floor(Math.random() * 1000)
  };
  return done();
};
