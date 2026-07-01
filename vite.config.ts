import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;
const d1DatabaseName =
  process.env.CLOUDFLARE_D1_DATABASE_NAME ?? "whispernet-db";
const d1DatabaseId =
  process.env.CLOUDFLARE_D1_DATABASE_ID ?? SITE_CREATOR_PLACEHOLDER_DATABASE_ID;
const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "whispernet-media";

const localBindingConfig = {
  main: "./worker/index.ts",
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: d1DatabaseName,
          database_id: d1DatabaseId,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: r2BucketName,
        },
      ]
    : [],
};

export default defineConfig({
  plugins: [
    vinext(),
    sites(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      config: localBindingConfig,
    }),
  ],
});
