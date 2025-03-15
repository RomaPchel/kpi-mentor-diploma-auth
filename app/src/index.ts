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

const app = new Koa();
const server: HTTPServer = createServer(app.callback());

app.use(ErrorMiddleware());

app.use(cors());
app.use(koabodyparser());

SocketSingleton.getInstance(server, orm.em);

await orm.connect().then(() => {
  console.log("Database has connected!");
});

app.use(ValidationMiddleware());
app
  .use(new AuthController().routes())
  .use(new AuthController().allowedMethods());
app
  .use(new UserController().routes())
  .use(new UserController().allowedMethods());

app.listen(3000, () => {
  console.log(`Auth server is running at ${3000}`);
});
