import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client"; // Importando os papéis definidos no banco

export const verifyRole = (requiredRole: Role, checkSelf = false) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({ error: "Usuário não autenticado." });
			return;
		}

		if (checkSelf && req.user.id === Number(req.params.id)) {
			return next();
		}

		if (req.user.role !== requiredRole) {
			res.status(403).json({ error: "Acesso negado. Permissão insuficiente." });
			return;
		}

		next();
	};
};
