import type {
  CleanedUser,
  LoginRequestBody,
  RegistrationRequestBody,
  TokenSet,
} from "../interfaces/AuthInterfaces";
import { User } from "../entities/User.js";
import { em } from "../db/config.js";
import { compare } from "bcrypt";
import jwt, { type JwtPayload, type VerifyErrors } from "jsonwebtoken";
import { FormsOfEducation, TokenExpiration } from "../enums/UserEnums.js";

export class AuthenticationUtil {
  public static readonly ACCESS_SECRET = process.env
    .ACCESS_TOKEN_SECRET as string;

  public static readonly REFRESH_SECRET = process.env
    .REFRESH_TOKEN_SECRET as string;

  public static async register(body: RegistrationRequestBody) {
    const existingUser: User | null = await em.findOne(User, {
      email: body.email,
    });

    if (existingUser) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    const newUser: User = new User();

    newUser.firstName = body.firstName;
    newUser.lastName = body.lastName;
    newUser.email = body.email;
    newUser.password = body.password; //hashed before creating via @BeforeCreate
    newUser.specialization = body.specialization;
    newUser.formOfEducation = FormsOfEducation.FULL_TIME;
    newUser.groupCode = body.groupCode;
    newUser.department = body.department;
    newUser.interests = body.interests;
    newUser.course = body.course;

    await em.persist(newUser).flush();

    return this.login({ email: body.email, password: body.password });
  }

  public static verifyRefreshToken(refreshToken: string) {
    return new Promise<string | null | false>((resolve, reject) => {
      jwt.verify(
        refreshToken,
        this.REFRESH_SECRET,
        async (
          err: VerifyErrors | null,
          user: JwtPayload | string | undefined,
        ) => {
          if (err) {
            reject(err);
          }

          if (user === undefined) {
            resolve(null);
            return;
          }

          const newAccessToken = this.signAccessToken(user as CleanedUser);

          resolve(newAccessToken);
        },
      );
    });
  }

  public static async login(body: LoginRequestBody) {
    const existingUser: User | null = await em.findOne(User, {
      email: body.email,
    });

    if (!existingUser) {
      throw new Error("USER_DOES_NOT_EXIST");
    }

    if (!(await this.comparePasswords(body.password, existingUser.password))) {
      throw new Error("PASSWORDS_DO_NOT_MATCH");
    }

    return this.buildTokens(existingUser as User);
  }

  public static async convertPersistedToUser(
    persistedUser: JwtPayload,
  ): Promise<CleanedUser> {
    return {
      uuid: persistedUser.uuid,
      email: persistedUser.email,
      firstName: persistedUser.firstName ?? "firstName",
      lastName: persistedUser.lastName ?? "lastName",
      avatar: persistedUser.avatar,
      role: "default",
    };
  }

  public static signAccessToken(cleanedUser: CleanedUser) {
    return jwt.sign(cleanedUser, this.ACCESS_SECRET, {
      expiresIn: TokenExpiration.ACCESS,
    });
  }

  public static singRefreshToken(cleanedUser: CleanedUser) {
    return jwt.sign(cleanedUser, this.REFRESH_SECRET);
  }

  private static async comparePasswords(password: string, hash: string) {
    return compare(password, hash);
  }

  private static buildTokens(user: User): TokenSet {
    const cleanedUser = {
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    } as CleanedUser;

    const accessToken: string = this.signAccessToken(cleanedUser);
    const refreshToken: string = this.singRefreshToken(cleanedUser);

    return { accessToken, refreshToken };
  }

  public static async fetchUserWithTokenInfo(
    token: string,
  ): Promise<User | null> {
    const userInToken: User | null | false =
      await AuthenticationUtil.verifyTokenAndFetchUser(token);
    if (
      userInToken === null ||
      !userInToken ||
      !userInToken.uuid ||
      !userInToken.uuid
    ) {
      return null;
    }
    return userInToken;
  }

  public static verifyTokenAndFetchUser(
    token: string,
  ): Promise<User | null | false> {
    return new Promise<User | null | false>((resolve, reject) => {
      jwt.verify(
        token,
        this.ACCESS_SECRET,
        (
          err: VerifyErrors | null,
          decoded: JwtPayload | string | undefined,
        ) => {
          if (err) {
            reject(err);
          }

          if (decoded === undefined) {
            resolve(null);
            return;
          }

          const user = decoded as JwtPayload;

          if (!user.uuid) {
            resolve(false);
            return;
          }

          em.findOne(User, {
            uuid: user.uuid,
          })
            .then((persistedUser: User | null) => {
              resolve(persistedUser);
            })
            .catch((e: Error) => {
              reject(e);
            });
        },
      );
    });
  }
}
