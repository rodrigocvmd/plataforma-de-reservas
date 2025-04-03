import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import { isTimeSlotAvailable } from "services/reservationService";

const reservationRouter = Router();
const prisma = new PrismaClient();

reservationRouter.get("/", async (req, res) => {
	try {
		const reservations = await prisma.reservation.findMany({
			include: { user: true, resource: true },
		});
		res.status(200).json(reservations);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Não foi possível listar as reservas.", details: errMessage });
	}
});

reservationRouter.get(
	"/:id",
	/* eslint-disable @typescript-eslint/no-explicit-any */
	async (req: Request<{ id: string }>, res: Response): Promise<any> => {
		const { id } = req.params;

		const parsedId = Number(id);
		if (isNaN(parsedId)) {
			return res.status(400).json({ error: "ID inválido." });
		}

		try {
			const reservation = await prisma.reservation.findUnique({
				where: { id: parsedId },
				include: { user: true, resource: true },
			});

			if (!reservation) {
				return res.status(404).json({ error: "Reserva não encontrada." });
			}

			res.status(200).json(reservation);
		} catch (error) {
			const errMessage = (error as Error).message;
			res.status(500).json({ error: "Erro ao buscar a reserva.", details: errMessage });
		}
	}
);

reservationRouter.post("/", async (req: Request, res: Response): Promise<any> => {
	const { userId, resourceId, startTime, endTime } = req.body;

	try {
		// Converter as strings de data para objetos Date
		const newStartTime = new Date(startTime);
		const newEndTime = new Date(endTime);

		// Validação da disponibilidade do horário:
		// 1. Verifica se o recurso não está bloqueado;
		// 2. Verifica se há um horário disponível (Schedule) que cubra o período solicitado;
		// 3. Verifica se não há conflito com algum UnavailableSlot.
		const { available, reason } = await isTimeSlotAvailable({
			resourceId: Number(resourceId),
			startTime: newStartTime,
			endTime: newEndTime,
		});

		if (!available) {
			return res.status(400).json({
				error: "Horário indisponível",
				details: reason,
			});
		}

		// Se a validação passar, cria a reserva
		const reservation = await prisma.reservation.create({
			data: {
				userId: Number(userId),
				resourceId: Number(resourceId),
				startTime: newStartTime,
				endTime: newEndTime,
			},
		});

		res.status(201).json(reservation);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({
			error: "Não foi possível confirmar a reserva",
			details: errMessage,
		});
	}
});

reservationRouter.delete("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const reservation = await prisma.reservation.delete({
			where: {
				id: parseInt(id),
			},
		});

		res.status(200).json({
			message: "Reserva deletada com sucesso",
			reservation,
		});
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({
			error: "Não foi possível deletar a reserva.",
			details: errMessage,
		});
	}
});

//teste

export default reservationRouter;
