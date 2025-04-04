import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { verifyToken } from "../middlewares/authMiddlewares";

const resourceRouters = Router();
const prisma = new PrismaClient();

resourceRouters.get("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
	try {
		const resources = await prisma.resource.findMany({
			include: { owner: { select: { id: true, name: true } } },
		});
		res.status(200).json(resources);
		return;
	} catch (error) {
		const errMessage = (error as Error).message;
		console.error("Erro ao listar espaços:", error);
		res.status(500).json({ error: "Erro ao listar espaços.", details: errMessage });
		return;
	}
});

resourceRouters.post("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
	const { title, description } = req.body;
	const ownerId = req.user?.id;

	if (!ownerId) {
		res.status(401).json({ error: "Usuário não autenticado." });
		return;
	}

	if (!title || !description) {
		res.status(400).json({ error: "Título e descrição são obrigatórios." });
		return;
	}

	try {
		const newResource = await prisma.resource.create({
			data: { title, description, ownerId },
		});
		res.status(201).json(newResource);
	} catch (error) {
		const errMessage = (error as Error).message;
		console.error("Erro ao criar espaço:", error);
		res.status(500).json({ error: "Não foi possível criar o novo espaço.", details: errMessage });
		return;
	}
});

resourceRouters.put("/:id", verifyToken, async (req: Request, res: Response): Promise<void> => {
	const { id } = req.params;
	const { title, description, isBlocked } = req.body; // Campos que podem ser atualizados
	const user = req.user;

	// 1. Validar se o usuário está autenticado (já feito pelo verifyToken, mas checamos req.user)
	if (!user) {
		res.status(401).json({ error: "Usuário não autenticado." });
		return;
	}

	// 2. Validar e converter o ID do recurso
	const resourceId = parseInt(id);
	if (isNaN(resourceId)) {
		res.status(400).json({ error: "ID do recurso inválido." });
		return;
	}

	try {
		// 3. Buscar o recurso no banco para verificar existência e propriedade
		const resource = await prisma.resource.findUnique({
			where: { id: resourceId },
			select: { ownerId: true }, // Só precisamos do ownerId para a verificação
		});

		// 4. Verificar se o recurso existe
		if (!resource) {
			res.status(404).json({ error: "Recurso não encontrado." });
			return;
		}

		// 5. Verificar Permissão: É admin OU é o dono do recurso?
		const isAdmin = user.role === Role.ADMIN;
		const isOwner = user.id === resource.ownerId;

		if (!isAdmin && !isOwner) {
			res.status(403).json({ error: "Você não tem permissão para editar este recurso." });
			return;
		}

		// 6. Preparar dados para atualização (apenas campos fornecidos)
		const dataToUpdate: { title?: string; description?: string; isBlocked?: boolean } = {};
		if (title !== undefined) dataToUpdate.title = title;
		if (description !== undefined) dataToUpdate.description = description;
		// Apenas o Admin ou o dono podem bloquear/desbloquear? Ou só Admin? Vamos assumir que ambos podem por enquanto.
		if (isBlocked !== undefined) dataToUpdate.isBlocked = isBlocked;

		if (Object.keys(dataToUpdate).length === 0) {
			res.status(400).json({ error: "Nenhum dado fornecido para atualização." });
			return;
		}

		// 7. Executar a atualização
		const updatedResource = await prisma.resource.update({
			where: { id: resourceId },
			data: dataToUpdate,
		});

		// 8. Retornar o recurso atualizado
		res.status(200).json(updatedResource);
		return;
	} catch (error) {
		const errMessage = (error as Error).message;
		console.error("Erro ao atualizar recurso:", error);
		// Adicionar verificação para erros específicos do Prisma se necessário (ex: P2025 - Record not found)
		res.status(500).json({ error: "Erro interno ao atualizar o recurso.", details: errMessage });
		return;
	}
});

resourceRouters.delete("/:id", verifyToken, async (req: Request, res: Response): Promise<void> => {
	const { id } = req.params;
	const user = req.user;

	// 1. Validar se o usuário está autenticado
	if (!user) {
		res.status(401).json({ error: "Usuário não autenticado." });
		return;
	}

	// 2. Validar e converter o ID do recurso
	const resourceId = parseInt(id);
	if (isNaN(resourceId)) {
		res.status(400).json({ error: "ID do recurso inválido." });
		return;
	}

	try {
		// 3. Buscar o recurso no banco para verificar existência e propriedade
		const resource = await prisma.resource.findUnique({
			where: { id: resourceId },
			select: { ownerId: true },
		});

		// 4. Verificar se o recurso existe
		if (!resource) {
			res.status(404).json({ error: "Recurso não encontrado." });
			return;
		}

		// 5. Verificar Permissão: É admin OU é o dono do recurso?
		const isAdmin = user.role === Role.ADMIN;
		const isOwner = user.id === resource.ownerId;

		if (!isAdmin && !isOwner) {
			res
				.status(403)
				.json({ error: "Acesso negado. Você não tem permissão para deletar este recurso." });
			return;
		}

		// 6. Executar a exclusão
		// !!! ATENÇÃO: Isso pode falhar se houver Reservas, Horários ou Slots Bloqueados associados
		//     e a constraint no banco for RESTRICT. Precisamos decidir como lidar com isso:
		//     a) Deletar em cascata (configurar no Prisma schema com onDelete: Cascade) - PERIGOSO
		//     b) Impedir a exclusão se houver dependências (retornar um erro 409 Conflict) - MAIS SEGURO
		//     c) Deletar as dependências manualmente antes (mais complexo)
		//     Por agora, vamos tentar deletar e tratar o erro se ocorrer.
		await prisma.resource.delete({
			where: { id: resourceId },
		});

		// 7. Retornar sucesso (204 No Content é apropriado para DELETE sem corpo de resposta)
		res.status(204).send();
		return;
	} catch (error: unknown) {
		// Use unknown
		// Verificar se é um erro com a propriedade 'code' (típico de erros Prisma)
		if (typeof error === "object" && error !== null && "code" in error) {
			const prismaError = error as { code?: string; message?: string }; // Type assertion segura após a verificação
			if (prismaError.code === "P2003") {
				console.error("Erro ao deletar recurso: Existem registros dependentes.", error);
				res.status(409).json({
					error: "Não é possível deletar o recurso.",
					details: "Existem reservas ou horários associados a este recurso. Remova-os primeiro.",
				});
				return;
			}
		}

		// Tratamento genérico para outros tipos de erro
		let errMessage = "Erro desconhecido";
		if (error instanceof Error) {
			// Verifica se é uma instância de Error padrão
			errMessage = error.message;
		} else if (typeof error === "string") {
			errMessage = error;
		}

		console.error("Erro ao deletar recurso:", error);
		res.status(500).json({ error: "Erro interno ao deletar o recurso.", details: errMessage });
		return;
	}
});

export default resourceRouters;
