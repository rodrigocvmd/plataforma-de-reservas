import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		message: "API is running",
	});
});

export default healthRouter;
