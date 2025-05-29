const request = require("supertest");
const app = require("../../../app");
const db = require("../../db/pool");

let token;

const cleanUpNotifications = async () => {
  try {
    const query = `
    UPDATE sistema.notificaciones SET leida = false where id_empleado=2 AND mensaje='Se te ha asignado una nueva tarea';`;
    await db.query(query);
  } catch (error) {
    console.log("Manual cleanup failed:", error.message);
  }
};

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

describe("PATCH /api/notifications/mark-notification-as-read", () => {
  test("should return 200 and mark notification as read", async () => {
    const response = await request(app)
      .patch("/api/notifications/mark-notification-as-read")
      .set("Authorization", `Bearer ${token}`)
      .send({ id_notificacion: 1 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Notificación marcada como leída"
    );
  });
  test("should return 404 if notification does not exist", async () => {
    const response = await request(app)
      .patch("/api/notifications/mark-notification-as-read")
      .set("Authorization", `Bearer ${token}`)
      .send({ id_notificacion: 9999 });
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      "Notificación no encontrada"
    );
  });
  afterEach(async () => {
    await cleanUpNotifications();
  });
});
