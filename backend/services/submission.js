require("dotenv").config();
const io = require("socket.io")({
  cors: {
    origin: "*",
  },
});
const amqp = require("amqplib/callback_api");
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const task_queue = process.env.QUEUE_NAME;
const rpc_queue = process.env.RPC_QUEUE_NAME;
const clients = {};

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
    channel.assertQueue(task_queue, { durable: true });
    channel.assertQueue(rpc_queue, { durable: true });

    channel.consume(
      rpc_queue,
      (msg) => {
        const { id, output, status } = JSON.parse(msg.content.toString());
        console.log(`${id}: Code evaluated.`);
        if (clients[id]) {
          clients[id].emit("result", output, status);
        }
      },
      {
        noAck: true,
      }
    );
  });
});

io.on("connection", (socket) => {
  clients[socket.id] = socket;
  socket.on("submit", (msg) => {
    msg = JSON.parse(msg);
    msg.id = socket.id;
    msg = JSON.stringify(msg);
    console.log(`${socket.id}: Code submitted.`);
    channel.sendToQueue(task_queue, Buffer.from(msg));
  });

  socket.on("disconnect", () => {
    delete clients[socket.id];
  });
});

module.exports = {
  io,
};
