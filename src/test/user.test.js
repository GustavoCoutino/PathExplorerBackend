const request = require("supertest");
const app = require("../../app");

let token;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "juan.perez@accenture.com",
    password: "Accentur3Temp!",
  });
  token = loginResponse.body.token;
});

describe("POST /api/login", () => {
  test("should return 200, token, and a user object", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "juan.perez@accenture.com",
      password: "Accentur3Temp!",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
  });

  test("should return 400 for missing email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      password: "Accentur3Temp!",
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Email y contraseña son requeridos"
    );
  });

  test("should return 400 for missing password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "juan.perez@accenture.com",
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Email y contraseña son requeridos"
    );
  });

  test("should return 401 for invalid credentials for nonexistent user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "pera.perez@accenture.com",
      password: "Accentur3Temp!",
    });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
  });

  test("should return 401 for invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "juan.perez@accenture.com",
      password: "Accentur3Temp!!",
    });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("success", false);
  });
});

describe("GET /api/me", () => {
  test("should return 200 and user profile", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/update", () => {
  test("should return 200 and updated user profile", async () => {
    const response = await request(app)
      .patch("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Juan",
        apellido: "Pérez",
        correo: "juan.perez@accenture.com",
        cargo: "Desarrollador Backend",
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty(
      "message",
      "Perfil actualizado con éxito"
    );
  });

  test("should return 400 for missing required fields", async () => {
    const response = await request(app)
      .patch("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Juan",
        apellido: "Pérez",
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Nombre, apellido, correo y cargo son requeridos"
    );
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app).patch("/api/auth/update").send({
      nombre: "Juan",
      apellido: "Pérez",
      correo: "juan.perez@accenture.com",
      cargo: "Desarrollador Backend",
    });
    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/update-password", () => {
  test("should return 200 for successful password update", async () => {
    const response = await request(app)
      .patch("/api/auth/update-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "Accentur3Temp!",
        newPassword: "Accentur3Temp!",
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Contraseña actualizada con éxito"
    );
  });

  test("should return 400 for missing required fields", async () => {
    const response = await request(app)
      .patch("/api/auth/update-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "Accentur3Temp!!",
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Nueva contraseña y contraseña actual son requeridas"
    );
  });

  test("should return 500 for invalid old password", async () => {
    const response = await request(app)
      .patch("/api/auth/update-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "Accentur3Temp!!!!!!!!!!!!",
        newPassword: "Accentur3Temp!!",
      });
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      "Contraseña actual incorrecta"
    );
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app)
      .patch("/api/auth/update-password")
      .send({
        oldPassword: "Accentur3Temp!",
        newPassword: "Accentur3Temp!",
      });
    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/certifications", () => {
  test("should return 200 and user certifications", async () => {
    const response = await request(app)
      .get("/api/auth/certifications")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("certifications");
    expect(Array.isArray(response.body.certifications)).toBe(true);
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app).get("/api/auth/certifications");
    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/courses", () => {
  test("should return 200 and user courses", async () => {
    const response = await request(app)
      .get("/api/auth/courses")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("courses");
    expect(Array.isArray(response.body.courses)).toBe(true);
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app).get("/api/auth/courses");
    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/professional-history", () => {
  test("should return 200 and user professional history", async () => {
    const response = await request(app)
      .get("/api/auth/professional-history")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("professionalHistory");
    expect(Array.isArray(response.body.professionalHistory)).toBe(true);
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app).get("/api/auth/professional-history");
    expect(response.status).toBe(401);
  });

  test("should return professional history with correct structure", async () => {
    const response = await request(app)
      .get("/api/auth/professional-history")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);

    if (response.body.professionalHistory.length > 0) {
      const historyEntry = response.body.professionalHistory[0];
      expect(historyEntry).toHaveProperty("nombre");
      expect(historyEntry).toHaveProperty("apellido");
      expect(historyEntry).toHaveProperty("historial");
      expect(historyEntry).toHaveProperty("role");
      expect(historyEntry).toHaveProperty("achievements");
    }
  });
});

describe("GET /api/auth/skills", () => {
  test("should return 200 and user skills", async () => {
    const response = await request(app)
      .get("/api/auth/skills")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("skills");
    expect(Array.isArray(response.body.skills)).toBe(true);
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app).get("/api/auth/skills");
    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/trajectory-and-goals", () => {
  test("should return 200 and user goals and trajectory", async () => {
    const response = await request(app)
      .get("/api/auth/trajectory-and-goals")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("trajectory");
    expect(response.body).toHaveProperty("professionalGoals");
  });

  test("should return 401 for request without token", async () => {
    const response = await request(app).get("/api/auth/trajectory-and-goals");
    expect(response.status).toBe(401);
  });

  test("should return trajectory and goals with correct structure", async () => {
    const response = await request(app)
      .get("/api/auth/trajectory-and-goals")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.trajectory)).toBe(true);
    expect(Array.isArray(response.body.professionalGoals)).toBe(true);
  });
});

describe("Edge cases for GET endpoints", () => {
  test("should handle invalid bearer token format", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "InvalidTokenFormat");
    expect(response.status).toBe(401);
  });

  test("should handle malformed JWT token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.jwt.token");
    expect(response.status).toBe(401);
  });
});
