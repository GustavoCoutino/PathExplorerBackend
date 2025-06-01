const request = require("supertest");
const app = require("../../../app");
const db = require("../../db/pool");

let token;
let createdProjectId;
let createdRoleId;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "daniel.campos@accenture.com",
    password: "Accentur3Temp!",
  });
  token = loginResponse.body.token;
});

const cleanupProject = async (projectId) => {
  if (projectId) {
    try {
      await db.query(
        `
        DELETE FROM recursos.rol_habilidad 
        WHERE id_rol IN (
          SELECT id_rol FROM recursos.rol WHERE id_proyecto = $1
        )
      `,
        [projectId]
      );

      await db.query(
        `
        DELETE FROM recursos.rol WHERE id_proyecto = $1
      `,
        [projectId]
      );

      await db.query(
        `
        DELETE FROM recursos.proyecto WHERE id_proyecto = $1
      `,
        [projectId]
      );
    } catch (error) {
      console.log("Project cleanup failed:", error.message);
    }
  }
};

const cleanupRole = async (roleId) => {
  if (roleId) {
    try {
      await db.query(
        `
        DELETE FROM recursos.rol_habilidad WHERE id_rol = $1
      `,
        [roleId]
      );

      await db.query(
        `
        DELETE FROM recursos.rol WHERE id_rol = $1;
      `,
        [roleId]
      );
    } catch (error) {
      console.log("Role cleanup failed:", error.message);
    }
  }
};

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

describe("POST /api/projects/create-project", () => {
  test("should return 201 and create a new project", async () => {
    const newProject = {
      nombre: "Sistema de Gestión de Inventario - Prueba",
      descripcion: "Esto es un proyecto de prueba que se borrara",
      fecha_inicio: "2025-05-15",
      fecha_fin_estimada: "2025-09-15",
      prioridad: 5,
      id_manager: 44,
      roles: [
        {
          titulo: "Arquitecto de Software",
          descripcion: "Diseñar la estructura y componentes del sistema",
          importancia: 5,
          nivel_experiencia_requerido: 5,
          habilidades: [
            { id_habilidad: 3, nivel_minimo_requerido: 4, importancia: 5 },
            { id_habilidad: 7, nivel_minimo_requerido: 4, importancia: 4 },
          ],
        },
        {
          titulo: "Desarrollador Full Stack",
          descripcion: "Implementar funcionalidades de gestión de inventario",
          importancia: 4,
          nivel_experiencia_requerido: 3,
          habilidades: [
            { id_habilidad: 4, nivel_minimo_requerido: 3, importancia: 4 },
            { id_habilidad: 8, nivel_minimo_requerido: 3, importancia: 4 },
          ],
        },
        {
          titulo: "Especialista en Bases de Datos",
          descripcion: "Optimizar estructura y consultas de base de datos",
          importancia: 3,
          nivel_experiencia_requerido: 4,
          habilidades: [
            { id_habilidad: 6, nivel_minimo_requerido: 4, importancia: 5 },
            { id_habilidad: 9, nivel_minimo_requerido: 3, importancia: 3 },
          ],
        },
      ],
    };

    const response = await request(app)
      .post("/api/projects/create-project")
      .set("Authorization", `Bearer ${token}`)
      .send(newProject);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Proyecto creado exitosamente");
    expect(response.body.project).toBeDefined();
    createdProjectId = response.body.project[0].crear_proyecto_completo;
  });

  test("should return 400 when required fields are missing", async () => {
    const incompleteProject = {
      fecha_inicio: "2025-05-15",
      prioridad: 5,
      id_manager: 44,
    };

    const response = await request(app)
      .post("/api/projects/create-project")
      .set("Authorization", `Bearer ${token}`)
      .send(incompleteProject);
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Error creando proyecto");
  });

  afterEach(async () => {
    await cleanupProject(createdProjectId);
    createdProjectId = null;
  });
});

describe("POST /api/projects/best-candidates-for-role", () => {
  test("should return 200 and best candidates for a role", async () => {
    const requestData = {
      id_rol: 9,
    };

    const response = await request(app)
      .post("/api/projects/best-candidates-for-role")
      .set("Authorization", `Bearer ${token}`)
      .send(requestData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.candidates).toBeDefined();
    expect(Array.isArray(response.body.candidates)).toBe(true);
  });
});

