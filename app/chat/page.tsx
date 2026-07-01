"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

type MediaKind = "text" | "gif" | "photo" | "video";

type PublicUser = {
  pseudonym: string;
  signal: "online" | "away" | "offline";
  region: string;
  verified: boolean;
};

type ChatMessage = {
  id: string;
  author: string;
  body: string;
  ciphertext: string;
  content: MediaKind;
  mine: boolean;
  time: string;
  reaction?: string;
  mediaTone?: string;
};

type Chat = {
  id: string;
  title: string;
  type: "direct" | "group";
  members: string[];
  unread: number;
  lastSeen: string;
  sealed: boolean;
  messages: ChatMessage[];
};

const publicUsers: PublicUser[] = [
  {
    pseudonym: "atlas-mint-042",
    signal: "online",
    region: "Global",
    verified: true,
  },
  {
    pseudonym: "nova-river-719",
    signal: "away",
    region: "India",
    verified: true,
  },
  {
    pseudonym: "pixel-moon-381",
    signal: "online",
    region: "Europe",
    verified: false,
  },
  {
    pseudonym: "cobalt-sun-527",
    signal: "offline",
    region: "Americas",
    verified: true,
  },
  {
    pseudonym: "echo-cedar-908",
    signal: "online",
    region: "Africa",
    verified: false,
  },
];

const reactionOptions = ["👍", "❤️", "😂", "😮", "🙏"];
const sessionKey = "whispernet.demo.session";

const gifOptions = [
  "Typing sparkle loop",
  "Coffee cheers loop",
  "Launch confetti loop",
];

const initialChats: Chat[] = [
  {
    id: "direct-atlas",
    title: "atlas-mint-042",
    type: "direct",
    members: ["opal-sky-884", "atlas-mint-042"],
    unread: 2,
    lastSeen: "09:42",
    sealed: true,
    messages: [
      {
        id: "m-1",
        author: "atlas-mint-042",
        body: "Can you see this invite from my pseudonym?",
        ciphertext: "enc.v1.x3f9a1.7b2c91e4",
        content: "text",
        mine: false,
        time: "09:39",
        reaction: "👍",
      },
      {
        id: "m-2",
        author: "opal-sky-884",
        body: "Yes. Only ciphertext and delivery metadata touch the server.",
        ciphertext: "enc.v1.a9c0dd.91fe44a8",
        content: "text",
        mine: true,
        time: "09:40",
      },
      {
        id: "m-3",
        author: "atlas-mint-042",
        body: "Photo capsule",
        ciphertext: "enc.media.photo.0df12a77",
        content: "photo",
        mine: false,
        time: "09:41",
        mediaTone: "from-[#3f7d8a] via-[#6fb2a4] to-[#e0b35d]",
      },
    ],
  },
  {
    id: "direct-nova",
    title: "nova-river-719",
    type: "direct",
    members: ["opal-sky-884", "nova-river-719"],
    unread: 0,
    lastSeen: "08:18",
    sealed: true,
    messages: [
      {
        id: "m-4",
        author: "nova-river-719",
        body: "Coffee cheers loop",
        ciphertext: "enc.media.gif.b71d8a0c",
        content: "gif",
        mine: false,
        time: "08:18",
      },
    ],
  },
  {
    id: "group-founders",
    title: "Weekend Founders",
    type: "group",
    members: [
      "opal-sky-884",
      "atlas-mint-042",
      "nova-river-719",
      "pixel-moon-381",
    ],
    unread: 5,
    lastSeen: "Yesterday",
    sealed: true,
    messages: [
      {
        id: "m-5",
        author: "pixel-moon-381",
        body: "Launch confetti loop",
        ciphertext: "enc.media.gif.49aa20ce",
        content: "gif",
        mine: false,
        time: "21:08",
        reaction: "😂",
      },
      {
        id: "m-6",
        author: "opal-sky-884",
        body: "Video capsule",
        ciphertext: "enc.media.video.8ad9201b",
        content: "video",
        mine: true,
        time: "21:10",
        mediaTone: "from-[#152f3b] via-[#34777d] to-[#d65f54]",
      },
    ],
  },
];

function initials(value: string) {
  return value
    .split("-")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function encryptedPreview(value: string, kind: MediaKind) {
  const source = `${kind}:${value}:${Date.now()}`;
  const hex = Array.from(source)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);

  return `enc.v1.${kind}.${hex}`;
}

function nowTime() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function readSessionUsername() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(sessionKey);
    const session = rawSession
      ? (JSON.parse(rawSession) as { username?: string })
      : null;
    return session?.username ?? null;
  } catch {
    return null;
  }
}

