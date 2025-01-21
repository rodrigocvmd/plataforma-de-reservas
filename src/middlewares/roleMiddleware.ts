import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client"; // Importando os papéis definidos no banco

export const verifyRole = (requiredRole: Role) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({ error: "Usuário não autenticado." });
		}

		if (req.user.role !== requiredRole) {
			return res.status(403).json({ error: "Acesso negado. Permissão insuficiente." });
		}

		next();
	};
};
