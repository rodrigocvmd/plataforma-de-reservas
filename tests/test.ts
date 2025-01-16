import request from "supertest";
import { app, server } from "../src/index";

// describe("Testes de Autenticação", () => {
// 	let token = "";

// 	it("Deve registrar um novo usuário", async () => {
// 		const res = await request(app).post("/api/autenticacao/register").send({
// 			email: "test@example.com",
// 			password: "123456",
// 			name: "Usuário Teste",
// 			role: "user",
// 		});

// 		expect(res.status).toBe(201);
// 		expect(res.body).toHaveProperty("user");
// 	});

// 	it("Deve fazer login e receber um token", async () => {
// 		const res = await request(app).post("/api/autenticacao/login").send({
// 			email: "test@example.com",
// 			password: "123456",
// 		});

// 		expect(res.status).toBe(200);
// 		expect(res.body).toHaveProperty("token");

// 		token = res.body.token;
// 	});

// 	it("Deve bloquear acesso à rota protegida sem token", async () => {
// 		const res = await request(app).get("/api/autenticacao/protected");
// 		expect(res.status).toBe(401);
// 		expect(res.body).toHaveProperty("error");
// 	});

// 	it("Deve permitir acesso à rota protegida com token válido", async () => {
// 		const res = await request(app)
// 			.get("/api/autenticacao/protected")
// 			.set("Authorization", `Bearer ${token}`);

// 		expect(res.status).toBe(200);
// 		expect(res.body).toHaveProperty("user");
// 	});
// });

const generateRandomEmail = () => `test${Date.now()}@example.com`;

afterAll(async () => {
	server.close();
});

describe("Testes de Autenticação", () => {
	it("Deve registrar um novo usuário", async () => {
		const res = await request(app).post("/api/autenticacao/register").send({
			email: generateRandomEmail(),
			password: "123456TESTERANDOM",
			name: "Usuário Teste TESTERANDOM",
		});

		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty("user");
	});
});
