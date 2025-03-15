import Koa from "koa";
import { orm } from "./db/config.js";
import koabodyparser from "koa-bodyparser";
import { AuthController } from "./controllers/AuthController.js";
import { ErrorMiddleware } from "kpi-diploma-typescript-core/dist/middlewares/ErrorMiddleware.js";
import { AuthMiddleware } from "./middlewares/AuthMiddleware.js";
import cors from "@koa/cors";
import SocketSingleton from "./Utils/Socket.js";
import { Server as HTTPServer, createServer } from "http";

const app = new Koa();
const server: HTTPServer = createServer(app.callback());

SocketSingleton.getInstance(server, orm.em);

await orm.connect().then(() => {
  console.log("Database has connected!");
});
app.use(cors());
app.use(koabodyparser());

app.use(ErrorMiddleware());
app.use(AuthMiddleware());
app
  .use(new AuthController().routes())
  .use(new AuthController().allowedMethods());

app.listen(3000, () => {
  console.log(`Auth server is running at ${3000}`);
});
