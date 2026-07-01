import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayColor: text("display_color").notNull().default("#153f38"),
    isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    passwordUpdatedAt: text("password_updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
    index("users_visible_idx").on(table.isVisible),
  ]
);

export const deviceKeyBundles = sqliteTable(
  "device_key_bundles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    identityKey: text("identity_key").notNull(),
    signedPreKey: text("signed_pre_key").notNull(),
    signedPreKeySignature: text("signed_pre_key_signature").notNull(),
    oneTimePreKey: text("one_time_pre_key"),
    algorithm: text("algorithm").notNull().default("x3dh+double-ratchet"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    rotatedAt: text("rotated_at"),
  },
  (table) => [
    uniqueIndex("device_keys_user_device_idx").on(table.userId, table.deviceId),
  ]
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["direct", "group"] }).notNull(),
    titleCiphertext: text("title_ciphertext"),
    titleNonce: text("title_nonce"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("conversations_created_by_idx").on(table.createdByUserId),
    index("conversations_updated_at_idx").on(table.updatedAt),
  ]
);

export const conversationMembers = sqliteTable(
  "conversation_members",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .notNull()
      .default("member"),
    encryptedConversationKey: text("encrypted_conversation_key").notNull(),
    joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    mutedUntil: text("muted_until"),
  },
  (table) => [
    uniqueIndex("conversation_members_unique_idx").on(
      table.conversationId,
      table.userId
    ),
    index("conversation_members_user_idx").on(table.userId),
  ]
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => users.id),
    senderDeviceId: text("sender_device_id").notNull(),
    contentType: text("content_type", {
      enum: ["text", "emoji", "gif", "photo", "video"],
    }).notNull(),
    ciphertext: text("ciphertext").notNull(),
    nonce: text("nonce").notNull(),
    aad: text("aad").notNull(),
    senderKeyId: text("sender_key_id").notNull(),
    deliveryState: text("delivery_state", {
      enum: ["queued", "sent", "delivered", "read"],
    })
      .notNull()
      .default("queued"),
    expiresAt: text("expires_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
    index("messages_sender_idx").on(table.senderUserId),
  ]
);

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    encryptedFileKey: text("encrypted_file_key").notNull(),
    mimeTypeCiphertext: text("mime_type_ciphertext").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256Ciphertext: text("sha256_ciphertext").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("media_assets_message_idx").on(table.messageId),
    uniqueIndex("media_assets_object_key_idx").on(table.objectKey),
  ]
);

export const messageReactions = sqliteTable(
  "message_reactions",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emojiCiphertext: text("emoji_ciphertext").notNull(),
    nonce: text("nonce").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("message_reactions_unique_idx").on(table.messageId, table.userId),
  ]
);
