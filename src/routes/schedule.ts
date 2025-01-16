import { PrismaClient } from "@prisma/client";
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

scheduleRouter.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
	const { id } = req.params;
	const { startTime, endTime, isAvailable } = req.body;

	try {
		const updatedSchedule = await prisma.schedule.update({
			where: { id: Number(id) },
			data: {
				startTime: new Date(startTime),
				endTime: new Date(endTime),
				isAvailable: isAvailable ?? true,
			},
		});
		res.status(200).json(updatedSchedule);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao atualizar horário", details: errMessage });
	}
});

scheduleRouter.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
	const { id } = req.params;
	try {
		await prisma.schedule.delete({
			where: { id: Number(id) },
		});
		res.status(200).json({ message: "Horário removido com sucesso" });
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao remover horário", details: errMessage });
	}
});

scheduleRouter.post("/unavailable-slot", async (req: Request, res: Response): Promise<any> => {
	const { resourceId, startTime, endTime } = req.body;

	try {
		const newStartTime = new Date(startTime);
		const newEndTime = new Date(endTime);

		// Validar se há conflitos
		const conflicts = await prisma.unavailableSlot.findMany({
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
				error: "Bloqueio conflitante",
				details: "O horário já está bloqueado",
			});
		}

		const unavailableSlot = await prisma.unavailableSlot.create({
			data: {
				resourceId: Number(resourceId),
				startTime: new Date(startTime),
				endTime: new Date(endTime),
			},
		});
		res.status(201).json(unavailableSlot);
	} catch (error) {
		res
			.status(500)
			.json({ error: "Erro ao criar bloqueio de horário", details: (error as Error).message });
	}
});

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

scheduleRouter.delete(
	"/unavailable-slot/:id",
	async (req: Request<{ id: string }>, res: Response) => {
		const { id } = req.params;

		try {
			await prisma.unavailableSlot.delete({
				where: { id: Number(id) },
			});
			res.status(200).json({ message: "Bloqueio de horário removido com sucesso" });
		} catch (error) {
			const errMessage = (error as Error).message;
			res.status(500).json({ error: "Erro ao remover o bloqueio de horário", details: errMessage });
		}
	}
);

//teste

export default scheduleRouter;
