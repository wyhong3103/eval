require("dotenv").config();
const { getChannel } = require("./rabbitmq");
const queue = process.env.QUEUE_NAME;
const io = require("socket.io")();
const redis = require("redis");
const REDIS_URL = process.env.REDIS_URL;
const redisClient = redis.createClient(REDIS_URL);
const clients = {};

(async () => {
  await redisClient.connect();

  await redisClient.subscribe("task:notification", (message) => {
    const { id, output, status } = JSON.parse(message);
    clients[id].emit("result", output, status);
  });
})();

io.on("connection", (socket) => {
  console.log(`${socket.id} has connected!`);
  clients[socket.id] = socket;
  socket.on("submit", (msg) => {
    msg = JSON.parse(msg);
    msg.id = socket.id;
    msg = JSON.stringify(msg);
    getChannel().sendToQueue(queue, Buffer.from(msg));
  });

  socket.on("disconnect", () => {
    delete clients[socket.id];
  });
});

module.exports = io;