describe("PATCH /api/projects/edit-project", () => {
  test("should return 200 and update the project successfully", async () => {
    const updatedProject = {
      id_proyecto: 41,
      nombre: "Proyecto actualizado - Prueba",
      descripcion: "Este proyecto ha sido actualizado",
      fecha_inicio: "2025-05-05T06:00:00.000Z",
      fecha_fin_estimada: "2025-08-04T06:00:00.000Z",
      fecha_fin_real: null,
      estado: "PLANEACION",
      prioridad: 3,
      id_manager: 43,
      fecha_creacion: "2025-05-25T01:50:44.707Z",
      fecha_actualizacion: "2025-05-25T01:50:44.707Z",
      roles: [
        {
          id_rol: 100,
          titulo: "Arquitecto Cloud",
          descripcion: "Rol de prueba",
          nivel_experiencia_requerido: 2,
          habilidades: [
            {
              nivel_minimo_requerido: 3,
              importancia: 3,
              nombre: "Vue.js",
              categoria: "TECNICA",
              descripcion: "Desarrollo frontend con Vue.js",
            },
            {
              nivel_minimo_requerido: 3,
              importancia: 3,
              nombre: "Node.js",
              categoria: "TECNICA",
              descripcion: "Desarrollo backend con Node.js",
            },
          ],
        },
      ],
    };

    const response = await request(app)
      .patch("/api/projects/edit-project")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedProject);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Proyecto editado exitosamente");
  });

  test("should return 500 when required fields are missing", async () => {
    const incompleteProjectData = {
      nombre: "Proyecto Incompleto",
    };

    const response = await request(app)
      .patch("/api/projects/edit-project")
      .set("Authorization", `Bearer ${token}`)
      .send(incompleteProjectData);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Error editando proyecto");
  });
});

describe("POST /api/projects/add-roles-to-project", () => {
  test("should return 201 and add a role to project successfully", async () => {
    const newRole = {
      titulo: "QA Tester - Prueba",
      descripcion: "Responsable de realizar pruebas de calidad del software",
      nivel_experiencia_requerido: 3,
      estado: "ABIERTO",
      id_proyecto: 41,
      skills: [
        {
          id_habilidad: 5,
          nivel_minimo_requerido: 3,
          importancia: 4,
        },
        {
          id_habilidad: 12,
          nivel_minimo_requerido: 2,
          importancia: 3,
        },
      ],
    };

    const response = await request(app)
      .post("/api/projects/add-roles-to-project")
      .set("Authorization", `Bearer ${token}`)
      .send(newRole);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Rol agregado al proyecto exitosamente");
    expect(response.body.role).toBeDefined();

    createdRoleId = response.body.role.id_rol;
  });

  test("should return 400 when required fields are missing", async () => {
    const incompleteRole = {
      titulo: "Incomplete Role",
    };

    const response = await request(app)
      .post("/api/projects/add-roles-to-project")
      .set("Authorization", `Bearer ${token}`)
      .send(incompleteRole);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Error adding role to project");
  });

  test("should return 400 when project doesn't exist", async () => {
    const roleForNonExistentProject = {
      titulo: "Test Role",
      descripcion: "Test description",
      nivel_experiencia_requerido: 2,
      estado: "DISPONIBLE",
      id_proyecto: 99999,
      skills: [],
    };

    const response = await request(app)
      .post("/api/projects/add-roles-to-project")
      .set("Authorization", `Bearer ${token}`)
      .send(roleForNonExistentProject);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Error adding role to project");
  });

  afterEach(async () => {
    await cleanupRole(createdRoleId);
    createdRoleId = null;
  });
});

describe("DELETE /api/projects/remove-role-from-project", () => {
  let roleToDelete;

  beforeEach(async () => {
    const newRole = {
      titulo: "Rol a borrar - Prueba",
      descripcion: "Este rol será eliminado durante las pruebas",
      nivel_experiencia_requerido: 2,
      estado: "ABIERTO",
      id_proyecto: 41,
      skills: [
        {
          id_habilidad: 8,
          nivel_minimo_requerido: 2,
          importancia: 3,
        },
      ],
    };

    const createResponse = await request(app)
      .post("/api/projects/add-roles-to-project")
      .set("Authorization", `Bearer ${token}`)
      .send(newRole);

    roleToDelete = createResponse.body.role[0].id_rol;
  });

  test("should return 200 and remove role from project successfully", async () => {
    const deleteData = {
      id_rol: roleToDelete,
      mensaje: "Rol eliminado del proyecto exitosamente",
    };

    const response = await request(app)
      .delete("/api/projects/remove-role-from-project")
      .set("Authorization", `Bearer ${token}`)
      .send(deleteData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Rol eliminado del proyecto exitosamente"
    );

    roleToDelete = null;
  });

  test("should return 500 when role ID is missing", async () => {
    const response = await request(app)
      .delete("/api/projects/remove-role-from-project")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Error removing role from project");
  });

  afterEach(async () => {
    if (roleToDelete) {
      await cleanupRole(roleToDelete);
      roleToDelete = null;
    }
  });
});
