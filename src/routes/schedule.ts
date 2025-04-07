import { PrismaClient, Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import { verifyToken } from "../middlewares/authMiddlewares";

const scheduleRouter = Router();
const prisma = new PrismaClient();

scheduleRouter.use(verifyToken);

scheduleRouter.get("/unavailable-slot/", async (req: Request, res: Response) => {
	try {
		console.log("Executando consulta no modelo UnavailableSlot");
		const unavailableSlots = await prisma.unavailableSlot.findMany();
		console.log("Resultado da consulta:", unavailableSlots);
		res.status(200).json(unavailableSlots);
	} catch (error) {
		console.error("Erro ao buscar horários bloqueados:", error); // Log do erro
		res.status(500).json({
			error: "Erro ao buscar todos os horários bloqueados.",
			details: (error as Error).message,
		});
	}
});

scheduleRouter.get("/:resourceId", async (req: Request<{ resourceId: string }>, res: Response) => {
	const { resourceId } = req.params;

	try {
		const schedules = await prisma.schedule.findMany({
			where: { resourceId: Number(resourceId) },
			orderBy: { startTime: "asc" },
		});
		res.status(200).json(schedules);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao buscar horários.", details: errMessage });
	}
});

/* eslint-disable @typescript-eslint/no-explicit-any */
scheduleRouter.post("/", async (req: Request, res: Response): Promise<any> => {
	const { resourceId, startTime, endTime, isAvailable } = req.body;

	try {
		const newStartTime = new Date(startTime);
		const newEndTime = new Date(endTime);

		const conflicts = await prisma.schedule.findMany({
			where: {
				resourceId: Number(resourceId),
				OR: [
					{
						startTime: { lte: newEndTime },
						endTime: { gte: newStartTime },
					},
				],
			},
		});

		if (conflicts.length > 0) {
			return res.status(400).json({
				error: "Horário já disponível para resesrva",
				details: "O horário escolhido já foi disponibilizado",
			});
		}

		const schedule = await prisma.schedule.create({
			data: {
				resourceId: Number(resourceId),
				startTime: new Date(startTime),
				endTime: new Date(endTime),
				isAvailable: isAvailable ?? false,
			},
		});

		res.status(201).json(schedule);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao criar horário", details: errMessage });
	}
});

scheduleRouter.put(
	"/:id",
	verifyToken,
	async (req: Request<{ id: string }>, res: Response): Promise<void> => {
		const { id } = req.params;
		const { startTime, endTime, isAvailable } = req.body;
		const user = req.user;

		// 1. Validar ID do horário e usuário autenticado
		const scheduleId = parseInt(id);
		if (isNaN(scheduleId)) {
			res.status(400).json({ error: "ID do horário inválido." });
			return;
		}
		if (!user) {
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}

		// 2. Validar dados de entrada (datas, se fornecidas)
		let newStartTime: Date | undefined;
		let newEndTime: Date | undefined;
		if (startTime) {
			newStartTime = new Date(startTime);
			if (isNaN(newStartTime.getTime())) {
				res.status(400).json({ error: "Formato de startTime inválido." });
				return;
			}
		}
		if (endTime) {
			newEndTime = new Date(endTime);
			if (isNaN(newEndTime.getTime())) {
				res.status(400).json({ error: "Formato de endTime inválido." });
				return;
			}
		}
		if (newStartTime && newEndTime && newStartTime >= newEndTime) {
			res.status(400).json({ error: "O startTime deve ser anterior ao endTime." });
			return;
		}

		try {
			// 3. Buscar o horário existente para obter o resourceId
			const existingSchedule = await prisma.schedule.findUnique({
				where: { id: scheduleId },
				select: { resourceId: true, startTime: true, endTime: true }, // Seleciona resourceId e tempos atuais
			});

			if (!existingSchedule) {
				res.status(404).json({ error: "Horário não encontrado." });
				return;
			}

			// 4. Buscar o Recurso associado para verificar a propriedade
			const resource = await prisma.resource.findUnique({
				where: { id: existingSchedule.resourceId },
				select: { ownerId: true },
			});

			if (!resource) {
				// Isso seria um estado inconsistente do DB, mas é bom verificar
				res.status(404).json({ error: "Recurso associado ao horário não encontrado." });
				return;
			}

			// 5. <<< VERIFICAÇÃO DE PERMISSÃO >>>
			const isAdmin = user.role === Role.ADMIN;
			const isOwner = user.id === resource.ownerId;

			if (!isAdmin && !isOwner) {
				res.status(403).json({
					error: "Acesso negado. Você não tem permissão para editar horários deste recurso.",
				});
				return;
			}
			// ------------------------------------

			// 6. Preparar dados para atualização
			const dataToUpdate: { startTime?: Date; endTime?: Date; isAvailable?: boolean } = {};
			if (newStartTime) dataToUpdate.startTime = newStartTime;
			if (newEndTime) dataToUpdate.endTime = newEndTime;
			if (isAvailable !== undefined) dataToUpdate.isAvailable = Boolean(isAvailable);

			// Determinar o intervalo final para verificação de conflito
			const finalStartTime = newStartTime ?? existingSchedule.startTime;
			const finalEndTime = newEndTime ?? existingSchedule.endTime;

			// 7. Verificar conflitos com OUTROS horários do mesmo recurso
			const conflicts = await prisma.schedule.findMany({
				where: {
					resourceId: existingSchedule.resourceId,
					id: { not: scheduleId }, // Exclui o próprio horário que está sendo editado
					OR: [
						{
							startTime: { lt: finalEndTime },
							endTime: { gt: finalStartTime },
						},
					],
				},
			});

			if (conflicts.length > 0) {
				res.status(409).json({
					error: "Conflito de Horário",
					details:
						"A atualização causa sobreposição com outro horário existente para este recurso.",
					conflictingSchedules: conflicts,
				});
				return;
			}

			// 8. Executar a atualização
			const updatedSchedule = await prisma.schedule.update({
				where: { id: scheduleId },
				data: dataToUpdate,
			});

			res.status(200).json(updatedSchedule);
			return;
		} catch (error: unknown) {
			let errMessage = "Erro desconhecido ao atualizar horário";
			if (error instanceof Error) {
				errMessage = error.message;
			}
			console.error("Erro ao atualizar horário:", error);
			res.status(500).json({ error: "Erro interno ao atualizar horário", details: errMessage });
			return;
		}
	}
);

// Rota para DELETAR um horário disponível (Schedule)
scheduleRouter.delete(
	"/:id",
	verifyToken,
	async (req: Request<{ id: string }>, res: Response): Promise<void> => {
		const { id } = req.params;
		const user = req.user;

		// 1. Validar ID e usuário
		const scheduleId = parseInt(id);
		if (isNaN(scheduleId)) {
			res.status(400).json({ error: "ID do horário inválido." });
			return;
		}
		if (!user) {
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}

		try {
			// 2. Buscar o horário para obter o resourceId
			const schedule = await prisma.schedule.findUnique({
				where: { id: scheduleId },
				select: { resourceId: true },
			});

			if (!schedule) {
				res.status(404).json({ error: "Horário não encontrado." });
				return;
			}

			// 3. Buscar o Recurso associado para verificar a propriedade
			const resource = await prisma.resource.findUnique({
				where: { id: schedule.resourceId },
				select: { ownerId: true },
			});

			if (!resource) {
				res.status(404).json({ error: "Recurso associado ao horário não encontrado." });
				return;
			}

			// 4. <<< VERIFICAÇÃO DE PERMISSÃO >>>
			const isAdmin = user.role === Role.ADMIN;
			const isOwner = user.id === resource.ownerId;

			if (!isAdmin && !isOwner) {
				res.status(403).json({
					error: "Acesso negado. Você não tem permissão para deletar horários deste recurso.",
				});
				return;
			}
			// ------------------------------------

			// 5. Executar a exclusão
			// ATENÇÃO: Se houver RESERVAS feitas neste horário específico, a exclusão pode falhar
			// devido a constraints. Diferente do recurso, talvez seja OK deletar um horário
			// mesmo com reservas (elas ficariam "órfãs" do horário original, mas ainda ligadas ao recurso).
			// Ou podemos impedir a exclusão se houver reservas. Por ora, vamos tentar deletar.
			await prisma.schedule.delete({
				where: { id: scheduleId },
			});

			res.status(204).send(); // 204 No Content é apropriado
			return;
		} catch (error: unknown) {
			// Poderíamos adicionar um check P2003 aqui se quiséssemos impedir
			// a exclusão caso haja reservas dependentes do Schedule (menos comum)
			let errMessage = "Erro desconhecido ao remover horário";
			if (error instanceof Error) {
				errMessage = error.message;
			}
			console.error("Erro ao remover horário:", error);
			res.status(500).json({ error: "Erro interno ao remover horário", details: errMessage });
			return;
		}
	}
);

scheduleRouter.post(
	"/unavailable-slot",
	verifyToken,
	async (req: Request, res: Response): Promise<void> => {
		const { resourceId, startTime, endTime } = req.body;
		const user = req.user;

		// 1. Validações básicas
		if (!resourceId || !startTime || !endTime) {
			res.status(400).json({ error: "resourceId, startTime e endTime são obrigatórios." });
			return;
		}
		if (!user) {
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}
		const numericResourceId = Number(resourceId);
		if (isNaN(numericResourceId)) {
			res.status(400).json({ error: "resourceId inválido." });
			return;
		}
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

		try {
			// 2. Buscar o Recurso para verificar a propriedade
			const resource = await prisma.resource.findUnique({
				where: { id: numericResourceId },
				select: { ownerId: true },
			});

			if (!resource) {
				res.status(404).json({ error: "Recurso não encontrado." });
				return;
			}

			// 3. <<< VERIFICAÇÃO DE PERMISSÃO >>>
			const isAdmin = user.role === Role.ADMIN;
			const isOwner = user.id === resource.ownerId;

			if (!isAdmin && !isOwner) {
				res.status(403).json({
					error: "Acesso negado. Você não tem permissão para bloquear horários deste recurso.",
				});
				return;
			}
			// ------------------------------------

			// 4. Validar conflitos com outros UnavailableSlots (lógica existente)
			const conflicts = await prisma.unavailableSlot.findMany({
				where: {
					resourceId: numericResourceId,
					OR: [
						{
							startTime: { lt: newEndTime },
							endTime: { gt: newStartTime },
						},
					],
				},
			});

			if (conflicts.length > 0) {
				res.status(409).json({
					error: "Bloqueio conflitante",
					details: "O período solicitado se sobrepõe com um bloqueio já existente.",
					conflictingSlots: conflicts,
				});
				return;
			}

			// 5. Criar o bloqueio
			const unavailableSlot = await prisma.unavailableSlot.create({
				data: {
					resourceId: numericResourceId,
					startTime: newStartTime,
					endTime: newEndTime,
				},
			});
			res.status(201).json(unavailableSlot);
			return;
		} catch (error: unknown) {
			let errMessage = "Erro desconhecido ao criar bloqueio";
			if (error instanceof Error) {
				errMessage = error.message;
			}
			console.error("Erro ao criar bloqueio de horário:", error);
			res
				.status(500)
				.json({ error: "Erro interno ao criar bloqueio de horário", details: errMessage });
			return;
		}
	}
);

/* eslint-disable @typescript-eslint/no-explicit-any */
scheduleRouter.get(
	"/unavailable-slot/:id",
	async (req: Request<{ id: string }>, res: Response): Promise<any> => {
		const { id } = req.params;

		const parsedId = Number(id);
		if (isNaN(parsedId)) {
			return res.status(400).json({ error: "ID inválido." });
		}

		try {
			const unavailableSlot = await prisma.unavailableSlot.findUnique({
				where: { id: parsedId },
			});
			res.status(200).json(unavailableSlot);
		} catch (error) {
			const errMessage = (error as Error).message;
			res.status(500).json({ error: "Erro ao buscar horários bloqueados.", details: errMessage });
		}
	}
);

// Rota para DELETAR um bloqueio de horário (UnavailableSlot)
scheduleRouter.delete(
	"/unavailable-slot/:id",
	verifyToken,
	async (req: Request<{ id: string }>, res: Response): Promise<void> => {
		const { id } = req.params;
		const user = req.user;

		// 1. Validações
		const unavailableSlotId = parseInt(id);
		if (isNaN(unavailableSlotId)) {
			res.status(400).json({ error: "ID do bloqueio inválido." });
			return;
		}
		if (!user) {
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}

		try {
			// 2. Buscar o UnavailableSlot para obter o resourceId
			const unavailableSlot = await prisma.unavailableSlot.findUnique({
				where: { id: unavailableSlotId },
				select: { resourceId: true },
			});

			if (!unavailableSlot) {
				res.status(404).json({ error: "Bloqueio de horário não encontrado." });
				return;
			}

			// 3. Buscar o Recurso associado para verificar a propriedade
			const resource = await prisma.resource.findUnique({
				where: { id: unavailableSlot.resourceId },
				select: { ownerId: true },
			});

			if (!resource) {
				res.status(404).json({ error: "Recurso associado ao bloqueio não encontrado." });
				return;
			}

			// --- DEBUG LOGS ---
			console.log("--- DEBUG DELETE /unavailable-slot/:id ---");
			console.log("User from token (req.user):", user);
			console.log("Unavailable Slot ID from params:", unavailableSlotId);
			console.log("Fetched unavailable slot (incl. resourceId):", unavailableSlot);
			console.log("Fetched resource data (incl. ownerId):", resource);
			// --- END DEBUG LOGS ---

			// 4. <<< VERIFICAÇÃO DE PERMISSÃO >>>
			const isAdmin = user.role === Role.ADMIN;
			const isOwner = user.id === resource.ownerId;

			// --- MORE DEBUG LOGS ---
			console.log("Is Admin Check:", isAdmin);
			console.log(
				"Is Owner Check (user.id === resource.ownerId):",
				isOwner,
				`(Comparing ${user.id} with ${resource.ownerId})`
			);
			console.log("Permission check condition (!isAdmin && !isOwner):", !isAdmin && !isOwner);
			console.log("--- END MORE DEBUG LOGS ---");

			if (!isAdmin && !isOwner) {
				res.status(403).json({
					error: "Acesso negado. Você não tem permissão para remover bloqueios deste recurso.",
				});
				return;
			}
			// ------------------------------------

			// 5. Executar a exclusão
			await prisma.unavailableSlot.delete({
				where: { id: unavailableSlotId },
			});

			res.status(204).send();
			return;
		} catch (error: unknown) {
			let errMessage = "Erro desconhecido ao remover bloqueio";
			if (error instanceof Error) {
				errMessage = error.message;
			}
			console.error("Erro ao remover bloqueio de horário:", error);
			res
				.status(500)
				.json({ error: "Erro interno ao remover bloqueio de horário", details: errMessage });
			return;
		}
	}
);

export default scheduleRouter;