function subscribeSession(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function Home() {
  const router = useRouter();
  const sessionUsername = useSyncExternalStore(
    subscribeSession,
    readSessionUsername,
    () => null
  );
  const profile = sessionUsername ?? "";
  const [isVisible, setIsVisible] = useState(true);
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState(initialChats[0].id);
  const [draft, setDraft] = useState("");
  const [mediaMode, setMediaMode] = useState<MediaKind>("text");
  const [selectedGif, setSelectedGif] = useState(gifOptions[0]);
  const [groupName, setGroupName] = useState("private-build-room");
  const [groupMembers, setGroupMembers] = useState<string[]>([
    "atlas-mint-042",
    "nova-river-719",
  ]);

  useEffect(() => {
    if (!sessionUsername) {
      router.replace("/");
    }
  }, [sessionUsername, router]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? chats[0],
    [activeChatId, chats]
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return publicUsers;
    }

    return publicUsers.filter(
      (user) =>
        user.pseudonym.toLowerCase().includes(term) ||
        user.region.toLowerCase().includes(term)
    );
  }, [search]);

  const sortedChats = useMemo(
    () =>
      [...chats].sort((first, second) => {
        if (first.id === activeChatId) return -1;
        if (second.id === activeChatId) return 1;
        return second.unread - first.unread;
      }),
    [activeChatId, chats]
  );

  function logout() {
    window.localStorage.removeItem(sessionKey);
    router.push("/");
  }

  function openDirectChat(user: PublicUser) {
    const existing = chats.find(
      (chat) => chat.type === "direct" && chat.members.includes(user.pseudonym)
    );

    if (existing) {
      setActiveChatId(existing.id);
      return;
    }

    const chat: Chat = {
      id: `direct-${user.pseudonym}`,
      title: user.pseudonym,
      type: "direct",
      members: [profile, user.pseudonym],
      unread: 0,
      lastSeen: "New",
      sealed: true,
      messages: [
        {
          id: makeId("m"),
          author: user.pseudonym,
          body: "Identity key bundle available",
          ciphertext: encryptedPreview(user.pseudonym, "text"),
          content: "text",
          mine: false,
          time: nowTime(),
        },
      ],
    };

    setChats((current) => [chat, ...current]);
    setActiveChatId(chat.id);
  }

  function toggleGroupMember(pseudonym: string) {
    setGroupMembers((current) =>
      current.includes(pseudonym)
        ? current.filter((member) => member !== pseudonym)
        : [...current, pseudonym]
    );
  }

  function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = groupName.trim();
    if (!title || groupMembers.length < 2) {
      return;
    }

    const chat: Chat = {
      id: makeId("group"),
      title,
      type: "group",
      members: [profile, ...groupMembers],
      unread: 0,
      lastSeen: "New",
      sealed: true,
      messages: [
        {
          id: makeId("m"),
          author: profile,
          body: `${title} created with ${groupMembers.length + 1} members`,
          ciphertext: encryptedPreview(title, "text"),
          content: "text",
          mine: true,
          time: nowTime(),
        },
      ],
    };

    setChats((current) => [chat, ...current]);
    setActiveChatId(chat.id);
    setGroupName("");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body =
      mediaMode === "gif"
        ? selectedGif
        : mediaMode === "photo"
          ? "Photo capsule"
          : mediaMode === "video"
            ? "Video capsule"
            : draft.trim();

    if (!body) {
      return;
    }

    const newMessage: ChatMessage = {
      id: makeId("m"),
      author: profile,
      body,
      ciphertext: encryptedPreview(body, mediaMode),
      content: mediaMode,
      mine: true,
      time: nowTime(),
      mediaTone:
        mediaMode === "photo"
          ? "from-[#4d8d8f] via-[#90c2a7] to-[#f0c05a]"
          : mediaMode === "video"
            ? "from-[#1c2d3a] via-[#2f7771] to-[#d65f54]"
            : undefined,
    };

    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              lastSeen: "Now",
              messages: [...chat.messages, newMessage],
              unread: 0,
            }
          : chat
      )
    );
    setDraft("");
    setMediaMode("text");
  }

  function reactToMessage(messageId: string, reaction: string) {
    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId ? { ...message, reaction } : message
              ),
            }
          : chat
      )
    );
  }

  if (!sessionUsername) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7faf9] px-4 text-[#17201d]">
        <div className="rounded-lg border border-[#d8e1dd] bg-white px-5 py-4 text-sm font-semibold shadow-sm">
          Opening secure session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17201d]">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8e1dd] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#57706a]">
              WhisperNet
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Encrypted pseudonym chat
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#dff4e9] px-3 py-2 text-xs font-semibold text-[#0d6f55]">
              E2EE active
            </span>
            <span className="rounded-full bg-[#e7eefc] px-3 py-2 text-xs font-semibold text-[#315a9b]">
              Public directory
            </span>
            <span className="rounded-full bg-[#ffe9dd] px-3 py-2 text-xs font-semibold text-[#9a4f2d]">
              Media sealed
            </span>
          </div>
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex min-h-[520px] flex-col gap-4">
            <section className="rounded-lg border border-[#d8e1dd] bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Signed in as</p>
                    <p className="truncate text-xs text-[#66736f]">{profile}</p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#153f38] font-semibold text-white">
                    {initials(profile)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-[#475650]">
                    <input
                      checked={isVisible}
                      className="h-4 w-4 accent-[#13a077]"
                      onChange={(event) => setIsVisible(event.target.checked)}
                      type="checkbox"
                    />
                    Visible worldwide
                  </label>
                  <button
                    className="rounded-full border border-[#c7d8d2] px-4 py-2 text-sm font-semibold text-[#153f38]"
                    onClick={logout}
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#d8e1dd] bg-white shadow-sm">
              <div className="border-b border-[#e7eeeb] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">World directory</p>
                    <p className="text-xs text-[#66736f]">
                      {filteredUsers.length} public pseudonyms
                    </p>
                  </div>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      isVisible ? "bg-[#13a077]" : "bg-[#c85b48]"
                    }`}
                    title={isVisible ? "Visible" : "Hidden"}
                  />
                </div>
                <label className="mt-4 flex items-center gap-2 rounded-full bg-[#f1f6f4] px-4 py-3 text-sm text-[#66736f]">
                  <span aria-hidden="true">⌕</span>
                  <input
                    className="w-full bg-transparent outline-none"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search users"
                    value={search}
                  />
                </label>
              </div>

              <div className="max-h-[290px] overflow-auto">
                {filteredUsers.map((user) => (
                  <div
                    className="flex items-center gap-3 border-b border-[#eef3f1] px-4 py-3 last:border-0"
                    key={user.pseudonym}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#dff4e9] text-sm font-semibold text-[#153f38]">
                      {initials(user.pseudonym)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {user.pseudonym}
                      </p>
                      <p className="truncate text-xs text-[#66736f]">
                        {user.region} · {user.signal}
                        {user.verified ? " · verified" : ""}
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-[#c7d8d2] px-3 py-1.5 text-xs font-semibold text-[#153f38] transition hover:border-[#13a077]"
                      onClick={() => openDirectChat(user)}
                      type="button"
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d8e1dd] bg-white p-4 shadow-sm">
              <form className="space-y-3" onSubmit={createGroup}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">New group</p>
                    <p className="text-xs text-[#66736f]">
                      {groupMembers.length} selected
                    </p>
                  </div>
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-[#153f38] text-lg text-white" type="submit" aria-label="Create group">
                    +
                  </button>
                </div>
                <input
                  className="w-full rounded-lg border border-[#d8e1dd] bg-[#f7faf9] px-3 py-3 text-sm outline-none transition focus:border-[#13a077]"
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="group-pseudonym"
                  value={groupName}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {publicUsers.slice(0, 4).map((user) => (
                    <label
                      className="flex items-center justify-between gap-2 rounded-lg bg-[#f7faf9] px-3 py-2 text-sm"
                      key={user.pseudonym}
                    >
                      <span className="truncate">{user.pseudonym}</span>
                      <input
                        checked={groupMembers.includes(user.pseudonym)}
                        className="h-4 w-4 accent-[#13a077]"
                        onChange={() => toggleGroupMember(user.pseudonym)}
                        type="checkbox"
                      />
                    </label>
                  ))}
                </div>
              </form>
            </section>
          </aside>

          <section className="grid min-h-[720px] gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <nav className="overflow-hidden rounded-lg border border-[#d8e1dd] bg-white shadow-sm">
              <div className="border-b border-[#e7eeeb] px-4 py-3">
                <p className="text-sm font-semibold">Chats</p>
                <p className="text-xs text-[#66736f]">
                  Direct messages and groups
                </p>
              </div>
              <div className="max-h-[660px] overflow-auto">
                {sortedChats.map((chat) => {
                  const latest = chat.messages[chat.messages.length - 1];
                  return (
                    <button
                      className={`flex w-full items-center gap-3 border-b border-[#eef3f1] px-4 py-4 text-left transition hover:bg-[#f3f8f6] ${
                        chat.id === activeChat.id ? "bg-[#edf8f3]" : "bg-white"
                      }`}
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      type="button"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#153f38] text-sm font-semibold text-white">
                        {initials(chat.title)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-semibold">
                            {chat.title}
                          </span>
                          <span className="text-[11px] text-[#66736f]">
                            {chat.lastSeen}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-[#66736f]">
                            {latest?.ciphertext ?? "No messages yet"}
                          </span>
                          {chat.unread > 0 ? (
                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#13a077] px-1 text-[11px] font-bold text-white">
                              {chat.unread}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <article className="flex min-h-[720px] flex-col overflow-hidden rounded-lg border border-[#d8e1dd] bg-[#eef5f2] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e1dd] bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#dff4e9] font-semibold text-[#153f38]">
                    {initials(activeChat.title)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {activeChat.title}
                    </h2>
                    <p className="truncate text-xs text-[#66736f]">
                      {activeChat.type === "group"
                        ? `${activeChat.members.length} members`
                        : "Direct chat"}{" "}
                      · sealed sender · verified keys
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f6f4]" type="button" aria-label="Search chat">
                    ⌕
                  </button>
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f6f4]" type="button" aria-label="Chat menu">
                    ⋯
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-auto p-4 sm:p-6">
                <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-2 rounded-full bg-white/90 px-4 py-2 text-center text-xs font-medium text-[#52635d] shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#13a077]" />
                  <span>Messages are decrypted on this device</span>
                </div>

                {activeChat.messages.map((message) => (
                  <section
                    className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[86%] rounded-lg px-4 py-3 shadow-sm sm:max-w-[72%] ${
                        message.mine ? "bg-[#dff4e9]" : "bg-white"
                      }`}
                    >
                      {!message.mine && activeChat.type === "group" ? (
                        <p className="mb-1 text-xs font-semibold text-[#0d6f55]">
                          {message.author}
                        </p>
                      ) : null}

                      {message.content === "photo" || message.content === "video" ? (
                        <div
                          className={`mb-3 grid aspect-video min-h-32 place-items-center rounded-md bg-gradient-to-br ${message.mediaTone}`}
                        >
                          <span className="rounded-full bg-black/35 px-4 py-2 text-sm font-bold text-white">
                            {message.content === "video" ? "▶ Video" : "Photo"}
                          </span>
                        </div>
                      ) : null}

                      {message.content === "gif" ? (
                        <div className="mb-3 grid min-h-28 place-items-center rounded-md bg-[linear-gradient(135deg,#fee2d7,#dff4e9,#e7eefc)]">
                          <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-[#153f38]">
                            GIF
                          </span>
                        </div>
                      ) : null}

                      <p className="text-sm leading-6">{message.body}</p>
                      <p className="mt-2 truncate font-mono text-[11px] text-[#60716b]">
                        stored: {message.ciphertext}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-1">
                          {reactionOptions.map((reaction) => (
                            <button
                              aria-label={`React ${reaction}`}
                              className="grid h-7 w-7 place-items-center rounded-full bg-white/75 text-sm transition hover:bg-white"
                              key={reaction}
                              onClick={() => reactToMessage(message.id, reaction)}
                              type="button"
                            >
                              {reaction}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#60716b]">
                          {message.reaction ? (
                            <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                              {message.reaction}
                            </span>
                          ) : null}
                          <span>{message.time}</span>
                          {message.mine ? <span>✓✓</span> : null}
                        </div>
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              <form
                className="border-t border-[#d8e1dd] bg-white p-3"
                onSubmit={sendMessage}
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {(["text", "gif", "photo", "video"] as MediaKind[]).map(
                    (kind) => (
                      <button
                        aria-pressed={mediaMode === kind}
                        className={`rounded-full px-3 py-2 text-xs font-semibold capitalize transition ${
                          mediaMode === kind
                            ? "bg-[#153f38] text-white"
                            : "bg-[#f1f6f4] text-[#40524b]"
                        }`}
                        key={kind}
                        onClick={() => setMediaMode(kind)}
                        type="button"
                      >
                        {kind}
                      </button>
                    )
                  )}
                </div>

                {mediaMode === "gif" ? (
                  <div className="mb-3 grid gap-2 sm:grid-cols-3">
                    {gifOptions.map((gif) => (
                      <button
                        aria-pressed={selectedGif === gif}
                        className={`rounded-lg border px-3 py-3 text-left text-xs font-semibold ${
                          selectedGif === gif
                            ? "border-[#13a077] bg-[#edf8f3]"
                            : "border-[#d8e1dd] bg-white"
                        }`}
                        key={gif}
                        onClick={() => setSelectedGif(gif)}
                        type="button"
                      >
                        {gif}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center gap-2 rounded-full bg-[#f1f6f4] px-3 py-2">
                  <button className="grid h-10 w-10 place-items-center rounded-full text-xl" type="button" aria-label="Choose emoji">
                    ☺
                  </button>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                    disabled={mediaMode !== "text"}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={
                      mediaMode === "text"
                        ? "Type an encrypted message"
                        : `${mediaMode.toUpperCase()} selected`
                    }
                    value={mediaMode === "text" ? draft : ""}
                  />
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-[#153f38] text-white" type="submit" aria-label="Send message">
                    ↑
                  </button>
                </div>
              </form>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
