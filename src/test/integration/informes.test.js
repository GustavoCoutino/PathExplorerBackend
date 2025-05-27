const request = require("supertest");
const app = require("../../../app");

let token;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "yolanda.reyes@accenture.com",
    password: "Accentur3Temp!",
  });
  token = loginResponse.body.token;
});

describe("GET /api/informes/", () => {
  test("should return 200 and user informes", async () => {
    const response = await request(app)
      .get("/api/informes/")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasInformes", true);
    expect(response.body).toHaveProperty("informes");
  });
});
