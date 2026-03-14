import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { AuthUser } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "airx-timecard-dev-secret";
const TOKEN_EXPIRY = "30d";

export async function verifyPin(
  pin: string,
  pinHash: string
): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export function createToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(
  roles?: ("field" | "pm" | "admin")[]
): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  if (roles && !roles.includes(user.role)) throw new Error("Forbidden");
  return user;
}

export async function loginWithPin(
  pin: string
): Promise<{ user: AuthUser; token: string } | null> {
  const allEmployees = await prisma.employee.findMany({
    where: { isActive: true },
  });

  for (const emp of allEmployees) {
    const match = await verifyPin(pin, emp.pinHash);
    if (match) {
      const user: AuthUser = { id: emp.id, name: emp.name, role: emp.role as "field" | "pm" | "admin" };
      const token = createToken(user);
      return { user, token };
    }
  }

  return null;
}
