const { getUserData } = require("../../services/userDataService");

jest.mock("node-cache", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }));
});

describe("userDataService", () => {
  let mockUserQueries;

  beforeEach(() => {
    mockUserQueries = {
      getUserProfile: jest.fn(),
      getUserCourses: jest.fn(),
      getUserCertifications: jest.fn(),
      getUserSkills: jest.fn(),
      getUserProfessionalHistory: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("getUserData", () => {
    const mockUserId = 2;
    const mockUserData = {
      userProfile: { id_persona: 2, puesto_actual: "Cloud Specialist" },
      employeeCourses: [
        {
          id_curso: 3,
          nombre: "Desarrollo Web con React",
          institucion: "Udemy",
          descripcion: "Construcción de aplicaciones web modernas con React",
          duracion: 50,
          modalidad: "VIRTUAL",
          categoria: "Desarrollo Frontend",
          fecha_inicio: "2025-05-01T06:00:00.000Z",
          fecha_finalizacion: "2025-05-13T06:00:00.000Z",
          calificacion: "94.30",
          certificado: false,
          fecha_creacion: "2025-05-13T18:04:18.148Z",
          progreso: "100.00",
        },
      ],
      employeeCertifications: [
        {
          ID_Certificacion: 9,
          Nombre: "Project Management Professional (PMP)",
          Institucion: "Project Management Institute",
          Validez: 36,
          Nivel: 5,
          fecha_obtencion: "2024-10-26T06:00:00.000Z",
          fecha_vencimiento: "2027-04-10T06:00:00.000Z",
          estado_validacion: true,
          fecha_creacion: "2025-03-10T20:32:08.090Z",
        },
        {
          ID_Certificacion: 12,
          Nombre: "Certified Cloud Security Professional (CCSP)",
          Institucion: "ISC²",
          Validez: 36,
          Nivel: 5,
          fecha_obtencion: "2025-05-13T06:00:00.000Z",
          fecha_vencimiento: "2027-06-13T06:00:00.000Z",
          estado_validacion: true,
          fecha_creacion: "2025-05-13T18:05:06.520Z",
        },
      ],
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
          nombre: "María",
          apellido: "González",
          historial_profesional:
            "Experiencia en múltiples proyectos de desarrollo.\nColaboración en equipos multifuncionales.\nImplementación de soluciones tecnológicas empresariales.",
          role: "Cloud Specialist",
          achievements: "Desarrollar competencias en Inteligencia Artificial",
        },
      ],
    };

    beforeEach(() => {
      mockUserQueries.getUserProfile.mockResolvedValue(
        mockUserData.userProfile
      );
      mockUserQueries.getUserCourses.mockResolvedValue(
        mockUserData.employeeCourses
      );
      mockUserQueries.getUserCertifications.mockResolvedValue(
        mockUserData.employeeCertifications
      );
      mockUserQueries.getUserSkills.mockResolvedValue(
        mockUserData.employeeSkills
      );
      mockUserQueries.getUserProfessionalHistory.mockResolvedValue(
        mockUserData.employeeProfessionalHistory
      );
    });

    test("should fetch and return user data when not cached", async () => {
      const result = await getUserData(mockUserId, mockUserQueries);

      expect(result).toEqual({
        userProfile: mockUserData.userProfile,
        currentRole: "Cloud Specialist",
        employeeCourses: mockUserData.employeeCourses,
        employeeCertifications: mockUserData.employeeCertifications,
        employeeSkills: mockUserData.employeeSkills,
        employeeProfessionalHistory: mockUserData.employeeProfessionalHistory,
      });

      expect(mockUserQueries.getUserProfile).toHaveBeenCalledWith(mockUserId);
      expect(mockUserQueries.getUserCourses).toHaveBeenCalledWith(mockUserId);
      expect(mockUserQueries.getUserCertifications).toHaveBeenCalledWith(
        mockUserId
      );
      expect(mockUserQueries.getUserSkills).toHaveBeenCalledWith(mockUserId);
      expect(mockUserQueries.getUserProfessionalHistory).toHaveBeenCalledWith(
        mockUserId
      );
    });

    test("should handle errors when database queries fail", async () => {
      const error = new Error("Database connection failed");
      mockUserQueries.getUserProfile.mockRejectedValue(error);

      await expect(getUserData(mockUserId, mockUserQueries)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
