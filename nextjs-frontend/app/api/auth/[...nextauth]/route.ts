import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import axiosAuth from "@/app/lib/axios-auth";
import { handleApiError } from "@/app/lib/handleApiError";

const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const strapiResponseSchema = z.object({
  jwt: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  "development-secret-change-in-production-min-32-characters-long";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedCredentials = credentialsSchema.parse(credentials);

          const response = await axiosAuth.post("/api/auth/local", {
            identifier: validatedCredentials.email,
            password: validatedCredentials.password,
          });

          const validatedData = strapiResponseSchema.parse(response.data);

          return {
            id: validatedData.user.id.toString(),
            name: validatedData.user.username,
            email: validatedData.user.email,
            firstName: validatedData.user.firstName,
            lastName: validatedData.user.lastName,
            jwt: validatedData.jwt,
          };
        } catch (error) {
          const errorMessage = handleApiError(error, "Authentication failed");
          throw new Error(errorMessage);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.jwt = user.jwt;
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.jwt = token.jwt;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
