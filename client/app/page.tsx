"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { firstName: string; lastName: string; email: string; role: "admin" | "user" };

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthenticated");
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  if (!user) return <p>Loading...</p>;

  return (
    <main>
      <h1>{`Hello, ${user.firstName} ${user.lastName}`}</h1>
      <p>
        Signed in as {user.email} ({user.role === "admin" ? "Admin" : "User"})
      </p>
      <button onClick={logout}>Logout</button>
    </main>
  );
}
