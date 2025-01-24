import { Router } from "express";
import { verifyToken } from "middlewares/authMiddlewares";
import { verifyRole } from "middlewares/roleMiddleware";
import { getUserById, updateUser, deleteUser } from "controllers/userController";
import { Role } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const usersRouters = Router();
const prisma = new PrismaClient();

usersRouters.get("/", verifyToken, verifyRole(Role.ADMIN), async (_, res) => {
	try {
		const users = await prisma.user.findMany({
			select: { id: true, name: true, email: true, role: true },
		});
		res.status(200).json(users);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao listar usuários.", details: errMessage });
	}
});

usersRouters.post("/", verifyToken, verifyRole(Role.ADMIN), async (req, res): Promise<void> => {
	const { name, email, password, role } = req.body;

	if (!name || !email || !password) {
		res.status(400).json({ error: "Todos os campos são obrigatórios." });
		return;
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: { name, email, password: hashedPassword, role: role || "USER" },
			select: { id: true, name: true, email: true, role: true },
		});
		res.status(201).json(newUser);
	} catch (error) {
		const errMessage = (error as Error).message;
		res.status(500).json({ error: "Erro ao criar usuários.", details: errMessage });
	}
});

usersRouters.get("/:id", verifyToken, verifyRole(Role.ADMIN, true), getUserById);

usersRouters.put("/:id", verifyToken, verifyRole(Role.ADMIN, true), updateUser);

usersRouters.delete("/:id", verifyToken, verifyRole(Role.ADMIN, true), deleteUser);

export default usersRouters;
