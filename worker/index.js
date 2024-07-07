const amqp = require("amqplib/callback_api");
const Docker = require("dockerode");
const path = require("path");
const docker = Docker({});
const fs = require("fs");

const assetsPath = path.resolve("./assets");
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

    channel.consume(
      queue,
      async (msg) => {
        const { input, code } = JSON.parse(msg.content.toString());

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

        if (statusCode === 124) {
          console.log("Time limit exceeded!");
        } else if (statusCode === 1) {
          console.log("Something went wrong with your code!");
        } else {
          const output = fs.readFileSync(assetsPath + "/output.txt", "utf8");
          console.log(output);
        }
      },
      {
        noAck: true,
      }
    );
  });
});
