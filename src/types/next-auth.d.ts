import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "OWNER" | "ADMIN" | "SUPPORT";
  }

  interface Session {
    user: {
      id: string;
      role: "OWNER" | "ADMIN" | "SUPPORT";
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "OWNER" | "ADMIN" | "SUPPORT";
    lastActive?: number;
  }
}

}