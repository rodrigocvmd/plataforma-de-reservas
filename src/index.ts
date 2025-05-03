// src/index.ts (Backend)
import express from "express";
import cors from "cors"; // <<< Importar cors
import healthRouter from "./routes/health";
import usersRouters from "./routes/users";
import resourceRouters from "./routes/resources";
import scheduleRouter from "./routes/schedule";
import reservationRouter from "./routes/reservations";
import authRoutes from "./routes/authRoutes";

const app = express();
const port = process.env.PORT || 3000;

// --- Configuração do CORS ---
// Obtenha a origem do frontend da variável de ambiente ou use um padrão
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
	cors({
		origin: frontendOrigin, // Permite requisições apenas desta origem
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos permitidos
		allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
	})
);
// --------------------------

app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/autenticacao", authRoutes);
app.use("/api/usuarios", usersRouters);
app.use("/api/espacos", resourceRouters);
app.use("/api/reservas", reservationRouter);
app.use("/api/horarios", scheduleRouter);

app.get("/", (req, res) => {
	res.send("Servidor está rodando");
});

const server = app.listen(port, () => {
	console.log(`Servidor rodando na porta ${port} `);
	console.log(`Permitindo requisições CORS da origem: ${frontendOrigin}`); // Log para confirmar
});

export { app, server };
