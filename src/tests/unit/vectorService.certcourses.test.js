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
  getOrCreateVectors,
  findRelevantCoursesAndCerts,
} = require("../../services/vectorService");

describe("vectorService - Courses & Certifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledTimes(4);

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
            categoria: "Desarrollo Backend",
            institucion: "Oracle Academy",
          },
          vector: [0.1, 0.2],
        },
        {
          original: {
            id_curso: 2,
            nombre: "Python para Data Science",
            categoria: "Ciencia de Datos",
            institucion: "Coursera",
          },
          vector: [0.3, 0.4],
        },
        {
          original: {
            id_curso: 3,
            nombre: "React Development",
            categoria: "Desarrollo Frontend",
            institucion: "Udemy",
          },
          vector: [0.5, 0.6],
        },
      ],
      certEmbeddings: [
        {
          original: {
            id_certificacion: 1,
            nombre: "AWS Solutions Architect",
            institucion: "Amazon Web Services",
          },
          vector: [0.1, 0.2],
        },
        {
          original: {
            id_certificacion: 2,
            nombre: "Azure Developer Associate",
            institucion: "Microsoft",
          },
          vector: [0.3, 0.4],
        },
        {
          original: {
            id_certificacion: 3,
            nombre: "Oracle Java Developer",
            institucion: "Oracle",
          },
          vector: [0.5, 0.6],
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

      expect(result.topCourses).toHaveLength(2);
      expect(result.topCourses.every((course) => course.id_curso !== 1)).toBe(
        true
      );

      expect(result.topCertifications).toHaveLength(2);
      expect(
        result.topCertifications.every((cert) => cert.id_certificacion !== 1)
      ).toBe(true);
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

    test("should filter by course provider when provided", async () => {
      const result = await findRelevantCoursesAndCerts(
        mockUserData,
        mockUserVector,
        mockVectors,
        5,
        null,
        null,
        null,
        "Udemy"
      );

      expect(result.topCourses).toHaveLength(1);
      expect(result.topCourses[0].institucion).toBe("Udemy");
    });

    test("should filter by certification provider when provided", async () => {
      const result = await findRelevantCoursesAndCerts(
        mockUserData,
        mockUserVector,
        mockVectors,
        5,
        null,
        null,
        null,
        null,
        "Microsoft"
      );

      expect(result.topCertifications).toHaveLength(1);
      expect(result.topCertifications[0].institucion).toBe("Microsoft");
    });
  });
});
