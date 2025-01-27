import request from "supertest";
import { app, server } from "../src/index"; // Certifique-se de que está importando corretamente seu app

let adminToken = "";
let userToken = "";
let userId = "";
let adminId = "";

beforeAll(async () => {
	// Criar Admin
	const adminRes = await request(app).post("/api/autenticacao/register").send({
		email: "admin@example.com",
		password: "admin123",
		name: "Admin User",
		role: "ADMIN",
	});

	adminId = adminRes.body.user.id;

	const adminLogin = await request(app).post("/api/autenticacao/login").send({
		email: "admin@example.com",
		password: "admin123",
	});

	adminToken = adminLogin.body.token;

	// Criar Usuário Comum
	const userRes = await request(app).post("/api/autenticacao/register").send({
		email: "user@example.com",
		password: "user123",
		name: "Normal User",
		role: "USER",
	});

	userId = userRes.body.user.id;

	const userLogin = await request(app).post("/api/autenticacao/login").send({
		email: "user@example.com",
		password: "user123",
	});

	userToken = userLogin.body.token;
});

afterAll(() => {
	server.close();
});

describe("Testes de Autorização e Acesso", () => {
	it("Usuário comum deve acessar apenas seus próprios dados", async () => {
		const res = await request(app)
			.get(`/api/usuarios/${userId}`)
			.set("Authorization", `Bearer ${userToken}`);

		expect(res.status).toBe(200);
		expect(res.body.id).toBe(userId);
	});

	it("Usuário comum NÃO deve acessar outro usuário", async () => {
		const res = await request(app)
			.get(`/api/usuarios/${adminId}`)
			.set("Authorization", `Bearer ${userToken}`);

		expect(res.status).toBe(403);
		expect(res.body.error).toBe("Acesso negado. Permissão insuficiente.");
	});

	it("Admin deve conseguir acessar qualquer usuário", async () => {
		const res = await request(app)
			.get(`/api/usuarios/${userId}`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
	});

	it("Usuário comum NÃO pode criar um novo usuário manualmente", async () => {
		const res = await request(app)
			.post("/api/usuarios")
			.set("Authorization", `Bearer ${userToken}`)
			.send({
				email: "forbidden@example.com",
				password: "123456",
				name: "Usuário Proibido",
				role: "USER",
			});

		expect(res.status).toBe(403);
		expect(res.body.error).toBe("Acesso negado. Permissão insuficiente.");
	});

	it("Admin pode criar um novo usuário", async () => {
		const res = await request(app)
			.post("/api/usuarios")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({
				email: "newuser@example.com",
				password: "123456",
				name: "Novo Usuário",
				role: "USER",
			});

		expect(res.status).toBe(201);
		expect(res.body.name).toBe("Novo Usuário");
	});

	it("Usuário comum NÃO pode excluir outro usuário", async () => {
		const res = await request(app)
			.delete(`/api/usuarios/${adminId}`)
			.set("Authorization", `Bearer ${userToken}`);

		expect(res.status).toBe(403);
		expect(res.body.error).toBe("Acesso negado. Permissão insuficiente.");
	});

	it("Admin pode excluir um usuário", async () => {
		const res = await request(app)
			.delete(`/api/usuarios/${userId}`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(res.status).toBe(200);
		expect(res.body.message).toBe("Usuário deletado com sucesso.");
	});
});
