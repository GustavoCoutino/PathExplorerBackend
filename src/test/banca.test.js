const request = require("supertest");
const app = require("../../app");

let token;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "yolanda.reyes@accenture.com",
    password: "Accentur3Temp!",
  });
  token = loginResponse.body.token;
});

describe("GET /api/banca/empleados", () => {
  test("should return 200 and a list of employees", async () => {
    const response = await request(app)
      .get("/api/banca/empleados")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Lista de empleados obtenida correctamente"
    );
    expect(Array.isArray(response.body.employees)).toBe(true);
    expect(response.body.employees.length).toBeGreaterThan(0);
  });
});
