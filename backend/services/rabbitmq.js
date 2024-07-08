require("dotenv").config();
const amqp = require("amqplib/callback_api");
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const queue = process.env.QUEUE_NAME;

let channel;

amqp.connect(RABBITMQ_URL, (err, connection) => {
  if (err) {
    throw err;
  }
  connection.createChannel((err, ch) => {
    if (err) {
      throw err;
    }

    channel = ch;
    channel.assertQueue(queue, { durable: true });
    console.log(`Connected to RabbitMQ. Queue: ${queue}`);
  });
});

module.exports = {
  getChannel: () => channel,
};
