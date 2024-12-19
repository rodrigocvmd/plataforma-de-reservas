import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const resourceRouters = Router();
const prisma = new PrismaClient();

resourceRouters.get("/", async (req, res) => {
	try {
		const resources = await prisma.resource.findMany();
		res.status(200).json(resources);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao listar espaços.", details: errMessage });
	}
});

resourceRouters.post("/", async (req, res) => {
	const { title, description } = req.body;

	try {
		const newResource = await prisma.resource.create({
			data: { title, description },
		});
		res.status(201).json(newResource);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Não foi possível criar o novo espaço.", details: errMessage });
	}
});

export default resourceRouters;
