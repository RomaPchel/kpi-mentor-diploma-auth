import {CleanedUser, LoginRequestBody, RegistrationRequestBody, TokenSet} from "../interfaces/AuthInterfaces";
import {User} from "../entities/User.js";
import {em} from "../db/config.js";
import {compare} from "bcrypt";
import jwt from "jsonwebtoken";
import {TokenExpiration} from "../enums/UserEnums.js";

export class AuthenticationUtil {
    public static readonly ACCESS_SECRET =
        process.env.ACCESS_TOKEN_SECRET as string

    public static readonly REFRESH_SECRET =
        process.env.REFRESH_TOKEN_SECRET as string


    public static async register(body: RegistrationRequestBody){
        const existingUser: User | null = await em.findOne(User, {email: body.email})

        if (existingUser){
            throw new Error("User already exists");
        }

        const newUser: User = new User()

        newUser.firstName = body.firstName
        newUser.lastName = body.lastName
        newUser.email = body.email
        newUser.password = body.password //hashed before creating

        await em.persist(newUser).flush()
    }

    public static async login(body: LoginRequestBody){
        const existingUser: User | null = await em.findOne(User, {email: body.email})

        if (!existingUser){
            throw new Error(`User does not exist with email ${body.email}`);
        }

        if (!await this.comparePasswords(body.password, existingUser.password)) {
            throw new Error(`Passwords don't match for user ${body.email}`);
        }

        return this.buildTokens(existingUser as User)
    }

    public static signAccessToken(cleanedUser: CleanedUser) {
        return jwt.sign(cleanedUser, this.ACCESS_SECRET, {
            expiresIn: TokenExpiration.ACCESS,
        });
    }

    public static singRefreshToken(cleanedUser: CleanedUser) {
        return jwt.sign(cleanedUser, this.REFRESH_SECRET);
    }

    private static async comparePasswords(password: string, hash: string){
        return compare(password, hash)
    }

    private static buildTokens(user: User): TokenSet {
        const cleanedUser = {
            uuid: user.uuid,
            email: user.email,
            role: user.role,
        } as CleanedUser

        const accessToken: string = this.signAccessToken(cleanedUser);
        const refreshToken: string = this.singRefreshToken(cleanedUser);

        return { accessToken, refreshToken };
    }
}