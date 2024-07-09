require("dotenv").config();
const amqp = require("amqplib/callback_api");
const Docker = require("dockerode");
const path = require("path");
const fs = require("fs");
const docker = Docker({});

const assetsPath = path.resolve("./assets");
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const task_queue = process.env.QUEUE_NAME;
const rpc_queue = process.env.RPC_QUEUE_NAME;

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

    channel.consume(
      task_queue,
      async (msg) => {
        const { id, input, code } = JSON.parse(msg.content.toString());
        console.log(`${id}: Message received.`);

        fs.writeFileSync(assetsPath + "/input.txt", input, "utf8");
        fs.writeFileSync(assetsPath + "/main.cpp", code, "utf8");

        const [output, container] = await docker.run(
          "gcc:latest",
          [
            "sh",
            "-c",
            "g++ -o main /assets/main.cpp && cat /assets/input.txt | timeout 30 ./main > /assets/output.txt",
          ],
          process.stdout,
          {
            HostConfig: {
              Memory: 256 * 1024 * 1024,
              AutoRemove: true,
              Binds: [`${assetsPath}:/assets`],
              NetworkMode: "none",
            },
          }
        );

        const statusCode = output.StatusCode;

        const ret = {
          id,
          output: "",
          // 1 or 0, 1 is OK, 0 is BAD
          status: 1 - Math.min(1, statusCode),
        };

        if (statusCode === 124) {
          ret.output = "Time limit exceeded.";
        } else if (statusCode === 1) {
          ret.output = "Something went wrong with your code.";
        } else {
          const output = fs.readFileSync(assetsPath + "/output.txt", "utf8");
          ret.output = output;
        }
        channel.sendToQueue(rpc_queue, Buffer.from(JSON.stringify(ret)));
      },
      {
        noAck: true,
      }
    );
  });
});
