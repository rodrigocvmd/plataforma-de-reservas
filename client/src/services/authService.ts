// client/src/services/authService.ts
import api from "./api"; // Importa a instância configurada do Axios
import axios from "axios"; // <<< Importa axios e AxiosError

// Tipagem para os dados de login (exemplo)
interface LoginCredentials {
	email: string;
	password: string;
}

// Tipagem para a resposta do login (exemplo - ajuste conforme sua API retorna)
interface LoginResponse {
	message: string;
	token: string;
}

// Erro esperado da API (exemplo)
interface ApiError {
	error: string;
	details?: string; // Opcional
}

// Função para fazer login
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
	try {
		const response = await api.post<LoginResponse>("/autenticacao/login", credentials);
		return response.data;
	} catch (error: unknown) {
		// <<< Usa 'unknown'
		let errorMessage = "Falha no login. Tente novamente."; // Mensagem padrão

		// Verifica se é um erro do Axios com dados de resposta
		if (axios.isAxiosError<ApiError>(error) && error.response?.data?.error) {
			errorMessage = error.response.data.error; // Usa a mensagem de erro da API
			console.error("Erro de API no login:", error.response.data);
		}
		// Verifica se é um erro genérico do JavaScript
		else if (error instanceof Error) {
			errorMessage = error.message;
			console.error("Erro geral no login:", error.message);
		}
		// Caso não seja nenhum dos anteriores
		else {
			console.error("Erro desconhecido no login:", error);
		}

		// Lança um novo erro com a mensagem tratada (ou retorna um objeto de erro)
		// Isso permite que o componente que chamou loginUser também trate o erro.
		throw new Error(errorMessage);
	}
};

// Você pode adicionar outras funções aqui (register, logout, etc.)
