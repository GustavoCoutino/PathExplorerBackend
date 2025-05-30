const request = require("supertest");
const app = require("../../../app");
const db = require("../../db/pool");

const cleanUpFeedback = async () => {
  try {
    const query = `
        delete from evaluacion.evaluacion_desempeno where id_empleado=2 AND areas_mejora='Mejorar la comunicación en el equipo' AND calificacion=4 AND id_proyecto=1;
      `;
    await db.query(query);
  } catch (error) {
    console.log("Manual cleanup failed:", error.message);
  }
};

describe("Manager feedback tests", () => {
  let managerToken;
  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "daniel.campos@accenture.com",
      password: "Accentur3Temp!",
    });
    managerToken = loginResponse.body.token;
  });
  test("should return 200 and a list of feedback the manager has access to", async () => {
    const response = await request(app)
      .get("/api/feedback/manager")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasEvaluaciones");
  });

  test("should return 201 when creating a new feedback", async () => {
    const feedbackData = {
      id_empleado: 2,
      fecha: "2023-10-01",
      areas_mejora: "Mejorar la comunicación en el equipo",
      calificacion: 4,
      id_proyecto: 1,
      comentarios: "Buen desempeño en el proyecto",
      fortalezas: "Liderazgo y trabajo en equipo",
    };

    const response = await request(app)
      .post("/api/feedback/create")
      .set("Authorization", `Bearer ${managerToken}`)
      .send(feedbackData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Evaluación creada exitosamente"
    );
  });
  test("should return 200 and a list of projects and team members", async () => {
    const response = await request(app)
      .get("/api/feedback/team-and-members")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("equipos");
  });
});

describe("Administrator requests tests", () => {
  let adminToken;
  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "yolanda.reyes@accenture.com",
      password: "Accentur3Temp!",
    });
    adminToken = loginResponse.body.token;
  });
  test("should return 200 and a list of feedback a administrator has access to", async () => {
    const response = await request(app)
      .get("/api/feedback/administrador")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasEvaluaciones");
  });
});

describe("Employee requests tests", () => {
  let employeeToken;
  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "juan.perez@accenture.com",
      password: "Accentur3Temp!",
    });
    employeeToken = loginResponse.body.token;
  });
  test("should return 200 and a list of feedback the employee has access to", async () => {
    const response = await request(app)
      .get("/api/feedback/empleado")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hasEvaluaciones");
  });
  afterEach(async () => {
    await cleanUpFeedback();
  });
});
