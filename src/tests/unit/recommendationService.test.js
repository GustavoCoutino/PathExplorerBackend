jest.mock("@langchain/openai");
jest.mock("node-cache");
jest.mock("@langchain/core/output_parsers");
jest.mock("@langchain/core/runnables");
const { ChatOpenAI } = require("@langchain/openai");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const NodeCache = require("node-cache");
const mockEmbeddings = {
  embedQuery: jest.fn(),
};

const mockLLM = {
  invoke: jest.fn(),
};

const mockOutputParser = {
  invoke: jest.fn(),
};

const mockPromptTemplate = {
  invoke: jest.fn(),
};

const mockChain = {
  invoke: jest.fn(),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

ChatOpenAI.mockImplementation(() => mockLLM);
StringOutputParser.mockImplementation(() => mockOutputParser);
PromptTemplate.fromTemplate = jest.fn(() => mockPromptTemplate);
RunnableSequence.from = jest.fn(() => mockChain);
NodeCache.mockImplementation(() => mockCache);

const {
  generateTrajectoryRecommendations,
  generateCourseAndCertRecommendations,
  invalidateRecommendationCaches,
  generateRoleRecommendations,
} = require("../../services/recommendationService");

describe("recommendationService", () => {
  const mockUserData = {
    currentRole: "Backend Developer",
    employeeCourses: [
      {
        id_curso: 2,
        nombre: "Python para Data Science",
        institucion: "Coursera",
        descripcion: "Fundamentos de Python aplicado a ciencia de datos",
        duracion: 45,
        modalidad: "VIRTUAL",
        categoria: "Ciencia de Datos",
        fecha_inicio: "2025-01-19T06:00:00.000Z",
        fecha_finalizacion: "2025-05-30T06:00:00.000Z",
        calificacion: "95.00",
        certificado: true,
        fecha_creacion: null,
        progreso: "100.00",
      },
      {
        id_curso: 3,
        nombre: "Desarrollo Web con React",
        institucion: "Udemy",
        descripcion: "Construcción de aplicaciones web modernas con React",
        duracion: 50,
        modalidad: "VIRTUAL",
        categoria: "Desarrollo Frontend",
        fecha_inicio: "2025-04-30T06:00:00.000Z",
        fecha_finalizacion: "2025-05-15T06:00:00.000Z",
        calificacion: "100.00",
        certificado: false,
        fecha_creacion: "2025-05-13T17:58:44.367Z",
        progreso: "100.00",
      },
      {
        id_curso: 4,
        nombre: "Arquitectura Cloud Azure",
        institucion: "Microsoft",
        descripcion: "Diseño e implementación de soluciones en Azure",
        duracion: 80,
        modalidad: "VIRTUAL",
        categoria: "Cloud Computing",
        fecha_inicio: "2025-01-19T06:00:00.000Z",
        fecha_finalizacion: "2025-04-23T06:00:00.000Z",
        calificacion: "0.01",
        certificado: false,
        fecha_creacion: "2025-05-11T00:00:00.000Z",
        progreso: "100.00",
      },
    ],
    employeeCertifications: [
      {
        id_certificacion: 7,
        nombre: "Google Cloud Professional Data Engineer",
        institucion: "Google",
        validez: 24,
        nivel: 4,
        fecha_obtencion: "2025-04-01T06:00:00.000Z",
        fecha_vencimiento: "2025-05-11T06:00:00.000Z",
        estado_validacion: true,
        fecha_creacion: "2025-04-28T22:42:38.094Z",
      },
      {
        id_certificacion: 10,
        nombre: "TensorFlow Developer Certificate",
        institucion: "Google",
        validez: 36,
        nivel: 4,
        fecha_obtencion: "2025-05-15T06:00:00.000Z",
        fecha_vencimiento: "2025-05-16T06:00:00.000Z",
        estado_validacion: false,
        fecha_creacion: "2025-05-15T23:20:42.894Z",
      },
    ],
    employeeSkills: [
      {
        id_persona: 1,
        id_habilidad: 5,
        nivel_demostrado: 5,
        fecha_adquisicion: "2024-07-23T06:00:00.000Z",
        evidencia: null,
        fecha_creacion: "2025-03-10T20:32:08.043Z",
        fecha_actualizacion: "2025-03-10T20:32:08.043Z",
        nombre: "Git",
        categoria: "TECNICA",
        descripcion: "Control de versiones y colaboración con Git",
        nivel_maximo: 4,
      },
      {
        id_persona: 1,
        id_habilidad: 26,
        nivel_demostrado: 4,
        fecha_adquisicion: "2024-07-20T06:00:00.000Z",
        evidencia: null,
        fecha_creacion: "2025-03-10T20:32:08.043Z",
        fecha_actualizacion: "2025-03-10T20:32:08.043Z",
        nombre: "Comunicación efectiva",
        categoria: "BLANDA",
        descripcion: "Habilidad para comunicarse clara y efectivamente",
        nivel_maximo: 5,
      },
    ],
    employeeProfessionalHistory: [
      {
        nombre: "Juan",
        apellido: "Pérez",
        historial_profesional:
          "Experiencia en múltiples proyectos de desarrollo.\n" +
          "Colaboración en equipos multifuncionales.\n" +
          "Implementación de soluciones tecnológicas empresariales.",
        role: "Backend Developer",
        achievements: "Obtener certificación AWS Solutions Architect",
      },
    ],
    userProfile: { id_persona: 1 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";
  });
  describe("generateTrajectoryRecommendations", () => {
    const mockTrajectoryResponse = {
      success: true,
      message: "Recomendaciones generadas exitosamente",
      recommendations: [
        {
          nombre: "Trayectoria hacia la Arquitectura de Soluciones Cloud",
          descripcion:
            "Esta trayectoria está diseñada para llevar al empleado de su rol actual de Desarrollador Backend hacia un rol de Arquitecto de Soluciones Cloud. Este camino aprovecha su experiencia en desarrollo, así como su conocimiento en Python, Azure y AWS.",
          roles_secuenciales: [
            "Desarrollador Backend",
            "Desarrollador Cloud",
            "Arquitecto de Soluciones Cloud",
          ],
          tiempo_estimado: 48,
        },
        {
          nombre: "Trayectoria hacia la Ciencia de Datos",
          descripcion:
            "Esta trayectoria está diseñada para llevar al empleado de su rol actual de Desarrollador Backend hacia un rol de Científico de Datos. Este camino aprovecha su experiencia en desarrollo y su conocimiento en Python y visualización de datos.",
          roles_secuenciales: [
            "Desarrollador Backend",
            "Analista de Datos",
            "Científico de Datos",
          ],
          tiempo_estimado: 60,
        },
        {
          nombre: "Trayectoria hacia la Gestión de Proyectos de Software",
          descripcion:
            "Esta trayectoria está diseñada para llevar al empleado de su rol actual de Desarrollador Backend hacia un rol de Gerente de Proyectos de Software. Este camino aprovecha su experiencia en desarrollo y su conocimiento en gestión y Scrum.",
          roles_secuenciales: [
            "Desarrollador Backend",
            "Scrum Master",
            "Gerente de Proyectos de Software",
          ],
          tiempo_estimado: 36,
        },
      ],
    };

    it("should return cached recommendations if available", async () => {
      mockCache.get.mockReturnValue(mockTrajectoryResponse);

      const result = await generateTrajectoryRecommendations(mockUserData);

      expect(result).toEqual({
        fromCache: true,
        recommendations: mockTrajectoryResponse,
      });
      expect(mockCache.get).toHaveBeenCalledWith(
        "trajectory_recommendations_Backend Developer"
      );
      expect(mockChain.invoke).not.toHaveBeenCalled();
    });

    it("should generate new recommendations when cache is empty", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue(
        JSON.stringify(mockTrajectoryResponse)
      );

      const result = await generateTrajectoryRecommendations(mockUserData);

      expect(result).toEqual({
        fromCache: false,
        recommendations: mockTrajectoryResponse,
      });
      expect(mockCache.set).toHaveBeenCalledWith(
        "trajectory_recommendations_Backend Developer",
        mockTrajectoryResponse
      );
      expect(mockChain.invoke).toHaveBeenCalledWith({
        employeeRole: mockUserData.currentRole,
        employeeCourses: mockUserData.employeeCourses,
        employeeCertifications: mockUserData.employeeCertifications,
        employeeSkills: mockUserData.employeeSkills,
        employeeProfessionalHistory: mockUserData.employeeProfessionalHistory,
      });
    });

    it("should handle JSON parsing errors", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue("invalid json");

      await expect(
        generateTrajectoryRecommendations(mockUserData)
      ).rejects.toThrow("Error processing recommendations");
    });

    it("should initialize ChatOpenAI with correct parameters", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue(
        JSON.stringify(mockTrajectoryResponse)
      );

      await generateTrajectoryRecommendations(mockUserData);

      expect(ChatOpenAI).toHaveBeenCalledWith({
        temperature: 0.3,
        modelName: "gpt-3.5-turbo",
        openAIApiKey: "test-api-key",
        timeout: 30000,
      });
    });
  });

  describe("generateCourseAndCertRecommendations", () => {
    const mockTopCourses = [
      { id: 1, nombre: "Advanced JavaScript", institucion: "Tech Academy" },
      { id: 2, nombre: "React Hooks", institucion: "Code School" },
    ];

    const mockTopCertifications = [
      { id: 1, nombre: "AWS Solutions Architect", institucion: "Amazon" },
      { id: 2, nombre: "Google Cloud Professional", institucion: "Google" },
    ];

    const mockCourseResponse = {
      cursos_recomendados: [
        {
          id: 1,
          nombre: "Advanced JavaScript",
          institucion: "Tech Academy",
          descripcion: "Deep dive into JS concepts",
          razon_recomendacion: "Enhances existing JS skills",
        },
      ],
      certificaciones_recomendadas: [
        {
          id: 1,
          nombre: "AWS Solutions Architect",
          institucion: "Amazon",
          descripcion: "Cloud architecture certification",
          razon_recomendacion: "Complements existing AWS knowledge",
        },
      ],
    };

    it("should return cached recommendations if available", async () => {
      mockCache.get.mockReturnValue(mockCourseResponse);

      const result = await generateCourseAndCertRecommendations(
        mockUserData,
        mockTopCourses,
        mockTopCertifications
      );

      expect(result).toEqual({
        fromCache: true,
        recommendations: mockCourseResponse,
      });
      expect(mockCache.get).toHaveBeenCalledWith("course_recommendations_1");
    });

    it("should generate new recommendations when cache is empty", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue(JSON.stringify(mockCourseResponse));

      const result = await generateCourseAndCertRecommendations(
        mockUserData,
        mockTopCourses,
        mockTopCertifications
      );

      expect(result).toEqual({
        fromCache: false,
        recommendations: mockCourseResponse,
      });
      expect(mockCache.set).toHaveBeenCalledWith(
        "course_recommendations_1",
        mockCourseResponse
      );
    });

    it("should handle filters in cache key", async () => {
      const filters = {
        coursesAbilities: "Javascript",
        certificationsAbilities: "MachineLearning",
      };
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue(JSON.stringify(mockCourseResponse));

      await generateCourseAndCertRecommendations(
        mockUserData,
        mockTopCourses,
        mockTopCertifications,
        filters
      );

      const expectedCacheKey = `course_recommendations_1_${Buffer.from(
        "coursesAbilities=Javascript&certificationsAbilities=MachineLearning"
      ).toString("base64")}`;
      expect(mockCache.get).toHaveBeenCalledWith(expectedCacheKey);
    });

    it("should slice arrays in input params correctly", async () => {
      const userDataWithLongArrays = {
        ...mockUserData,
        employeeCourses: new Array(10).fill("Course"),
        employeeCertifications: new Array(10).fill("Cert"),
        employeeSkills: new Array(20).fill("Skill"),
        employeeProfessionalHistory: new Array(10).fill({ role: "Role" }),
      };

      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue(JSON.stringify(mockCourseResponse));

      await generateCourseAndCertRecommendations(
        userDataWithLongArrays,
        mockTopCourses,
        mockTopCertifications
      );

      const invokeCall = mockChain.invoke.mock.calls[0][0];
      expect(JSON.parse(invokeCall.employeeCourses)).toHaveLength(5);
      expect(JSON.parse(invokeCall.employeeCertifications)).toHaveLength(5);
      expect(JSON.parse(invokeCall.employeeSkills)).toHaveLength(10);
      expect(JSON.parse(invokeCall.employeeProfessionalHistory)).toHaveLength(
        3
      );
    });

    it("should handle JSON parsing errors", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue("invalid json");

      await expect(
        generateCourseAndCertRecommendations(
          mockUserData,
          mockTopCourses,
          mockTopCertifications
        )
      ).rejects.toThrow("Error processing course recommendations");
    });
  });

  describe("generateRoleRecommendations", () => {
    const mockTopRoles = [
      {
        id_rol: 30,
        titulo: "UX Researcher",
        descripcion:
          "Investigar y diseñar experiencias de usuario óptimas para clientes.",
        nivel_experiencia_requerido: 3,
        id_proyecto: 6,
        id_manager: 46,
        project: [
          {
            id_proyecto: 10,
            nombre: "Testing to see ",
            descripcion:
              "Desarrollo de LMS con capacidades avanzadas de interactividad y analítica de aprendizaje.",
            fecha_inicio: "2023-10-20T06:00:00.000Z",
            fecha_fin_estimada: "2024-08-15T06:00:00.000Z",
            estado: "PLANEACION",
          },
        ],
        skills: [
          {
            id_habilidad: 5,
            nombre: "Git",
            categoria: "TECNICA",
            descripcion: "Control de versiones y colaboración con Git",
            nivel_minimo_requerido: 2,
            importancia: 3,
          },
          {
            id_habilidad: 12,
            nombre: "Spring Boot",
            categoria: "TECNICA",
            descripcion: "Desarrollo backend con Spring Boot",
            nivel_minimo_requerido: 4,
            importancia: 3,
          },
        ],
        manager: [
          {
            id_persona: 43,
            nombre: "Daniel Esteban Andres",
            apellido: "Campos",
            email: "daniel.campos@accenture.com",
          },
        ],
      },
      {
        id_rol: 42,
        titulo: "Desarrollador Java",
        descripcion: "Implementar componentes backend para el sistema de RH.",
        nivel_experiencia_requerido: 4,
        id_proyecto: 9,
        id_manager: 42,
        project: [
          {
            id_proyecto: 40,
            nombre: "Proyecto funciona con los cambios",
            descripcion: "Funciona con los cambios",
            fecha_inicio: "2025-04-28T06:00:00.000Z",
            fecha_fin_estimada: "2025-05-31T06:00:00.000Z",
            estado: "PLANEACION",
          },
        ],
        skills: [
          {
            id_habilidad: 6,
            nombre: "AWS",
            categoria: "TECNICA",
            descripcion: "Servicios de Amazon Web Services",
            nivel_minimo_requerido: 5,
            importancia: 5,
          },
          {
            id_habilidad: 21,
            nombre: "DevOps",
            categoria: "TECNICA",
            descripcion: "Cultura y prácticas DevOps",
            nivel_minimo_requerido: 3,
            importancia: 3,
          },
        ],
        manager: [
          {
            id_persona: 43,
            nombre: "Daniel Esteban Andres",
            apellido: "Campos",
            email: "daniel.campos@accenture.com",
          },
        ],
      },
      {
        id_rol: 41,
        titulo: "Arquitecto de Software",
        descripcion: "Diseñar arquitectura para el sistema de RH.",
        nivel_experiencia_requerido: 5,
        id_proyecto: 9,
        id_manager: 42,
        project: [
          {
            id_proyecto: 6,
            nombre: "Portal de Atención al Cliente",
            descripcion:
              "Desarrollo de portal web para atención y soporte al cliente con inteligencia artificial.",
            fecha_inicio: "2023-06-18T06:00:00.000Z",
            fecha_fin_estimada: "2024-01-15T06:00:00.000Z",
            estado: "ACTIVO",
          },
        ],
        skills: [
          {
            id_habilidad: 5,
            nombre: "Git",
            categoria: "TECNICA",
            descripcion: "Control de versiones y colaboración con Git",
            nivel_minimo_requerido: 2,
            importancia: 4,
          },
          {
            id_habilidad: 12,
            nombre: "Spring Boot",
            categoria: "TECNICA",
            descripcion: "Desarrollo backend con Spring Boot",
            nivel_minimo_requerido: 3,
            importancia: 3,
          },
          {
            id_habilidad: 23,
            nombre: "Scrum",
            categoria: "TECNICA",
            descripcion: "Framework ágil para gestión de proyectos",
            nivel_minimo_requerido: 4,
            importancia: 4,
          },
          {
            id_habilidad: 25,
            nombre: "Blockchain",
            categoria: "TECNICA",
            descripcion: "Tecnología de cadena de bloques",
            nivel_minimo_requerido: 2,
            importancia: 4,
          },
        ],
        manager: [
          {
            id_persona: 46,
            nombre: "Pilar",
            apellido: "Calvo",
            email: "pilar.calvo@accenture.com",
          },
        ],
      },
    ];

    const mockRoleResponse = {
      success: true,
      message: "Recomendaciones de roles generadas exitosamente",
      recommendations: [
        {
          id_rol: 84,
          nombre: "Arquitecto Cloud",
          razon_recomendacion:
            "El empleado ha completado cursos relacionados con Cloud Computing y tiene una certificación de Google Cloud Professional Data Engineer. Además, ha demostrado habilidades en AWS, lo que es relevante para este rol. Este rol también podría ayudar al empleado a alcanzar su objetivo de obtener la certificación AWS Solutions Architect.",
          compatibilidad_porcentaje: 90,
          roleWithProject: {
            id_rol: 84,
            titulo: "Arquitecto Cloud",
            descripcion: "Arquitecto Cloud Desc",
            nivel_experiencia_requerido: 2,
            id_proyecto: 40,
            id_manager: 43,
            project: [
              {
                id_proyecto: 40,
                nombre: "Proyecto funciona con los cambios",
                descripcion: "Funciona con los cambios",
                fecha_inicio: "2025-04-28T06:00:00.000Z",
                fecha_fin_estimada: "2025-05-31T06:00:00.000Z",
                estado: "PLANEACION",
              },
            ],
            skills: [
              {
                id_habilidad: 6,
                nombre: "AWS",
                categoria: "TECNICA",
                descripcion: "Servicios de Amazon Web Services",
                nivel_minimo_requerido: 5,
                importancia: 5,
              },
              {
                id_habilidad: 21,
                nombre: "DevOps",
                categoria: "TECNICA",
                descripcion: "Cultura y prácticas DevOps",
                nivel_minimo_requerido: 3,
                importancia: 3,
              },
            ],
            manager: [
              {
                id_persona: 43,
                nombre: "Daniel Esteban Andres",
                apellido: "Campos",
                email: "daniel.campos@accenture.com",
              },
            ],
          },
        },
        {
          id_rol: 42,
          nombre: "Desarrollador Java",
          razon_recomendacion:
            "El empleado tiene una fuerte experiencia en desarrollo backend y ha completado un curso de Spring Boot Microservices. Este rol podría ayudar al empleado a profundizar sus habilidades en Java y en el desarrollo de sistemas de gestión de recursos humanos.",
          compatibilidad_porcentaje: 80,
          roleWithProject: {
            id_rol: 42,
            titulo: "Desarrollador Java",
            descripcion:
              "Implementar componentes backend para el sistema de RH.",
            nivel_experiencia_requerido: 4,
            id_proyecto: 9,
            id_manager: 42,
            project: [
              {
                id_proyecto: 9,
                nombre: "Sistema de Gestión de Recursos Humanos",
                descripcion:
                  "Implementación de plataforma para optimizar procesos de RH, reclutamiento y desarrollo de talento.",
                fecha_inicio: "2023-09-14T06:00:00.000Z",
                fecha_fin_estimada: "2024-07-31T06:00:00.000Z",
                estado: "PLANEACION",
              },
            ],
            skills: [
              {
                id_habilidad: 1,
                nombre: "Java",
                categoria: "TECNICA",
                descripcion: "Programación en Java y su ecosistema",
                nivel_minimo_requerido: 4,
                importancia: 4,
              },
              {
                id_habilidad: 4,
                nombre: "SQL",
                categoria: "TECNICA",
                descripcion:
                  "Gestión y consulta de bases de datos relacionales",
                nivel_minimo_requerido: 2,
                importancia: 3,
              },
              {
                id_habilidad: 16,
                nombre: "Natural Language Processing",
                categoria: "TECNICA",
                descripcion: "Procesamiento de lenguaje natural",
                nivel_minimo_requerido: 4,
                importancia: 4,
              },
              {
                id_habilidad: 17,
                nombre: "Data Analysis",
                categoria: "TECNICA",
                descripcion: "Análisis y visualización de datos",
                nivel_minimo_requerido: 4,
                importancia: 5,
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
                id_persona: 42,
                nombre: "Mónica",
                apellido: "Rojas",
                email: "monica.rojas@accenture.com",
              },
            ],
          },
        },
        {
          id_rol: 41,
          nombre: "Arquitecto de Software",
          razon_recomendacion:
            "El empleado ha completado varios cursos relacionados con el desarrollo y la arquitectura de software, incluyendo un curso de Arquitectura Cloud Azure. Este rol podría ayudar al empleado a aplicar y profundizar sus habilidades en el diseño de arquitecturas de software.",
          compatibilidad_porcentaje: 75,
          roleWithProject: {
            id_rol: 41,
            titulo: "Arquitecto de Software",
            descripcion: "Diseñar arquitectura para el sistema de RH.",
            nivel_experiencia_requerido: 5,
            id_proyecto: 9,
            id_manager: 42,
            project: [
              {
                id_proyecto: 9,
                nombre: "Sistema de Gestión de Recursos Humanos",
                descripcion:
                  "Implementación de plataforma para optimizar procesos de RH, reclutamiento y desarrollo de talento.",
                fecha_inicio: "2023-09-14T06:00:00.000Z",
                fecha_fin_estimada: "2024-07-31T06:00:00.000Z",
                estado: "PLANEACION",
              },
            ],
            skills: [
              {
                id_habilidad: 10,
                nombre: "Vue.js",
                categoria: "TECNICA",
                descripcion: "Desarrollo frontend con Vue.js",
                nivel_minimo_requerido: 4,
                importancia: 3,
              },
              {
                id_habilidad: 22,
                nombre: "Agile",
                categoria: "TECNICA",
                descripcion: "Metodologías ágiles de desarrollo",
                nivel_minimo_requerido: 2,
                importancia: 5,
              },
              {
                id_habilidad: 24,
                nombre: "Kanban",
                categoria: "TECNICA",
                descripcion: "Método para gestión visual de tareas",
                nivel_minimo_requerido: 2,
                importancia: 4,
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
        },
      ],
    };

    it("should return cached recommendations if available", async () => {
      mockCache.get.mockReturnValue(mockRoleResponse);

      const result = await generateRoleRecommendations(
        mockUserData,
        mockTopRoles
      );

      expect(result).toEqual({
        fromCache: true,
        recommendations: mockRoleResponse,
      });
      expect(mockCache.get).toHaveBeenCalledWith("role_recommendations_1");
    });

    it("should generate new recommendations when cache is empty", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue(JSON.stringify(mockRoleResponse));

      const result = await generateRoleRecommendations(
        mockUserData,
        mockTopRoles
      );

      expect(result).toEqual({
        fromCache: false,
        recommendations: mockRoleResponse,
      });
      expect(mockCache.set).toHaveBeenCalledWith(
        "role_recommendations_1",
        mockRoleResponse
      );
      expect(mockChain.invoke).toHaveBeenCalledWith({
        employeeRole: mockUserData.currentRole,
        employeeCourses: mockUserData.employeeCourses,
        employeeCertifications: mockUserData.employeeCertifications,
        employeeSkills: mockUserData.employeeSkills,
        employeeProfessionalHistory: mockUserData.employeeProfessionalHistory,
        topRoles: JSON.stringify(mockTopRoles),
      });
    });

    it("should handle filters in cache key", async () => {
      const filters = {
        courseSkills: "Javascript",
        certificationSkills: "MachineLearning",
      };
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue(JSON.stringify(mockRoleResponse));

      await generateRoleRecommendations(mockUserData, mockTopRoles, filters);

      const expectedCacheKey = `role_recommendations_1_${Buffer.from(
        "courseSkills=Javascript&certificationSkills=MachineLearning"
      ).toString("base64")}`;
      expect(mockCache.get).toHaveBeenCalledWith(expectedCacheKey);
    });

    it("should handle JSON parsing errors", async () => {
      mockCache.get.mockReturnValue(undefined);
      mockChain.invoke.mockResolvedValue("invalid json");

      await expect(
        generateRoleRecommendations(mockUserData, mockTopRoles)
      ).rejects.toThrow("Error processing role recommendations");
    });
  });

  describe("invalidateRecommendationCaches", () => {
    it("should invalidate all relevant caches", () => {
      const id_persona = "1";

      invalidateRecommendationCaches(mockUserData, id_persona);

      expect(mockCache.del).toHaveBeenCalledWith(
        "trajectory_recommendations_Backend Developer"
      );
      expect(mockCache.del).toHaveBeenCalledWith("course_recommendations_1");
      expect(mockCache.del).toHaveBeenCalledWith("role_recommendations_1");
    });

    it("should handle userData without currentRole", () => {
      const userDataWithoutRole = { ...mockUserData };
      delete userDataWithoutRole.currentRole;
      const id_persona = "1";

      invalidateRecommendationCaches(userDataWithoutRole, id_persona);

      expect(mockCache.del).toHaveBeenCalledWith("course_recommendations_1");
      expect(mockCache.del).toHaveBeenCalledWith("role_recommendations_1");
      expect(mockCache.del).not.toHaveBeenCalledWith(
        expect.stringContaining("trajectory_recommendations")
      );
    });

    it("should handle null userData", () => {
      const id_persona = "1";

      invalidateRecommendationCaches(null, id_persona);

      expect(mockCache.del).toHaveBeenCalledWith("course_recommendations_1");
      expect(mockCache.del).toHaveBeenCalledWith("role_recommendations_1");
      expect(mockCache.del).not.toHaveBeenCalledWith(
        expect.stringContaining("trajectory_recommendations")
      );
    });
  });
});
