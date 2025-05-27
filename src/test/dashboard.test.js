const request = require("supertest");
const app = require("../../app");

describe("Employee tests dashboard", () => {
  let employeeToken;

  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "juan.perez@accenture.com",
      password: "Accentur3Temp!",
    });
    employeeToken = loginResponse.body.token;
  });

  test("should access employee dashboard", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("teamMembers");
    expect(response.body).toHaveProperty("courses");
    expect(response.body).toHaveProperty("certifications");
    expect(response.body).toHaveProperty("skills");
    expect(response.body).toHaveProperty("teamMembers");
  });
});

describe("Admin tests dashboard", () => {
  let managerToken;

  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "daniel.campos@accenture.com",
      password: "Accentur3Temp!",
    });
    managerToken = loginResponse.body.token;
  });

  test("should access manager dashboard", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("rolesWithoutAssignments");
    expect(response.body).toHaveProperty("courses");
    expect(response.body).toHaveProperty("certifications");
    expect(response.body).toHaveProperty("skills");
  });
});
