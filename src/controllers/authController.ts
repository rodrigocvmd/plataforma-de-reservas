import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "102030";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1H";

export const registerUser = async (req: Request, res: Response) => {
	const { email, password, name, role } = req.body;

	if (!email || !password || !name) {
		return res.status(400).json({ error: "Todos os campos são obrigatórios" });
	}

	try {
		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return res.status(400).json({ error: "Email já cadastrado." });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name,
				role: role || "user",
			},
		});

		return res.status(201).json({
			message: "Usuário registrado com sucesso.",
			user: { id: newUser.id, email: newUser.email },
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Erro interno do servidor." });
	}
};

export const loginUser = async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "Todos os campos são obrigatórios." });
	}

	try {
		const user = await prisma.user.findUnique({ where: { email } });

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ error: "Email ou Senha inválidos." });
		}

		const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN,
		});

		return res.status(200).json({ message: "Login bem sucedido.", token });
	} catch (error) {
		console.error("Erro capturado no logn:", error);
		return res.status(500).json({ error: "Erro interno de servidor." });
	}
};
