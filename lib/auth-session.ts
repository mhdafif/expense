import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getAuthSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getRequiredAuthSession() {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
