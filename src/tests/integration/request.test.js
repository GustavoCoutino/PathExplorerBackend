const request = require("supertest");
const app = require("../../../app");
const db = require("../../db/pool");

const cleanupAssignmentRequest = async () => {
  try {
    await db.query(
      `DELETE FROM evaluacion.solicitud_asignacion 
     WHERE justificacion = $1 AND id_manager = $2 AND id_empleado = $3 AND id_rol = $4`,
      ["Prueba de solicitud de asignación", 3, 14, 15]
    );
  } catch (error) {
    console.log("Assignment request cleanup failed:", error.message);
  }
};

const cleanupUpdateAssignmentRequest = async () => {
  try {
    await db.query(
      `UPDATE evaluacion.solicitud_asignacion 
         SET estado = 'PENDIENTE' 
         WHERE id_solicitud = 36`
    );
  } catch (error) {
    console.log("Update assignment request cleanup failed:", error.message);
  }
};

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

  test("should update an assignment request with an approved state", async () => {
    const response = await request(app)
      .patch("/api/requests/update-assignment-request")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id_solicitud: 1,
        estado: "APROBADO",
        comentarios_resolucion:
          "Solicitud de asignación finalizada exitosamente",
      });
  });

  test("should update an assignment request with a rejected state", async () => {
    const response = await request(app)
      .patch("/api/requests/update-assignment-request")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id_solicitud: 1,
        estado: "RECHAZADA",
        comentarios_resolucion: "Solicitud de asignación rechazada",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe(
      "Solicitud de asignación finalizada exitosamente"
    );
  });

  afterAll(async () => {
    await cleanupUpdateAssignmentRequest();
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

  test("should create an assignment request", async () => {
    const response = await request(app)
      .post("/api/requests/create-assignment-request")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        id_administrador: 3,
        id_manager: 43,
        id_empleado: 14,
        id_rol: 15,
        fecha_solicitud: "2025-04-23T00:00:00.000Z",
        justificacion: "Prueba de solicitud de asignación",
        urgencia: 5,
        estado: "PENDIENTE",
        comentarios_resolucion: "",
        fecha_resolucion: null,
        fecha_creacion: "2025-04-23T00:00:00.000Z",
        fecha_actualizacion: "2025-04-23T00:00:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe(
      "Solicitud de asignación creada exitosamente"
    );
  });
  afterAll(async () => {
    await cleanupAssignmentRequest();
  });
});
