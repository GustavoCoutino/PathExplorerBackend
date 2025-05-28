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

const { getUserProfileVector } = require("../../services/vectorService");

describe("vectorService - User Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        {
          nombre: "Maria",
          apellido: "Gonzalez",
          historial_profesional:
            "Experiencia en múltiples proyectos de desarrollo. Colaboración en equipos multifuncionales. Implementación de soluciones tecnológicas empresariales",
          role: "Cloud Specialist",
          achievements: "Desarrollar competencias en Inteligencia Artificial",
        },
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
        expect.stringContaining("Habilidades: ")
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
        expect.stringContaining("Rol: null")
      );
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith(
        expect.stringContaining("Habilidades: .")
      );
    });

    test("should handle undefined skills gracefully", async () => {
      const userDataWithUndefinedSkills = {
        userProfile: { id_persona: 2 },
        currentRole: "Cloud Developer",
        employeeSkills: [
          {
            id_persona: 2,
            id_habilidad: 5,
            nivel_demostrado: undefined,
            fecha_adquisicion: "2023-11-13T06:00:00.000Z",
            evidencia: null,
            fecha_creacion: "2025-03-10T20:32:08.043Z",
            fecha_actualizacion: "2025-03-10T20:32:08.043Z",
            nombre: undefined,
            categoria: "TECNICA",
            descripcion: "Control de versiones y colaboración con Git",
            nivel_maximo: 4,
          },
        ],
        employeeProfessionalHistory: [
          {
            nombre: "Maria",
            apellido: "Gonzalez",
            historial_profesional:
              "Experiencia en múltiples proyectos de desarrollo. Colaboración en equipos multifuncionales. Implementación de soluciones tecnológicas empresariales",
            role: "Cloud Specialist",
            achievements: "Desarrollar competencias en Inteligencia Artificial",
          },
        ],
      };

      mockCache.get.mockReturnValue(undefined);
      const mockVector = [0.4, 0.5, 0.6];
      mockEmbeddings.embedQuery.mockResolvedValue(mockVector);

      const result = await getUserProfileVector(userDataWithUndefinedSkills);

      expect(result).toEqual(mockVector);
      expect(mockEmbeddings.embedQuery).toHaveBeenCalled();
    });

    test("should use default professional goals when missing", async () => {
      const userData = {
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
        ],
        employeeProfessionalHistory: [
          {
            historial_profesional: "Some professional background",
            achievements: "Some achievements",
          },
        ],
      };

      mockCache.get.mockReturnValue(undefined);
      const mockVector = [0.7, 0.8, 0.9];
      mockEmbeddings.embedQuery.mockResolvedValue(mockVector);

      await getUserProfileVector(userData);

      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith(
        expect.stringContaining("Cloud Developer")
      );
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith(
        expect.stringContaining("Git")
      );
    });

    test("should handle missing employeeProfessionalHistory gracefully", async () => {
      const userData = {
        userProfile: { id_persona: 2 },
        currentRole: "Cloud Developer",
        employeeSkills: [
          {
            id_persona: 2,
            id_habilidad: 5,
            nivel_demostrado: undefined,
            fecha_adquisicion: "2023-11-13T06:00:00.000Z",
            evidencia: null,
            fecha_creacion: "2025-03-10T20:32:08.043Z",
            fecha_actualizacion: "2025-03-10T20:32:08.043Z",
            nombre: undefined,
            categoria: "TECNICA",
            descripcion: "Control de versiones y colaboración con Git",
            nivel_maximo: 4,
          },
        ],
      };

      mockCache.get.mockReturnValue(undefined);
      const mockVector = [0.1, 0.2, 0.3];
      mockEmbeddings.embedQuery.mockResolvedValue(mockVector);
      await expect(getUserProfileVector(userData)).rejects.toThrow();
    });

    test("should handle empty employeeProfessionalHistory array", async () => {
      const userData = {
        userProfile: { id_persona: 2 },
        currentRole: "Cloud Developer",
        employeeSkills: [
          {
            id_persona: 2,
            id_habilidad: 5,
            nivel_demostrado: undefined,
            fecha_adquisicion: "2023-11-13T06:00:00.000Z",
            evidencia: null,
            fecha_creacion: "2025-03-10T20:32:08.043Z",
            fecha_actualizacion: "2025-03-10T20:32:08.043Z",
            nombre: undefined,
            categoria: "TECNICA",
            descripcion: "Control de versiones y colaboración con Git",
            nivel_maximo: 4,
          },
        ],
        employeeProfessionalHistory: [],
      };

      mockCache.get.mockReturnValue(undefined);
      const mockVector = [0.1, 0.2, 0.3];
      mockEmbeddings.embedQuery.mockResolvedValue(mockVector);

      const result = await getUserProfileVector(userData);

      expect(result).toEqual(mockVector);
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith(
        expect.stringContaining("Historial profesional: .")
      );
    });
  });
});
