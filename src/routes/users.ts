import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const usersRouters = Router();
const prisma = new PrismaClient();

usersRouters.get("/", async (req, res) => {
	try {
		const users = await prisma.user.findMany();
		res.status(200).json(users);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao listar usuários.", details: errMessage });
	}
});

usersRouters.post("/", async (req, res) => {
	const { name, email } = req.body;

	try {
		const newUser = await prisma.user.create({
			data: { name, email },
		});
		res.status(201).json(newUser);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao listar usuários.", details: errMessage });
	}
});

export default usersRouters;
