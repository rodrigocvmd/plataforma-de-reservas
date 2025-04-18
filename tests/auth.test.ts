// tests/reservations-auth.test.ts (Nome sugerido para focar na autenticação)
import request from "supertest";
import { app, server } from "../src/index";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

describe("API de Reservas (/api/reservas) - Testes Mínimos de Autenticação", () => {
	let adminToken: string; // Token de um Admin
	let userToken: string;  // Token de um User comum
    let adminUserId: number;
    let userId: number;

	beforeAll(async () => {
		// --- Setup Mínimo: Criar 1 Admin, 1 User e obter tokens ---
        await prisma.user.deleteMany({ where: { email: { startsWith: 'test-min-auth-' } } });

		const adminEmail = `test-min-auth-admin-${Date.now()}@example.com`;
		const userEmail = `test-min-auth-user-${Date.now()}@example.com`;

		const adminRegRes = await request(app).post("/api/autenticacao/register").send({ email: adminEmail, password: "pw", name: "Admin Min Auth", role: Role.ADMIN });
		const userRegRes = await request(app).post("/api/autenticacao/register").send({ email: userEmail, password: "pw", name: "User Min Auth", role: Role.USER });
        adminUserId = adminRegRes.body.user.id;
        userId = userRegRes.body.user.id;


		const adminLoginRes = await request(app).post("/api/autenticacao/login").send({ email: adminEmail, password: "pw" });
		const userLoginRes = await request(app).post("/api/autenticacao/login").send({ email: userEmail, password: "pw" });
		adminToken = adminLoginRes.body.token;
		userToken = userLoginRes.body.token;
        // Não precisamos criar recursos ou reservas aqui
	});

	afterAll(async () => {
		// --- Limpeza Mínima ---
        try {
		    await prisma.user.deleteMany({ where: { id: { in: [adminUserId, userId] } } });
        } catch (error) {
            console.error("Erro na limpeza mínima:", error);
        } finally {
            await prisma.$disconnect();
		    server.close();
        }
	});

	// Rota: GET /api/reservas
	describe("GET /api/reservas", () => {
		it("Deve retornar 401 sem token", async () => {
			await request(app).get("/api/reservas").expect(401);
		});
		it("Deve retornar 403 para User comum com token", async () => {
			await request(app).get("/api/reservas").set("Authorization", `Bearer ${userToken}`).expect(403);
		});
        it("Deve retornar 200 para Admin com token", async () => {
			await request(app).get("/api/reservas").set("Authorization", `Bearer ${adminToken}`).expect(200);
		});
	});

    // Rota: POST /api/reservas
	describe("POST /api/reservas", () => {
		it("Deve retornar 401 sem token", async () => {
            // Enviar um corpo vazio ou inválido, o foco é o 401
			await request(app).post("/api/reservas").send({}).expect(401);
		});
		it("Deve retornar erro != 401 com token válido (User)", async () => {
            // Espera-se um erro de validação (400) ou de recurso não encontrado (404), mas não 401
			const res = await request(app).post("/api/reservas").set("Authorization", `Bearer ${userToken}`).send({});
            expect(res.status).not.toBe(401);
            expect(res.status).toBe(400); // Provavelmente 400 por falta de dados
		});
        it("Deve retornar erro != 401 com token válido (Admin)", async () => {
            // Idem ao anterior, mas com token de Admin
			const res = await request(app).post("/api/reservas").set("Authorization", `Bearer ${adminToken}`).send({});
            expect(res.status).not.toBe(401);
             expect(res.status).toBe(400); // Provavelmente 400 por falta de dados
		});
	});

    // Rota: GET /api/reservas/:id
    describe("GET /api/reservas/:id", () => {
        const testId = 1; // Usar um ID arbitrário, já que não criamos reserva
        it("Deve retornar 401 sem token", async () => {
			await request(app).get(`/api/reservas/${testId}`).expect(401);
		});
        it("Deve retornar erro != 401 com token válido (User)", async () => {
            // Espera-se 404 (Not Found) ou 403 se a lógica for além, mas não 401
			const res = await request(app).get(`/api/reservas/${testId}`).set("Authorization", `Bearer ${userToken}`);
            expect(res.status).not.toBe(401);
            expect(res.status).toBe(404); // Provável 404 pois a reserva '1' não existe
		});
    });

    // Rota: DELETE /api/reservas/:id
     describe("DELETE /api/reservas/:id", () => {
        const testId = 1; // Usar um ID arbitrário
        it("Deve retornar 401 sem token", async () => {
			await request(app).delete(`/api/reservas/${testId}`).expect(401);
		});
        it("Deve retornar erro != 401 com token válido (User)", async () => {
            // Espera-se 404 (Not Found) ou 403 se a lógica for além, mas não 401
			const res = await request(app).delete(`/api/reservas/${testId}`).set("Authorization", `Bearer ${userToken}`);
            expect(res.status).not.toBe(401);
            expect(res.status).toBe(404); // Provável 404 pois a reserva '1' não existe
		});
    });

});