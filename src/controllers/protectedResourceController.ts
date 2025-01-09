import { Request, Response } from "express";

export const protectedResourceController = (req: Request, res: Response) => {
	// Supondo que o middleware de autenticação já anexou os dados do usuário em req.user
	return res.status(200).json({
		message: "Você acessou um recurso protegido!",
		user: req.user, // Exibe os dados do usuário autenticado
	});
};
