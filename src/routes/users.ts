import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const usersRouters = Router();
const prisma = new PrismaClient();

usersRouters.get("/", async (_, res) => {
	try {
		const users = await prisma.user.findMany();
		res.status(200).json(users);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao listar usuários.", details: errMessage });
	}
});

usersRouters.post("/", async (req, res): Promise<void> => {
	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		res.status(400).json({ error: "Todos os campos são obrigatórios." });
		return;
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: { name, email, password: hashedPassword },
		});
		res.status(201).json(newUser);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao criar usuários.", details: errMessage });
	}
});

export default usersRouters;
