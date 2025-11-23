import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
    } & DefaultSession["user"];
    jwt?: string;
  }

  interface User extends DefaultUser {
    jwt?: string;
    firstName?: string;
    lastName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    jwt?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
  }
}
