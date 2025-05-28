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
  cosineSimilarity,
  getOrCreateVectors,
  getUserProfileVector,
  findRelevantCoursesAndCerts,
  invalidateUserVectorCache,
} = require("../../services/vectorService");

describe("vectorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cosineSimilarity", () => {
    test("should calculate cosine similarity correctly for identical vectors", () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];

      const result = cosineSimilarity(vecA, vecB);

      expect(result).toBe(1);
    });

    test("should calculate cosine similarity correctly for orthogonal vectors", () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];

      const result = cosineSimilarity(vecA, vecB);

      expect(result).toBe(0);
    });

    test("should calculate cosine similarity correctly for opposite vectors", () => {
      const vecA = [1, 0, 0];
      const vecB = [-1, 0, 0];

      const result = cosineSimilarity(vecA, vecB);

      expect(result).toBe(-1);
    });

    test("should handle vectors with different magnitudes", () => {
      const vecA = [3, 4];
      const vecB = [4, 3];

      const result = cosineSimilarity(vecA, vecB);

      // (3*4 + 4*3) / (5 * 5) = 24/25 = 0.96
      expect(result).toBeCloseTo(0.96, 2);
    });
  });

  describe("getOrCreateVectors", () => {
    const mockDevelopmentQueries = {
      getAllCourses: jest.fn(),
      getAllCertifications: jest.fn(),
    };

    const mockCourses = [
      {
        id_curso: 1,
        nombre: "Java Avanzado",
        institucion: "Oracle Academy",
        descripcion:
          "Curso avanzado de Java con enfoque en arquitecturas empresariales",
        duracion: 60,
        modalidad: "VIRTUAL",
        categoria: "Desarrollo Backend",
      },
      {
        id_curso: 2,
        nombre: "Python para Data Science",
        institucion: "Coursera",
        descripcion: "Fundamentos de Python aplicado a ciencia de datos",
        duracion: 45,
        modalidad: "VIRTUAL",
        categoria: "Ciencia de Datos",
      },
      {
        id_curso: 3,
        nombre: "Desarrollo Web con React",
        institucion: "Udemy",
        descripcion: "Construcción de aplicaciones web modernas con React",
        duracion: 50,
        modalidad: "VIRTUAL",
        categoria: "Desarrollo Frontend",
      },
      {
        id_curso: 4,
        nombre: "Arquitectura Cloud Azure",
        institucion: "Microsoft",
        descripcion: "Diseño e implementación de soluciones en Azure",
        duracion: 80,
        modalidad: "VIRTUAL",
        categoria: "Cloud Computing",
      },
    ];

    const mockCertifications = [
      {
        id_certificacion: 1,
        nombre: "AWS Certified Solutions Architect – Associate",
        institucion: "Amazon Web Services",
        validez: 36,
        nivel: 4,
      },
      {
        id_certificacion: 2,
        nombre: "Microsoft Certified: Azure Developer Associate",
        institucion: "Microsoft",
        validez: 24,
        nivel: 4,
      },
      {
        id_certificacion: 3,
        nombre: "Oracle Certified Professional: Java SE 11 Developer",
        institucion: "Oracle",
        validez: 36,
        nivel: 4,
      },
      {
        id_certificacion: 4,
        nombre: "Professional Scrum Master I (PSM I)",
        institucion: "Scrum.org",
        validez: 0,
        nivel: 3,
      },
    ];

    test("should return cached vectors when available", async () => {
      const cachedVectors = { courseEmbeddings: [], certEmbeddings: [] };
      mockCache.get.mockReturnValue(cachedVectors);

      const result = await getOrCreateVectors(mockDevelopmentQueries);

      expect(mockCache.get).toHaveBeenCalledWith("course_cert_vectors");
      expect(result).toEqual(cachedVectors);
      expect(mockDevelopmentQueries.getAllCourses).not.toHaveBeenCalled();
    });

    test("should create and cache vectors when not cached", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockDevelopmentQueries.getAllCourses.mockResolvedValue(mockCourses);
      mockDevelopmentQueries.getAllCertifications.mockResolvedValue(
        mockCertifications
      );

      const mockVector = [0.1, 0.2, 0.3];
      mockEmbeddings.embedQuery.mockResolvedValue(mockVector);

      const result = await getOrCreateVectors(mockDevelopmentQueries);

      expect(mockDevelopmentQueries.getAllCourses).toHaveBeenCalled();
      expect(mockDevelopmentQueries.getAllCertifications).toHaveBeenCalled();
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledTimes(8);

      expect(result).toEqual({
        courseEmbeddings: mockCourses.map((course) => ({
          original: course,
          vector: mockVector,
        })),
        certEmbeddings: mockCertifications.map((cert) => ({
          original: cert,
          vector: mockVector,
        })),
      });

      expect(mockCache.set).toHaveBeenCalledWith("course_cert_vectors", result);
    });

    test("should handle database errors", async () => {
      mockCache.get.mockReturnValue(undefined);
      const dbError = new Error("Database error");
      mockDevelopmentQueries.getAllCourses.mockRejectedValue(dbError);

      await expect(getOrCreateVectors(mockDevelopmentQueries)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getUserProfileVector", () => {
    const mockUserData = {
      userProfile: { id_persona: 2 },
      currentRole: "Cloud Developer",
      employeeSkills: [
        {
          id_persona: 2,
          id_habilidad: 5,
          nivel_demostrado: 3,
          fecha_adquisicion: "2023-11-13T06:00:00.000Z",
          evidencia: null,
          fecha_creacion: "2025-03-10T20:32:08.043Z",
          fecha_actualizacion: "2025-03-10T20:32:08.043Z",
          nombre: "Git",
          categoria: "TECNICA",
          descripcion: "Control de versiones y colaboración con Git",
          nivel_maximo: 4,
        },
        {
          id_persona: 2,
          id_habilidad: 7,
          nivel_demostrado: 4,
          fecha_adquisicion: "2023-10-31T06:00:00.000Z",
          evidencia: null,
          fecha_creacion: "2025-03-10T20:32:08.043Z",
          fecha_actualizacion: "2025-03-10T20:32:08.043Z",
          nombre: "Azure",
          categoria: "TECNICA",
          descripcion: "Plataforma en la nube de Microsoft",
          nivel_maximo: 5,
        },
        {
          id_persona: 2,
          id_habilidad: 9,
          nivel_demostrado: 1,
          fecha_adquisicion: "2024-07-08T06:00:00.000Z",
          evidencia: null,
          fecha_creacion: "2025-03-10T20:32:08.043Z",
          fecha_actualizacion: "2025-03-10T20:32:08.043Z",
          nombre: "Angular",
          categoria: "TECNICA",
          descripcion: "Desarrollo frontend con Angular",
          nivel_maximo: 5,
        },
        {
          id_persona: 2,
          id_habilidad: 31,
          nivel_demostrado: 5,
          fecha_adquisicion: "2024-12-23T06:00:00.000Z",
          evidencia: null,
          fecha_creacion: "2025-03-10T20:32:08.043Z",
          fecha_actualizacion: "2025-03-10T20:32:08.043Z",
          nombre: "Gestión del tiempo",
          categoria: "BLANDA",
          descripcion: "Habilidad para administrar eficientemente el tiempo",
          nivel_maximo: 5,
        },
        {
          id_persona: 2,
          id_habilidad: 34,
          nivel_demostrado: 2,
          fecha_adquisicion: "2024-11-17T06:00:00.000Z",
          evidencia: null,
          fecha_creacion: "2025-03-10T20:32:08.043Z",
          fecha_actualizacion: "2025-03-10T20:32:08.043Z",
          nombre: "Inteligencia emocional",
          categoria: "BLANDA",
          descripcion: "Reconocimiento y gestión de emociones",
          nivel_maximo: 5,
        },
        {
          id_persona: 2,
          id_habilidad: 40,
          nivel_demostrado: 1,
          fecha_adquisicion: "2024-07-30T06:00:00.000Z",
          evidencia: null,
          fecha_creacion: "2025-03-10T20:32:08.043Z",
          fecha_actualizacion: "2025-03-10T20:32:08.043Z",
          nombre: "Presentaciones",
          categoria: "BLANDA",
          descripcion: "Capacidad para realizar presentaciones efectivas",
          nivel_maximo: 5,
        },
      ],
      employeeProfessionalHistory: [
        { puesto: "Junior Developer", empresa: "Tech Corp" },
      ],
    };

    test("should return cached user vector when available", async () => {
      const cachedVector = [0.1, 0.2, 0.3];
      mockCache.get.mockReturnValue(cachedVector);

      const result = await getUserProfileVector(mockUserData);

      expect(mockCache.get).toHaveBeenCalledWith("user_vector_2");
      expect(result).toEqual(cachedVector);
      expect(mockEmbeddings.embedQuery).not.toHaveBeenCalled();
    });

    test("should create and cache user vector when not cached", async () => {
      mockCache.get.mockReturnValue(undefined);
      const mockVector = [0.1, 0.2, 0.3];
      mockEmbeddings.embedQuery.mockResolvedValue(mockVector);

      const result = await getUserProfileVector(mockUserData);

      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith(
        expect.stringContaining("Rol: Cloud Developer")
      );
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith(
        expect.stringContaining("Habilidades:")
      );

      expect(mockCache.set).toHaveBeenCalledWith(
        "user_vector_2",
        mockVector,
        24 * 60 * 60
      );
      expect(result).toEqual(mockVector);
    });

    test("should handle missing user profile data gracefully", async () => {
      const incompleteUserData = {
        userProfile: { id_persona: 2 },
        currentRole: null,
        employeeSkills: [],
        employeeProfessionalHistory: [],
      };

      mockCache.get.mockReturnValue(undefined);
      const mockVector = [0.1, 0.2, 0.3];
      mockEmbeddings.embedQuery.mockResolvedValue(mockVector);

      const result = await getUserProfileVector(incompleteUserData);

      expect(result).toEqual(mockVector);
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith(
        expect.stringContaining("Habilidades:")
      );
    });
  });

  describe("findRelevantCoursesAndCerts", () => {
    const mockUserData = {
      employeeCourses: [{ id_curso: 1 }],
      employeeCertifications: [{ id_certificacion: 1 }],
    };

    const mockVectors = {
      courseEmbeddings: [
        {
          original: {
            id_curso: 1,
            nombre: "Java Avanzado",
            institucion: "Oracle Academy",
            descripcion:
              "Curso avanzado de Java con enfoque en arquitecturas empresariales",
            duracion: 60,
            modalidad: "VIRTUAL",
            categoria: "Desarrollo Backend",
          },
          vector: [0.1, 0.2],
        },
        {
          original: {
            id_curso: 2,
            nombre: "Python para Data Science",
            institucion: "Coursera",
            descripcion: "Fundamentos de Python aplicado a ciencia de datos",
            duracion: 45,
            modalidad: "VIRTUAL",
            categoria: "Ciencia de Datos",
          },
          vector: [0.3, 0.4],
        },
        {
          original: {
            id_curso: 3,
            nombre: "Desarrollo Web con React",
            institucion: "Udemy",
            descripcion: "Construcción de aplicaciones web modernas con React",
            duracion: 50,
            modalidad: "VIRTUAL",
            categoria: "Desarrollo Frontend",
          },
          vector: [0.5, 0.6],
        },
        {
          original: {
            id_curso: 4,
            nombre: "Arquitectura Cloud Azure",
            institucion: "Microsoft",
            descripcion: "Diseño e implementación de soluciones en Azure",
            duracion: 80,
            modalidad: "VIRTUAL",
            categoria: "Cloud Computing",
          },
          vector: [0.7, 0.8],
        },
      ],

      certEmbeddings: [
        {
          original: {
            id_certificacion: 1,
            nombre: "AWS Certified Solutions Architect – Associate",
            institucion: "Amazon Web Services",
            validez: 36,
            nivel: 4,
          },
          vector: [0.1, 0.2],
        },
        {
          original: {
            id_certificacion: 2,
            nombre: "Microsoft Certified: Azure Developer Associate",
            institucion: "Microsoft",
            validez: 24,
            nivel: 4,
          },
          vector: [0.3, 0.4],
        },
        {
          original: {
            id_certificacion: 3,
            nombre: "Oracle Certified Professional: Java SE 11 Developer",
            institucion: "Oracle",
            validez: 36,
            nivel: 4,
          },
          vector: [0.5, 0.6],
        },
        {
          original: {
            id_certificacion: 4,
            nombre: "Professional Scrum Master I (PSM I)",
            institucion: "Scrum.org",
            validez: 0,
            nivel: 3,
          },
          vector: [0.7, 0.8],
        },
      ],
    };

    const mockUserVector = [0.2, 0.3];

    test("should filter out courses and certifications user already has", async () => {
      const result = await findRelevantCoursesAndCerts(
        mockUserData,
        mockUserVector,
        mockVectors,
        5
      );

      expect(result.topCourses).toHaveLength(3);
      expect(result.topCourses.every((course) => course.id_curso !== 1)).toBe(
        true
      );

      expect(result.topCertifications).toHaveLength(3);
      expect(
        result.topCertifications.every((cert) => cert.id_certificacion !== 1)
      ).toBe(true);
    });

    test("should return courses sorted by similarity score", async () => {
      const result = await findRelevantCoursesAndCerts(
        mockUserData,
        mockUserVector,
        mockVectors,
        2
      );

      expect(result.topCourses).toHaveLength(2);
      expect(result.topCourses[0]).toHaveProperty("id_curso");
      expect(result.topCourses[0]).toHaveProperty("nombre");
    });

    test("should respect topN parameter", async () => {
      const result = await findRelevantCoursesAndCerts(
        mockUserData,
        mockUserVector,
        mockVectors,
        1
      );

      expect(result.topCourses).toHaveLength(1);
      expect(result.topCertifications).toHaveLength(1);
    });

    test("should filter by course category when provided", async () => {
      const result = await findRelevantCoursesAndCerts(
        mockUserData,
        mockUserVector,
        mockVectors,
        5,
        "Desarrollo Frontend"
      );

      expect(result.topCourses).toHaveLength(1);
      expect(result.topCourses[0].categoria).toBe("Desarrollo Frontend");
    });
  });

  describe("invalidateUserVectorCache", () => {
    test("should call cache.del with correct key", () => {
      const id_persona = 2;

      invalidateUserVectorCache(id_persona);

      expect(mockCache.del).toHaveBeenCalledWith(`user_vector_${id_persona}`);
    });
  });
});
