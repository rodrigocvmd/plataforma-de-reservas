import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

interface JwtPayload {
	id: string;
	email: string;
	role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Token não fornecido ou inválido" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ error: "Token inválido ou expirado." });
	}
};
