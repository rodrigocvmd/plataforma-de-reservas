// client/src/services/api.ts
import axios from 'axios';

// 1. Obter a URL base da API a partir das variáveis de ambiente do Vite
//    Vite expõe variáveis prefixadas com VITE_ no objeto import.meta.env
//    Usaremos http://localhost:3000/api como padrão de desenvolvimento
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 2. Criar uma instância do Axios com a baseURL configurada
const api = axios.create({
  baseURL: apiBaseURL,
});

// 3. INTERCEPTOR DE REQUISIÇÃO: Adicionar o token JWT automaticamente
//    Este interceptor será executado ANTES de cada requisição feita pela instância 'api'.
api.interceptors.request.use(
  (config) => {
    // Pegar o token do localStorage (ou de onde você decidir armazená-lo após o login)
    const token = localStorage.getItem('authToken'); // Usaremos 'authToken' como chave de exemplo

    // Se o token existir, adiciona o cabeçalho Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Retorna a configuração modificada (ou original se não houver token)
  },
  (error) => {
    // Faça algo com erros de requisição (raro acontecer aqui)
    return Promise.reject(error);
  }
);

// 4. INTERCEPTOR DE RESPOSTA (Opcional, mas útil para erros globais)
//    Pode ser usado para tratar erros 401 (Não autorizado) globalmente,
//    redirecionando para o login, por exemplo.
/*
api.interceptors.response.use(
  (response) => response, // Simplesmente retorna respostas de sucesso
  (error) => {
    if (error.response && error.response.status === 401) {
      // Exemplo: Limpar dados do usuário, redirecionar para /login
      console.error("Não autorizado! Redirecionando para login...");
      localStorage.removeItem('authToken');
      // window.location.href = '/login'; // Cuidado com hard refresh em SPAs
    }
    return Promise.reject(error); // Rejeita a promessa para que o erro possa ser tratado localmente também
  }
);
*/

// 5. Exportar a instância configurada
export default api;