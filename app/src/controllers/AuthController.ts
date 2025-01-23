import Router from "koa-router";
import type {Context} from "koa";
import type {LoginRequestBody, RegistrationRequestBody} from "../interfaces/AuthInterfaces.js";
import {AuthenticationUtil} from "../Utils/AuthenticationUtil.js";

export class AuthController extends Router {
    constructor() {
        super();
        this.setUpRoutes();
    }

    private setUpRoutes() {
        this.post("/login", this.login);
        this.post("/register", this.registration);
    }

    private async login(ctx: Context){
        const body: LoginRequestBody = ctx.request.body as LoginRequestBody;


        ctx.body = await AuthenticationUtil.login(body)
        ctx.status = 201
    }

    private async registration(ctx: Context){
        const body: RegistrationRequestBody = ctx.request.body as RegistrationRequestBody;

        await AuthenticationUtil.register(body)

        ctx.body = 'Success'
        ctx.status = 201
    }


}
