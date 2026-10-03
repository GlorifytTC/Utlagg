import "next-auth";

declare module "next-auth" {
  interface User {
    sv?: number;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    sv?: number;
  }
}
