const request = require("supertest");
const app = require("../../../app");

let token;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "juan.perez@accenture.com",
    password: "Accentur3Temp!",
  });
  token = loginResponse.body.token;
});

describe("GET /api/notifications/user-notifications", () => {
  test("should return 200 and user notifications", async () => {
    const response = await request(app)
      .get("/api/notifications/user-notifications")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasNotifications");
  });
});
