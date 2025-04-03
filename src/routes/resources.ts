import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middlewares/authMiddlewares";

const resourceRouters = Router();
const prisma = new PrismaClient();

resourceRouters.get("/", verifyToken, async (req, res) => {
	try {
		const resources = await prisma.resource.findMany({
			include: { owner: { select: { id: true, name: true } } },
		});
		res.status(200).json(resources);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao listar espaços.", details: errMessage });
	}
});

resourceRouters.post("/", verifyToken, async (req, res): Promise<void> => {
	const { title, description } = req.body;
	const ownerId = req.user?.id;

	if (!ownerId) {
		res.status(401).json({ error: "Usuário não autenticado." });
		return;
	}

	try {
		const newResource = await prisma.resource.create({
			data: { title, description, ownerId },
		});
		res.status(201).json(newResource);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Não foi possível criar o novo espaço.", details: errMessage });
	}
});

// --- PRÓXIMOS PASSOS: Implementar PUT e DELETE com verificação de dono/admin ---

export default resourceRouters;
