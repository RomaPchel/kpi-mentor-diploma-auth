import {RegistrationRequestBody} from "../interfaces/AuthInterfaces";
import {User} from "../entities/User";
import {em} from "../db/config";


export class AuthenticationUtil {

    public static async register(body: RegistrationRequestBody){
        const existingUser: User | null = await em.findOne(User, {email: body.email})

        if (existingUser){
            throw new Error("User already exists");
        }

        const newUser: User = new User()

        newUser.firstName = body.firstName
        newUser.lastName = body.lastName
        newUser.email = body.email
        newUser.password = body.password

        await em.persist(newUser).flush()
    }
}