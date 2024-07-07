var express = require("express");
var router = express.Router();
const asyncHandler = require("express-async-handler");
const amqp = require("amqplib/callback_api");

const RABBITMQ_URL = "amqp://user:password@localhost:5672";
const queue = "task_queue";

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

// Hello World
router.get("/", function (req, res) {
  res.send("Hello World");
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const code = req.body.code;
    channel.sendToQueue(queue, Buffer.from(code));
    res.send("OK");
  })
);

module.exports = router;
