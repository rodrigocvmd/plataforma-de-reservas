import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";

const scheduleRouter = Router();
const prisma = new PrismaClient();

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

scheduleRouter.post("/", async (req: Request, res: Response) => {
	const { resourceId, startTime, endTime, isAvailable } = req.body;

	try {
		const schedule = await prisma.schedule.create({
			data: {
				resourceId: Number(resourceId),
				startTime: new Date(startTime),
				endTime: new Date(endTime),
				isAvailable: isAvailable ?? true,
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

scheduleRouter.post("/unavailable-slot", async (req: Request, res: Response) => {
	const { resourceId, startTime, endTime } = req.body;

	try {
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
