/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;
declare const __APP_DEPLOYED_AT__: string;

interface ImportMetaEnv {
  readonly GITHUB_CLIENT_ID?: string;
  readonly VITE_GITHUB_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
