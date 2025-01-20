export interface RegistrationRequestBody{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface LoginRequestBody{
    email: string;
    password: string;
}

export interface TokenSet{
    accessToken: string;
    refreshToken: string;
}

export interface CleanedUser{
    uuid: string;
    email: string;
    role: string;
}