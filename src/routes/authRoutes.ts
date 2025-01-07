import { Request, Response, NextFunction } from "express";
import { loginUser, registerUser } from "controllers/authController";
import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { protectedResourceController } from "../controllers/protectedResourceController";

const router = Router();

const asyncHandler =
	(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
	(req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};

router.get("/protected", verifyToken, protectedResourceController);
router.post("/register", asyncHandler(registerUser));
router.post("/login", asyncHandler(loginUser));

export default router;
