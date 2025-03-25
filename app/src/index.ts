import Koa from "koa";
import { orm } from "./db/config.js";
import koabodyparser from "koa-bodyparser";
import { AuthController } from "./controllers/AuthController.js";
import cors from "@koa/cors";
import SocketSingleton from "./Utils/Socket.js";
import { Server as HTTPServer, createServer } from "http";
import { ValidationMiddleware } from "./middlewares/ValidationMiddleware.js";
import { UserController } from "./controllers/UserController.js";
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware.js";
import { ChatController } from "./controllers/ChatController.js";

const app = new Koa();
const server: HTTPServer = createServer(app.callback());

app.use(
  cors({
    origin: (ctx) => {
      const validOrigins = ["http://localhost:5173", "http://localhost:4173"];
      const requestOrigin = ctx.request.headers.origin;
      if (requestOrigin && validOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }
      return "http://localhost:5173";
    },
    credentials: true,
  }),
);

app.use(ErrorMiddleware());
app.use(koabodyparser());

await orm.connect().then(() => {
  console.log("Database has connected!");
});

SocketSingleton.getInstance(server);
console.log("Socket instance initialized");

app.use(ValidationMiddleware());
app
  .use(new AuthController().routes())
  .use(new AuthController().allowedMethods());
app
  .use(new UserController().routes())
  .use(new UserController().allowedMethods());
app
  .use(new ChatController().routes())
  .use(new ChatController().allowedMethods());

server.listen(3000, () => {
  console.log(`Auth server is running on port 3000`);
});
