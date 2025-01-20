import Router from "koa-router";
import {Context} from "koa";
import {RegistrationRequestBody} from "../interfaces/AuthInterfaces";
import {z, ZodError} from "zod";
import {AuthenticationUtil} from "../Utils/AuthenticationUtil";

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

    }

    private async registration(ctx: Context){
        const body: RegistrationRequestBody = ctx.request.body as RegistrationRequestBody;

        await AuthenticationUtil.register(body)

        ctx.body = 'Success'
        ctx.status = 201
    }


}
