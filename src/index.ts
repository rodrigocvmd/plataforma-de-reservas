import express from "express";
import healthRouter from "./routes/health";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
	res.send("Servidor está rodando");
});

app.use("/api", healthRouter);

app.listen(port, () => {
	console.log(`Servidor rodando na porta ${port} `);
});
