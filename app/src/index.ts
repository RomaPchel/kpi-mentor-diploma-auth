import Koa from "koa";
import { orm } from "./db/config.js";
import koabodyparser from "koa-bodyparser";
import { AuthController } from "./controllers/AuthController.js";
import { ValidationMiddleware } from "./middlewares/ValidationMiddleware.js";
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware.js";

const app = new Koa();

await orm.connect().then(() => {
  console.log("Database has connected!");
});

app.use(koabodyparser());
app.use(ValidationMiddleware());

app.use(ErrorMiddleware());
app
  .use(new AuthController().routes())
  .use(new AuthController().allowedMethods());

app.listen(3000, () => {
  console.log(`Auth server is running at ${3000}`);
});
