import express from "express";
import healthRouter from "./routes/health";
import usersRouters from "./routes/users";
import resourceRouters from "./routes/resources";
import scheduleRouter from "./routes/schedule";
import reservationRouter from "./routes/reservations";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", healthRouter);

app.use("/api/usuarios", usersRouters);
app.use("/api/espacos", resourceRouters);
app.use("/api/reservas", reservationRouter);
app.use("/api/horarios", scheduleRouter);

app.get("/", (req, res) => {
	res.send("Servidor está rodando");
});

app.listen(port, () => {
	console.log(`Servidor rodando na porta ${port} `);
});
