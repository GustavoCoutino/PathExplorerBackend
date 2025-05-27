const request = require("supertest");
const app = require("../../app");

describe("Administrator requests tests", () => {
  let adminToken;
  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "yolanda.reyes@accenture.com",
      password: "Accentur3Temp!",
    });
    adminToken = loginResponse.body.token;
  });
  test("should return 200 and a list of assignment requests", async () => {
    const response = await request(app)
      .get("/api/requests/assignment-requests")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasRequests");
  });
});

describe("Manager requests tests", () => {
  let managerToken;
  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "daniel.campos@accenture.com",
      password: "Accentur3Temp!",
    });
    managerToken = loginResponse.body.token;
  });
  test("should return 200 and a list of administrators", async () => {
    const response = await request(app)
      .get("/api/requests/administrators")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasRequests");
  });
});
