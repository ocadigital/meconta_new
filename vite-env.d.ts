// Manually define ImportMetaEnv interfaces to fix "Cannot find type definition file for 'vite/client'"
// and "Property 'env' does not exist on type 'ImportMeta'" errors.

interface ImportMetaEnv {
  DEV: boolean;
  PROD: boolean;
  MODE: string;
  BASE_URL: string;
  SSR: boolean;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment NodeJS namespace to include API_KEY in ProcessEnv
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly DATABASE_URL: string;
    readonly [key: string]: string | undefined;
  }
}