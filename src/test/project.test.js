const request = require("supertest");
const app = require("../../app");

let token;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "daniel.campos@accenture.com",
    password: "Accentur3Temp!",
  });
  token = loginResponse.body.token;
});

describe("GET /api/projects/manager-projects-with-roles", () => {
  test("should return 200 and a list of projects with roles", async () => {
    const response = await request(app)
      .get("/api/projects/manager-projects-with-roles")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasProjects");
  });
});

describe("GET /api/projects/all-skills", () => {
  test("should return 200 and a list of all skills", async () => {
    const response = await request(app)
      .get("/api/projects/all-skills")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.skills).toBeDefined();
    expect(Array.isArray(response.body.skills)).toBe(true);
  });
});
