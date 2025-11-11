// src/lib/auth.ts
import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// ---- Lucia v3 type augmentation ----
declare module "lucia" {
  interface Register {
    Lucia: typeof Lucia;
    DatabaseUserAttributes: {
      email: string; // fields you expose via getUserAttributes
    };
  }
}

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const auth = new Lucia(adapter, {
  sessionCookie: {
    name: "session",
    attributes: {
      sameSite: "lax",
      path: "/",
      // secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
  }),
});

// Helper usable in server components/routes
export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (!sessionId) return { session: null, user: null };

  const { session, user } = await auth.validateSession(sessionId);
  return { session, user };
}
