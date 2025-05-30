const request = require("supertest");
const app = require("../../../app");
const db = require("../../db/pool");

let token;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "maria.gonzalez@accenture.com",
    password: "Accentur3Temp!",
  });
  token = loginResponse.body.token;
});

const cleanupUserCourse = async () => {
  try {
    const query = `
        delete from desarrollo.persona_curso where id_persona=2 and id_curso=10;
      `;
    await db.query(query);
  } catch (error) {
    console.log("Manual cleanup failed:", error.message);
  }
};

const cleanUpUserCertification = async () => {
  try {
    const query = `
        delete from desarrollo.persona_certificacion where id_persona=2 and id_certificacion=1;
      `;
    await db.query(query);
  } catch (error) {
    console.log("Manual cleanup failed:", error.message);
  }
};

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

describe("POST /api/development/add-user-course", () => {
  test("should return 201 and add a course to user that is completed", async () => {
    const testCourseData = {
      id_persona: 2,
      id_curso: 10,
      fecha_inicio: new Date().toISOString(),
      fecha_finalizacion: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      calificacion: 85,
      certificado: true,
      progreso: 100,
    };

    const response = await request(app)
      .post("/api/development/create-course")
      .set("Authorization", `Bearer ${token}`)
      .send(testCourseData);

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
  });

  test("should return 400 when course is already registered", async () => {
    const testCourseData = {
      id_persona: 2,
      id_curso: 3,
      fecha_inicio: new Date().toISOString(),
      fecha_finalizacion: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      calificacion: 85,
      certificado: true,
      progreso: 100,
    };

    return request(app)
      .post("/api/development/create-course")
      .set("Authorization", `Bearer ${token}`)
      .send(testCourseData)
      .expect(400);
  });

  afterEach(async () => {
    await cleanupUserCourse();
  });
});

describe("POST /api/development/create-certification", () => {
  test("should return 201 and add a certification to user", async () => {
    const testCertificationData = {
      id_certificacion: 1,
      fecha_obtencion: new Date().toISOString(),
      fecha_vencimiento: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      estado_validacion: "t",
    };

    const response = await request(app)
      .post("/api/development/create-certification")
      .set("Authorization", `Bearer ${token}`)
      .send(testCertificationData);

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
  });

  test("should return 400 when certification is already registered", async () => {
    const testCertificationData = {
      id_certificacion: 9,
      fecha_obtencion: new Date().toISOString(),
      fecha_vencimiento: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      estado_validacion: "t",
    };

    return request(app)
      .post("/api/development/create-certification")
      .set("Authorization", `Bearer ${token}`)
      .send(testCertificationData)
      .expect(400);
  });
  afterEach(async () => {
    await cleanUpUserCertification();
  });
});

describe("PATCH /api/development/edit-course", () => {
  beforeEach(async () => {
    const testCourseData = {
      id_curso: 10,
      fecha_inicio: new Date().toISOString(),
      fecha_finalizacion: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      calificacion: 75,
      certificado: false,
      progreso: 50,
    };

    await request(app)
      .post("/api/development/create-course")
      .set("Authorization", `Bearer ${token}`)
      .send(testCourseData);
  });

  test("should return 200 and update user course successfully", async () => {
    const updateCourseData = {
      id_curso: 10,
      fecha_inicio: new Date().toISOString(),
      fecha_finalizacion: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      ).toISOString(),
      calificacion: 95,
      certificado: true,
      progreso: 100,
    };

    const response = await request(app)
      .patch("/api/development/edit-course")
      .set("Authorization", `Bearer ${token}`)
      .send(updateCourseData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Curso actualizado con éxito");
    expect(response.body.course).toBeDefined();
  });

  test("should return 400 when required fields are missing", async () => {
    const incompleteCourseData = {
      id_curso: 10,
      progreso: 100,
    };

    const response = await request(app)
      .patch("/api/development/edit-course")
      .set("Authorization", `Bearer ${token}`)
      .send(incompleteCourseData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "ID de curso, fecha de inicio y calificación son requeridos"
    );
  });

  test("should return 404 when course not found", async () => {
    const updateCourseData = {
      id_curso: 999,
      fecha_inicio: new Date().toISOString(),
      calificacion: 85,
      progreso: 100,
    };

    const response = await request(app)
      .patch("/api/development/edit-course")
      .set("Authorization", `Bearer ${token}`)
      .send(updateCourseData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Curso no encontrado o no se pudo actualizar"
    );
  });

  afterEach(async () => {
    await cleanupUserCourse();
  });
});

describe("PATCH /api/development/edit-certification", () => {
  beforeEach(async () => {
    const testCertificationData = {
      id_certificacion: 1,
      fecha_obtencion: new Date().toISOString(),
      fecha_vencimiento: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      estado_validacion: "t",
    };

    await request(app)
      .post("/api/development/create-certification")
      .set("Authorization", `Bearer ${token}`)
      .send(testCertificationData);
  });

  test("should return 200 and update user certification successfully", async () => {
    const updateCertificationData = {
      id_certificacion: 1,
      fecha_obtencion: new Date().toISOString(),
      fecha_vencimiento: new Date(
        Date.now() + 730 * 24 * 60 * 60 * 1000
      ).toISOString(),
      estado_validacion: "f",
    };

    const response = await request(app)
      .patch("/api/development/edit-certification")
      .set("Authorization", `Bearer ${token}`)
      .send(updateCertificationData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Certificación actualizada con éxito");
    expect(response.body.certification).toBeDefined();
  });

  test("should return 400 when id_certificacion is missing", async () => {
    const incompleteCertificationData = {
      fecha_obtencion: new Date().toISOString(),
      estado_validacion: "t",
    };

    const response = await request(app)
      .patch("/api/development/edit-certification")
      .set("Authorization", `Bearer ${token}`)
      .send(incompleteCertificationData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("ID de certificación es requerido");
  });

  test("should return 404 when certification not found", async () => {
    const updateCertificationData = {
      id_certificacion: 999,
      fecha_obtencion: new Date().toISOString(),
      estado_validacion: "t",
    };

    const response = await request(app)
      .patch("/api/development/edit-certification")
      .set("Authorization", `Bearer ${token}`)
      .send(updateCertificationData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "No se encontró la certificación para actualizar"
    );
  });

  afterEach(async () => {
    await cleanUpUserCertification();
  });
});
