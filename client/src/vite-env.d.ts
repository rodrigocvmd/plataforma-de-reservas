// client/src/vite-env.d.ts
/// <reference types="vite/client" />

// Adicione a linha abaixo
interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // outras variáveis de ambiente que você expor aqui
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }