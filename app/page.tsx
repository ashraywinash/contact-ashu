"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "signup" | "login";

type DemoUser = {
  username: string;
  passwordHash: string;
  createdAt: string;
};

const usersKey = "whispernet.demo.users";
const sessionKey = "whispernet.demo.session";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function isValidUsername(value: string) {
  return /^[a-z0-9][a-z0-9-]{2,28}[a-z0-9]$/.test(value);
}

function readUsers() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(usersKey) ?? "[]") as DemoUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: DemoUser[]) {
  window.localStorage.setItem(usersKey, JSON.stringify(users));
}

async function hashPassword(username: string, password: string) {
  const input = new TextEncoder().encode(`${username}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createTimestamp() {
  return new Date().toISOString();
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const normalizedUsername = useMemo(
    () => normalizeUsername(username),
    [username]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isValidUsername(normalizedUsername)) {
      setMessage("Use 4-30 lowercase letters, numbers, or hyphens.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    const users = readUsers();
    const existing = users.find((user) => user.username === normalizedUsername);
    const passwordHash = await hashPassword(normalizedUsername, password);

    if (mode === "signup") {
      if (existing) {
        setMessage("That username is already taken.");
        return;
      }

      const nextUsers = [
        ...users,
        {
          username: normalizedUsername,
          passwordHash,
          createdAt: createTimestamp(),
        },
      ];

      saveUsers(nextUsers);
      window.localStorage.setItem(
        sessionKey,
        JSON.stringify({ username: normalizedUsername })
      );
      router.push("/chat");
      return;
    }

    if (!existing || existing.passwordHash !== passwordHash) {
      setMessage("Username or password is incorrect.");
      return;
    }

    window.localStorage.setItem(
      sessionKey,
      JSON.stringify({ username: normalizedUsername })
    );
    router.push("/chat");
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17201d]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#57706a]">
              WhisperNet
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Private chats under a public pseudonym.
            </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#d8e1dd] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">Unique username</p>
              <p className="mt-2 text-sm leading-6 text-[#5b6b65]">
                Your username is the public handle people can search.
              </p>
            </div>
            <div className="rounded-lg border border-[#d8e1dd] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">Password gate</p>
              <p className="mt-2 text-sm leading-6 text-[#5b6b65]">
                The chat screen opens after account creation or sign in.
              </p>
            </div>
            <div className="rounded-lg border border-[#d8e1dd] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">Encrypted payloads</p>
              <p className="mt-2 text-sm leading-6 text-[#5b6b65]">
                The backend plan stores ciphertext and encrypted media only.
              </p>
            </div>
          </div>
        </div>

        <form
          className="rounded-lg border border-[#d8e1dd] bg-white p-5 shadow-sm sm:p-6"
          onSubmit={handleSubmit}
        >
          <div className="mb-6 flex rounded-full bg-[#f1f6f4] p-1">
            {(["signup", "login"] as AuthMode[]).map((item) => (
              <button
                aria-pressed={mode === item}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                  mode === item
                    ? "bg-[#153f38] text-white"
                    : "text-[#40524b]"
                }`}
                key={item}
                onClick={() => {
                  setMode(item);
                  setMessage("");
                }}
                type="button"
              >
                {item === "signup" ? "Create" : "Sign in"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">Username</span>
              <input
                autoComplete="username"
                className="mt-2 w-full rounded-lg border border-[#d8e1dd] bg-[#f7faf9] px-3 py-3 text-sm outline-none transition focus:border-[#13a077]"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="opal-sky-884"
                value={username}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Password</span>
              <input
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                className="mt-2 w-full rounded-lg border border-[#d8e1dd] bg-[#f7faf9] px-3 py-3 text-sm outline-none transition focus:border-[#13a077]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="minimum 8 characters"
                type="password"
                value={password}
              />
            </label>
          </div>

          {message ? (
            <p className="mt-4 rounded-lg bg-[#ffe9dd] px-3 py-2 text-sm font-medium text-[#9a4f2d]">
              {message}
            </p>
          ) : null}

          <button
            className="mt-6 w-full rounded-full bg-[#153f38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f302b]"
            type="submit"
          >
            {mode === "signup" ? "Create account" : "Open chat"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-[#66736f]">
            Prototype auth uses local browser storage. Production must use a
            backend session and password hashing.
          </p>
        </form>
      </section>
    </main>
  );
}
