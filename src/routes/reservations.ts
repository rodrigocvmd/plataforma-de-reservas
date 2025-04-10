import { PrismaClient, Role, Reservation } from "@prisma/client"; // <<< Adicionado Role
import { Request, Response, Router } from "express";
import { isTimeSlotAvailable } from "../services/reservationService"; // <<< Corrigido path
import { verifyToken } from "../middlewares/authMiddlewares"; // <<< Adicionado
import { verifyRole } from "../middlewares/roleMiddleware"; // <<< Adicionado

const reservationRouter = Router();
const prisma = new PrismaClient();

// Rota para listar TODAS as reservas (APENAS ADMIN)
reservationRouter.get(
	"/",
	verifyToken,
	verifyRole(Role.ADMIN),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const reservations = await prisma.reservation.findMany({
				include: {
					user: { select: { id: true, name: true, email: true } },
					resource: true,
				},
			});
			res.status(200).json(reservations);
			return;
		} catch (error) {
			const errMessage = (error as Error).message;
			console.error("Erro ao listar reservas:", error); // Log do erro
			res.status(500).json({ error: "Não foi possível listar as reservas.", details: errMessage });
			return;
		}
	}
);

reservationRouter.get(
	"/:id",
	verifyToken, // <<< Adicionado middleware de autenticação
	async (req: Request<{ id: string }>, res: Response): Promise<void> => {
		// <<< Ajustado tipo de retorno e req
		const { id } = req.params;
		const user = req.user; // <<< Obtém o usuário autenticado

		// Validação básica do ID e do usuário
		const parsedId = Number(id);
		if (isNaN(parsedId)) {
			res.status(400).json({ error: "ID inválido." });
			return;
		}
		if (!user) {
			// Embora verifyToken já faça isso, é uma boa prática verificar
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}

		try {
			const reservation = await prisma.reservation.findUnique({
				where: { id: parsedId },
				include: {
					user: { select: { id: true, name: true, email: true } },
					resource: true,
				},
			});

			if (!reservation) {
				res.status(404).json({ error: "Reserva não encontrada." });
				return;
			}

			// <<< VERIFICAÇÃO DE PERMISSÃO >>>
			const isAdmin = user.role === Role.ADMIN;
			const isOwner = user.id === reservation.userId;

			if (!isAdmin && !isOwner) {
				res.status(403).json({
					error: "Acesso negado. Você não tem permissão para visualizar esta reserva.",
				});
				return;
			}
			// ------------------------------------

			res.status(200).json(reservation);
			return; // <<< Adicionado retorno explícito
		} catch (error) {
			const errMessage = (error as Error).message;
			console.error("Erro ao buscar reserva:", error); // Log do erro
			res.status(500).json({ error: "Erro ao buscar a reserva.", details: errMessage });
			return; // <<< Adicionado retorno explícito
		}
	}
);

// Rota para CRIAR uma nova reserva (Qualquer usuário autenticado)
reservationRouter.post(
	"/",
	verifyToken, // <<< Adicionado middleware de autenticação
	async (req: Request, res: Response): Promise<void> => {
		// <<< Ajustado tipo para void
		// Não pegar userId do body por segurança!
		const { resourceId, startTime, endTime } = req.body;
		const user = req.user; // <<< Obtém o usuário autenticado

		// Validação básica
		if (!user) {
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}
		if (!resourceId || !startTime || !endTime) {
			res.status(400).json({ error: "resourceId, startTime e endTime são obrigatórios." });
			return;
		}
		const numericResourceId = Number(resourceId);
		if (isNaN(numericResourceId)) {
			res.status(400).json({ error: "resourceId inválido." });
			return;
		}

		try {
			// Converter as strings de data para objetos Date
			const newStartTime = new Date(startTime);
			const newEndTime = new Date(endTime);
			if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) {
				res.status(400).json({ error: "Formato de data/hora inválido." });
				return;
			}
			if (newStartTime >= newEndTime) {
				res.status(400).json({ error: "O startTime deve ser anterior ao endTime." });
				return;
			}

			// Validação da disponibilidade do horário (lógica existente)
			const { available, reason } = await isTimeSlotAvailable({
				resourceId: numericResourceId,
				startTime: newStartTime,
				endTime: newEndTime,
			});

			if (!available) {
				// Usar 409 Conflict pode ser mais apropriado aqui do que 400 Bad Request
				res.status(409).json({
					error: "Horário indisponível",
					details: reason,
				});
				return;
			}

			// Se a validação passar, cria a reserva USANDO O ID DO USUÁRIO AUTENTICADO
			const reservation: Reservation = await prisma.reservation.create({
				// <<< Tipando o retorno
				data: {
					userId: user.id, // <<< MUITO IMPORTANTE: Usar o ID do token!
					resourceId: numericResourceId,
					startTime: newStartTime,
					endTime: newEndTime,
				},
			});

			res.status(201).json(reservation);
			return;
		} catch (error) {
			const errMessage = (error as Error).message;
			console.error("Erro ao criar reserva:", error);
			res.status(500).json({
				error: "Não foi possível confirmar a reserva",
				details: errMessage,
			});
			return;
		}
	}
);

// Rota para DELETAR uma reserva (ADMIN ou Dono da Reserva)
reservationRouter.delete(
	"/:id",
	verifyToken, // <<< Adicionado middleware de autenticação
	async (req: Request<{ id: string }>, res: Response): Promise<void> => {
		// <<< Ajustado tipo de retorno e req
		const { id } = req.params;
		const user = req.user; // <<< Obtém o usuário autenticado

		// Validação básica do ID e do usuário
		const parsedId = Number(id);
		if (isNaN(parsedId)) {
			res.status(400).json({ error: "ID inválido." });
			return;
		}
		if (!user) {
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}

		try {
			// 1. Buscar a reserva para verificar existência e propriedade
			//    Selecionar apenas o userId é suficiente para a verificação de permissão
			const reservation = await prisma.reservation.findUnique({
				where: { id: parsedId },
				select: { userId: true }, // <<< Selecionar apenas o necessário
			});

			if (!reservation) {
				res.status(404).json({ error: "Reserva não encontrada." });
				return;
			}

			// <<< VERIFICAÇÃO DE PERMISSÃO >>>
			const isAdmin = user.role === Role.ADMIN;
			const isOwner = user.id === reservation.userId;

			if (!isAdmin && !isOwner) {
				res.status(403).json({
					error: "Acesso negado. Você não tem permissão para deletar esta reserva.",
				});
				return;
			}
			// ------------------------------------

			// 2. Proceder com a exclusão se a permissão for válida
			await prisma.reservation.delete({
				where: {
					id: parsedId, // Usar o ID parseado e validado
				},
			});

			res.status(204).send(); // Retorna 204 No Content (sucesso sem corpo)
			return;
		} catch (error) {
			const errMessage = (error as Error).message;
			console.error("Erro ao deletar reserva:", error);
			// Tratamento de erro genérico. Prisma pode lançar erros específicos (ex: P2025 se o registro sumir entre a busca e o delete)
			res.status(500).json({
				error: "Não foi possível deletar a reserva.",
				details: errMessage,
			});
			return;
		}
	}
);

export default reservationRouter;
