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

describe("GET /api/recommendations/development-recommendations", () => {
  test("should return 200 and a list of user trajectories recommendations", async () => {
    const response = await request(app)
      .get("/api/recommendations/development-recommendations")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Recomendaciones generadas exitosamente"
    );
    expect(Array.isArray(response.body.recommendations)).toBe(true);
    expect(response.body.recommendations.length).toBeGreaterThan(0);
  }, 30000);
});

describe("POST /api/recommendations/development-recommendations", () => {
  test("should return 2001 and create a new employee trajectory", async () => {
    const response = await request(app)
      .post("/api/recommendations/development-recommendations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Trayectoria de Prueba",
        descripcion: "Descripción de la trayectoria de prueba",
        roles_secuenciales: [
          "Desarrollador → Líder de Proyecto → Gerente de Tecnología",
        ],
        tiempo_estimado: 20,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Trayectoria creada y asignada al empleado exitosamente"
    );
  });
});

describe("GET /api/recommendations/get-user-trajectoria", () => {
  test("should return 200 and the user's trajectory", async () => {
    const response = await request(app)
      .get("/api/recommendations/get-user-trajectoria")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Trayectorias obtenidas exitosamente");
    expect(response.body.trayectoria).toBeDefined();
  }, 30000);
});

describe("GET /api/recommendations/cursos-y-certificaciones-recomendados", () => {
  test("should return 200 and a list of recommended courses and certifications", async () => {
    const response = await request(app)
      .get("/api/recommendations/cursos-y-certificaciones-recomendados")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Recomendaciones de cursos y certificaciones generadas exitosamente"
    );
    expect(
      Array.isArray(response.body.recommendations.cursos_recomendados)
    ).toBe(true);
    expect(
      response.body.recommendations.cursos_recomendados.length
    ).toBeGreaterThan(0);
    expect(
      Array.isArray(response.body.recommendations.certificaciones_recomendadas)
    ).toBe(true);
    expect(
      response.body.recommendations.certificaciones_recomendadas.length
    ).toBeGreaterThan(0);
  }, 120000);
  test("should return 200 and a list of recommended courses and certifications that match the filter", async () => {
    const response = await request(app)
      .get("/api/recommendations/cursos-y-certificaciones-recomendados")
      .set("Authorization", `Bearer ${token}`)
      .query({ coursesProvider: "Coursera", certificationsProvider: "Google" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Recomendaciones de cursos y certificaciones generadas exitosamente"
    );
    expect(
      Array.isArray(response.body.recommendations.cursos_recomendados)
    ).toBe(true);
    expect(
      Array.isArray(response.body.recommendations.certificaciones_recomendadas)
    ).toBe(true);
  }, 120000);
});

describe("GET /api/recommendations/get-user-trajectoria", () => {
  test("should return 200 and the user's trajectory", async () => {
    const response = await request(app)
      .get("/api/recommendations/get-user-trajectoria")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Trayectorias obtenidas exitosamente");
    expect(response.body.trayectoria).toBeDefined();
  });
});

describe("GET /api/recommendations/roles-recomendados", () => {
  test("should return 200 and a list of recommended roles", async () => {
    const response = await request(app)
      .get("/api/recommendations/roles-recomendados")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Recomendaciones de roles generadas exitosamente"
    );
    expect(Array.isArray(response.body.recommendations)).toBe(true);
    expect(response.body.recommendations.length).toBeGreaterThan(0);
  }, 200000);
});

describe("GET /api/recommendations/filter-options", () => {
  test("should return 200 and filter options", async () => {
    const response = await request(app)
      .get("/api/recommendations/filter-options")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Opciones de filtro obtenidas exitosamente"
    );
    expect(response.body.uniqueCategoriesCourses).toBeDefined();
    expect(response.body.uniqueInstitutionsCourses).toBeDefined();
    expect(response.body.uniqueInstitutionsCertifications).toBeDefined();
    expect(response.body.allSkillsNames).toBeDefined();
  });
});
