import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

export const getUserById = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const { id } = req.params;

	try {
		const user = await prisma.user.findUnique({
			where: { id: Number(id) },
			select: { id: true, email: true, name: true, role: true },
		});

		if (!user) {
			res.status(404).json({ error: "Usuário não encontrado" });
			return;
		}

		res.status(404).json({ user });
		return;
	} catch (error) {
		console.error("Erro ao buscar usuário:", error);
		// return res.status(500).json({ error: "Erro interno do servidor." });
		next(error);
	}
};

export const updateUser = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const { id } = req.params;
	const { name, email, role } = req.body;

	try {
		const user = await prisma.user.findUnique({ where: { id: Number(id) } });

		if (!user) {
			res.status(404).json({ error: "Usuário não encontrado." });
			return;
		}

		const updateUser = await prisma.user.update({
			where: { id: Number(id) },
			data: { name, email, role },
			select: { id: true, email: true, name: true, role: true },
		});
		res.status(200).json(updateUser);
		return;
	} catch (error) {
		console.error("Erro ao atualizar usuário:", error);
		// return res.status(500).json({ error: "Erro interno do servidor." });
		next(error);
	}
};

export const deleteUser = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const { id } = req.params;

	try {
		const user = await prisma.user.findUnique({ where: { id: Number(id) } });

		if (!user) {
			res.status(404).json({ error: "Usuário não encontrado." });
			return;
		}

		await prisma.user.delete({ where: { id: Number(id) } });
		res.status(200).json({ message: "Usuário deletado com sucesso." });
		return;
	} catch (error) {
		console.error("Erro ao deletar usuário:", error);
		// return res.status(500).json({ error: "Erro interno do servidor." });
		next(error);
	}
};
