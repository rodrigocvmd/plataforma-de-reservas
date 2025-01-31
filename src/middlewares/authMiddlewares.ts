import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

interface JwtPayload {
	id: string;
	email: string;
	role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		res.status(401).json({ error: "Token não fornecido ou inválido" });
		return;
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
		req.user = { ...decoded, id: Number(decoded.id), role: decoded.role as Role };
		next();
	} catch (error) {
		console.error("Erro ao verificar token:", error);
		res.status(401).json({ error: "Token inválido ou expirado." });
		return;
	}
};
