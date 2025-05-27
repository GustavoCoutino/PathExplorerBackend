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

describe("GET /api/development/all-courses", () => {
  test("should return 200 and user courses", async () => {
    const response = await request(app)
      .get("/api/development/all-courses")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("GET /api/development/all-certifications", () => {
  test("should return 200 and user certifications", async () => {
    const response = await request(app)
      .get("/api/development/all-certifications")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
