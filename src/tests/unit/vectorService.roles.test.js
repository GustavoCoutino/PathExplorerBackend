jest.mock("@langchain/openai");
jest.mock("node-cache");

const { OpenAIEmbeddings } = require("@langchain/openai");
const NodeCache = require("node-cache");

const mockEmbeddings = {
  embedQuery: jest.fn(),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

OpenAIEmbeddings.mockImplementation(() => mockEmbeddings);
NodeCache.mockImplementation(() => mockCache);

const {
  getOrCreateRoleVectors,
  findRelevantRoles,
} = require("../../services/vectorService");

describe("vectorService - Roles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrCreateRoleVectors", () => {
    const mockRoles = [
      {
        id_rol: 10,
        titulo: "QA Engineer",
        descripcion:
          "Asegurar la calidad del sistema mediante pruebas sistemáticas.",
        nivel_experiencia_requerido: 3,
        id_proyecto: 2,
        id_manager: 42,
        project: [
          {
            id_proyecto: 2,
            nombre: "Sistema de Gestión Hospitalaria",
            descripcion:
              "Desarrollo de plataforma integral para gestión de hospitales, incluyendo pacientes, personal y recursos.",
            fecha_inicio: "2023-03-10T06:00:00.000Z",
            fecha_fin_estimada: "2024-09-15T06:00:00.000Z",
            estado: "ACTIVO",
          },
        ],
        skills: [
          {
            id_habilidad: 18,
            nombre: "UI Design",
            categoria: "TECNICA",
            descripcion: "Diseño de interfaces de usuario",
            nivel_minimo_requerido: 3,
            importancia: 3,
          },
          {
            id_habilidad: 25,
            nombre: "Blockchain",
            categoria: "TECNICA",
            descripcion: "Tecnología de cadena de bloques",
            nivel_minimo_requerido: 2,
            importancia: 5,
          },
        ],
        manager: [
          {
            id_persona: 42,
            nombre: "Mónica",
            apellido: "Rojas",
            email: "monica.rojas@accenture.com",
          },
        ],
      },
      {
        id_rol: 19,
        titulo: "Especialista en ETL",
        descripcion:
          "Desarrollar procesos de extracción, transformación y carga de datos.",
        nivel_experiencia_requerido: 4,
        id_proyecto: 4,
        id_manager: 44,
        project: [
          {
            id_proyecto: 4,
            nombre: "Análisis Predictivo de Ventas",
            descripcion:
              "Desarrollo de modelos de machine learning para predecir tendencias de ventas y optimizar inventario.",
            fecha_inicio: "2023-05-05T06:00:00.000Z",
            fecha_fin_estimada: "2024-02-28T06:00:00.000Z",
            estado: "ACTIVO",
          },
        ],
        skills: [],
        manager: [
          {
            id_persona: 44,
            nombre: "Marina",
            apellido: "Fuentes",
            email: "marina.fuentes@accenture.com",
          },
        ],
      },
      {
        id_rol: 20,
        titulo: "ML Ops Engineer",
        descripcion:
          "Implementar infraestructura para el despliegue y monitoreo de modelos de ML.",
        nivel_experiencia_requerido: 4,
        id_proyecto: 4,
        id_manager: 44,
        project: [
          {
            id_proyecto: 4,
            nombre: "Análisis Predictivo de Ventas",
            descripcion:
              "Desarrollo de modelos de machine learning para predecir tendencias de ventas y optimizar inventario.",
            fecha_inicio: "2023-05-05T06:00:00.000Z",
            fecha_fin_estimada: "2024-02-28T06:00:00.000Z",
            estado: "ACTIVO",
          },
        ],
        skills: [
          {
            id_habilidad: 6,
            nombre: "AWS",
            categoria: "TECNICA",
            descripcion: "Servicios de Amazon Web Services",
            nivel_minimo_requerido: 4,
            importancia: 5,
          },
          {
            id_habilidad: 7,
            nombre: "Azure",
            categoria: "TECNICA",
            descripcion: "Plataforma en la nube de Microsoft",
            nivel_minimo_requerido: 3,
            importancia: 5,
          },
          {
            id_habilidad: 9,
            nombre: "Angular",
            categoria: "TECNICA",
            descripcion: "Desarrollo frontend con Angular",
            nivel_minimo_requerido: 3,
            importancia: 3,
          },
          {
            id_habilidad: 13,
            nombre: "Docker",
            categoria: "TECNICA",
            descripcion: "Contenedorización de aplicaciones",
            nivel_minimo_requerido: 4,
            importancia: 3,
          },
          {
            id_habilidad: 19,
            nombre: "UX Design",
            categoria: "TECNICA",
            descripcion: "Diseño de experiencia de usuario",
            nivel_minimo_requerido: 3,
            importancia: 3,
          },
        ],
        manager: [
          {
            id_persona: 44,
            nombre: "Marina",
            apellido: "Fuentes",
            email: "marina.fuentes@accenture.com",
          },
        ],
      },
    ];
    const mockVectors = {
      roleEmbeddings: [
        {
          original: mockRoles[0],
          vector: [0.1, 0.2],
        },
        {
          original: mockRoles[1],
          vector: [0.3, 0.4],
        },
        {
          original: mockRoles[2],
          vector: [0.5, 0.6],
        },
      ],
    };
    test("should return cached vectors if available", async () => {
      mockCache.get.mockReturnValue(mockVectors);
      const vectors = await getOrCreateRoleVectors();
      expect(vectors).toEqual(mockVectors);
      expect(mockCache.get).toHaveBeenCalledWith("role_vectors");
    });
    test("should create and cache vectors when not cached", async () => {
      mockCache.get.mockReturnValue(undefined);

      mockEmbeddings.embedQuery
        .mockResolvedValueOnce([0.1, 0.2])
        .mockResolvedValueOnce([0.3, 0.4])
        .mockResolvedValueOnce([0.5, 0.6]);

      const vectors = await getOrCreateRoleVectors(mockRoles);

      expect(vectors).toBeInstanceOf(Array);
      expect(vectors).toHaveLength(mockRoles.length);
      expect(vectors).toHaveLength(3);

      vectors.forEach((embedding, index) => {
        expect(embedding).toHaveProperty("original");
        expect(embedding).toHaveProperty("vector");

        expect(typeof embedding.original).toBe("object");
        expect(embedding.original).not.toBeNull();

        expect(Array.isArray(embedding.vector)).toBe(true);

        expect(embedding.original).toEqual(mockRoles[index]);
      });

      expect(mockEmbeddings.embedQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe("findRelevantRoles", () => {
    const mockUserVector = [0.1, 0.2];
    const mockRoleVectors = [
      {
        original: {
          id_rol: 10,
          titulo: "QA Engineer",
          skills: [{ nombre: "UI Design" }, { nombre: "Blockchain" }],
        },
        vector: [0.1, 0.2],
      },
      {
        original: {
          id_rol: 19,
          titulo: "Especialista en ETL",
          skills: [],
        },
        vector: [0.3, 0.4],
      },
      {
        original: {
          id_rol: 20,
          titulo: "ML Ops Engineer",
          skills: [
            { nombre: "AWS" },
            { nombre: "Azure" },
            { nombre: "Angular" },
            { nombre: "Docker" },
            { nombre: "UX Design" },
          ],
        },
        vector: [0.5, 0.6],
      },
    ];

    test("should return top N relevant roles based on cosine similarity", async () => {
      const expectedRoles = [
        {
          id_rol: 10,
          titulo: "QA Engineer",
          skills: [{ nombre: "UI Design" }, { nombre: "Blockchain" }],
        },
        {
          id_rol: 19,
          titulo: "Especialista en ETL",
          skills: [],
        },
        {
          id_rol: 20,
          titulo: "ML Ops Engineer",
          skills: [
            { nombre: "AWS" },
            { nombre: "Azure" },
            { nombre: "Angular" },
            { nombre: "Docker" },
            { nombre: "UX Design" },
          ],
        },
      ];

      mockEmbeddings.embedQuery.mockResolvedValue(mockUserVector);

      const roles = await findRelevantRoles(mockUserVector, mockRoleVectors, 3);

      expect(roles.topRoles).toHaveLength(3);
      expect(roles.topRoles).toEqual(expectedRoles);
    });

    test("should handle empty role vectors", async () => {
      const roles = await findRelevantRoles(mockUserVector, [], 3);
      expect(roles.topRoles).toHaveLength(0);
    });

    test("should return fewer roles than requested if not enough available", async () => {
      const roles = await findRelevantRoles(mockUserVector, mockRoleVectors, 5);
      expect(roles.topRoles).toHaveLength(3);
    });
    test("should return empty array if no roles match", async () => {
      const emptyRoleVectors = [];
      const roles = await findRelevantRoles(
        mockUserVector,
        emptyRoleVectors,
        3
      );
      expect(roles.topRoles).toHaveLength(0);
    });
    test("should return roles with skills filters", async () => {
      const mockSkillsFilter = ["Docker", "AWS"];
      const mockSkillsVector = [0.1, 0.2];

      mockEmbeddings.embedQuery.mockResolvedValue(mockSkillsVector);

      const roles = await findRelevantRoles(
        mockUserVector,
        mockRoleVectors,
        3,
        mockSkillsFilter
      );

      expect(roles.topRoles).toHaveLength(3);
      expect(roles.topRoles[0].titulo).toBe("QA Engineer");
      expect(roles.topRoles[1].titulo).toBe("Especialista en ETL");
      expect(roles.topRoles[2].titulo).toBe("ML Ops Engineer");
    });
  });
});
