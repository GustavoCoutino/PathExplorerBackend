const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");

class CVProcessor {
  constructor() {
    // Configurar ambas APIs
    this.azureLLM = null;
    this.openaiLLM = null;
    this.currentProvider = "azure"; // Empezar con Azure por defecto

    this.initializeModels();

    this.prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `Eres un extractor de CV mundial que debe PRESERVAR TODA la información y SUMAR valor al candidato.

🌍 COMPATIBILIDAD GLOBAL:
- Funciona con CVs en CUALQUIER idioma (español, inglés, chino, alemán, etc.)
- Adapta a CUALQUIER formato y diseño
- Reconoce diferentes estructuras culturales de CV

🛡️ REGLA FUNDAMENTAL - NO QUITAR INFORMACIÓN:
❌ NUNCA resumir, parafrasear o eliminar contenido del usuario
✅ SIEMPRE preservar TODO el texto original exacto
✅ El objetivo es hacer que la persona se vea MEJOR, no peor

📋 EXPERIENCIA LABORAL - PRESERVACIÓN TOTAL:
✅ descripcion: TODA la información que escribió el usuario
- Si hay párrafo descriptivo: copiarlo EXACTO
- Si solo hay bullet points: ponerlos TODOS en descripción
- Si hay ambos: párrafo + todos los bullet points

✅ logros: TODOS los logros/bullets que escribió el usuario
- Mantener CADA bullet point exacto
- No eliminar ningún logro por "menor importancia"
- Si describió 10 logros, incluir los 10

🧠 EXTRACCIÓN INTELIGENTE DE HABILIDADES:
✅ TÉCNICAS: Extraer de TODA la experiencia, proyectos, educación
- Tecnologías mencionadas en descripción de trabajos
- Herramientas usadas en proyectos académicos
- Software mencionado en certificaciones

✅ BLANDAS: Extraer habilidades implícitas de experiencia
- "Lideré equipo" → Liderazgo
- "Colaboré con áreas" → Trabajo en equipo
- "Presenté resultados" → Comunicación
- "Resolví problemas" → Resolución de problemas
- "Manejé presión" → Gestión del estrés

🏆 PREMIOS Y RECONOCIMIENTOS:
✅ Buscar en TODA la experiencia:
- Palabras: premio, award, ganador, finalista, reconocimiento
- Concursos, competencias
- Menciones especiales
- Logros destacados

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO con esta estructura exacta:
{{
  "informacion_personal": {{
    "nombre_completo": "string or null",
    "email": "string or null",
    "telefono": "string or null",
    "direccion": "string or null",
    "linkedin": "string or null",
    "github": "string or null",
    "portfolio": null,
    "fecha_nacimiento": null,
    "nacionalidad": "string or null"
  }},
  "resumen_profesional": "string or null",
  "experiencia_laboral": [
    {{
      "cargo": "string or null",
      "empresa": "string or null",
      "fecha_inicio": "string or null",
      "fecha_fin": "string or null",
      "ubicacion": "string or null",
      "descripcion": "string or null",
      "logros": ["array of strings"]
    }}
  ],
  "educacion": [
    {{
      "titulo": "string or null",
      "institucion": "string or null",
      "fecha_inicio": "string or null",
      "fecha_fin": "string or null",
      "ubicacion": "string or null",
      "promedio": "string or null",
      "logros": ["array of strings"]
    }}
  ],
  "habilidades": {{
    "tecnicas": ["array of strings"],
    "blandas": ["array of strings"],
    "idiomas": [{{"idioma": "string", "nivel": "string"}}]
  }},
  "certificaciones": [
    {{
      "nombre": "string or null",
      "emisor": "string or null",
      "fecha": "string or null",
      "id_credencial": null,
      "url": null
    }}
  ],
  "proyectos": [],
  "publicaciones": [],
  "premios_reconocimientos": ["array of strings"],
  "referencias": [],
  "metadata": {{
    "fecha_procesamiento": "2025-06-08T17:53:40.000Z",
    "confianza_extraccion": 0.95,
    "formato_original": "pdf"
  }}
}}`,
      ],
      [
        "human",
        `Extrae información de este CV PRESERVANDO TODA la información del candidato:

{cv_content}

RECORDATORIOS CRÍTICOS:
1. 🛡️ NO eliminar NINGUNA información del usuario
2. 📝 PRESERVAR descripción/logros EXACTOS y COMPLETOS
3. 🧠 EXTRAER habilidades implícitas de experiencia
4. 🎯 OBJETIVO: Hacer que el candidato se vea MEJOR
5. 🌍 Funcionar para CUALQUIER idioma/formato

RESPONDE SOLO CON JSON VÁLIDO - NO agregues texto adicional.`,
      ],
    ]);
  }

  initializeModels() {
    try {
      if (
        process.env.AZURE_OPENAI_ENDPOINT &&
        process.env.AZURE_OPENAI_API_KEY &&
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME
      ) {
        this.azureLLM = new ChatOpenAI({
          azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
          azureOpenAIApiDeploymentName:
            process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
          azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
          azureOpenAIApiVersion: "2023-07-01-preview",
          temperature: 0.0,
          modelName: "gpt-4o",
        });
      }

      if (process.env.OPENAI_API_KEY) {
        this.openaiLLM = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: "gpt-4o", // o "gpt-4-turbo" según tu preferencia
          temperature: 0.0,
        });
      }

      if (this.azureLLM) {
        this.currentProvider = "azure";
      } else if (this.openaiLLM) {
        this.currentProvider = "openai";
      } else {
        throw new Error(
          "No se encontraron credenciales válidas para ningún proveedor de AI"
        );
      }
    } catch (error) {
      console.error("❌ Error inicializando modelos:", error);
      throw error;
    }
  }

  getCurrentLLM() {
    if (this.currentProvider === "azure" && this.azureLLM) {
      return this.azureLLM;
    } else if (this.currentProvider === "openai" && this.openaiLLM) {
      return this.openaiLLM;
    }
    throw new Error("No hay ningún modelo LLM disponible");
  }

  async switchProvider() {
    if (this.currentProvider === "azure" && this.openaiLLM) {
      this.currentProvider = "openai";
      return true;
    } else if (this.currentProvider === "openai" && this.azureLLM) {
      this.currentProvider = "azure";
      return true;
    }
    return false;
  }

  isQuotaError(error) {
    const errorMessage = error.message?.toLowerCase() || "";
    const errorResponse =
      error.response?.data?.error?.message?.toLowerCase() || "";

    const quotaPatterns = [
      "quota exceeded",
      "rate limit exceeded",
      "insufficient credits",
      "billing quota exceeded",
      "usage limit exceeded",
      "quota_exceeded",
      "rate_limit_exceeded",
      "insufficient_quota",
      "no credits",
      "out of credits",
      "429", // Too Many Requests
      "quotaexceeded",
      "billingquotaexceeded",
    ];

    return quotaPatterns.some(
      (pattern) =>
        errorMessage.includes(pattern) || errorResponse.includes(pattern)
    );
  }

  async makeAIRequest(input) {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const currentLLM = this.getCurrentLLM();
        const chain = RunnableSequence.from([
          this.prompt,
          currentLLM,
          new StringOutputParser(),
        ]);

        const result = await chain.invoke(input);
        return result;
      } catch (error) {
        console.error(`❌ Error con ${this.currentProvider}:`, error.message);

        if (this.isQuotaError(error)) {
          const switched = await this.switchProvider();
          if (switched) {
            attempts++;
            continue;
          } else {
            throw new Error("❌ Sin créditos en ambos proveedores de AI");
          }
        } else {
          if (attempts === 0) {
            const switched = await this.switchProvider();
            if (switched) {
              attempts++;
              continue;
            }
          }
          throw error;
        }
      }
    }

    throw new Error("❌ Falló con ambos proveedores de AI");
  }

  async extractTextFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      if (data.text && data.text.trim().length > 100) {
        return data.text;
      }
      // Si el texto es muy corto, intentar OCR
      return await this.ocrFallback(buffer);
    } catch (error) {
      console.error("Error extrayendo PDF:", error);
      return await this.ocrFallback(buffer);
    }
  }

  async extractTextFromDocx(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error("Error extrayendo DOCX:", error);
      return "";
    }
  }

  async ocrFallback(buffer) {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(buffer, "spa+eng+chi_sim+deu", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progreso: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      return text;
    } catch (error) {
      console.error("❌ Error en OCR:", error);
      return "";
    }
  }

  preprocessText(text) {
    return text.replace(/\n\s*\n/g, "\n").trim();
  }

  intelligentSkillExtraction(cvData) {
    try {
      // Extraer habilidades implícitas sin quitar información existente
      const fullText = [
        cvData.resumen_profesional || "",
        ...(cvData.experiencia_laboral || []).map(
          (exp) => `${exp.descripcion || ""} ${(exp.logros || []).join(" ")}`
        ),
        ...(cvData.educacion || []).map((edu) => (edu.logros || []).join(" ")),
      ]
        .join(" ")
        .toLowerCase();

      // Patrones de habilidades técnicas mejorados
      const techPatterns = {
        "python|javascript|typescript|java|c\\+\\+|c#|php|go|rust|swift|kotlin|scala":
          "programming",
        "react|angular|vue|node\\.?js|express|django|flask|fastapi|spring|laravel":
          "frameworks",
        "mysql|postgresql|mongodb|redis|neo4j|sql|oracle|dynamodb": "databases",
        "aws|azure|gcp|google cloud|docker|kubernetes|jenkins|git|github":
          "cloud",
        "power bi|tableau|excel|photoshop|illustrator|figma|autocad|solidworks":
          "tools",
        "arduino|raspberry pi|plc|scada|matlab|r|sas|stata": "specialized",
      };

      const newTechnicalSkills = new Set(cvData.habilidades?.tecnicas || []);

      for (const [pattern, category] of Object.entries(techPatterns)) {
        const regex = new RegExp(`\\b(${pattern})\\b`, "gi");
        const matches = fullText.match(regex) || [];
        matches.forEach((match) => {
          const cleanMatch = match.trim();
          if (cleanMatch.length > 1) {
            newTechnicalSkills.add(
              cleanMatch.charAt(0).toUpperCase() +
                cleanMatch.slice(1).toLowerCase()
            );
          }
        });
      }

      // Patrones de habilidades blandas
      const softSkillPatterns = {
        "lider|lidere|lideré|liderazgo|dirigir|manage|lead": "Liderazgo",
        "equipo|team|colabor|coopera": "Trabajo en equipo",
        "present|comunicar|comunicación|training|capacit": "Comunicación",
        "problem|problema|resolv|solución|troubleshoot":
          "Resolución de problemas",
        "innov|creativ|diseñ|design|concept": "Innovación y creatividad",
        "anali|analytic|investig|research|estudiar": "Pensamiento analítico",
        "client|customer|usuario|user|servicio|service":
          "Orientación al cliente",
        "deadline|tiempo|time|presión|pressure|urgente": "Gestión del tiempo",
      };

      const newSoftSkills = new Set(cvData.habilidades?.blandas || []);

      for (const [pattern, skill] of Object.entries(softSkillPatterns)) {
        const regex = new RegExp(`\\b(${pattern})`, "gi");
        if (regex.test(fullText)) {
          newSoftSkills.add(skill);
        }
      }

      // Actualizar habilidades manteniendo la estructura
      if (!cvData.habilidades) {
        cvData.habilidades = { tecnicas: [], blandas: [], idiomas: [] };
      }

      cvData.habilidades.tecnicas = Array.from(newTechnicalSkills).sort();
      cvData.habilidades.blandas = Array.from(newSoftSkills).sort();

      return cvData;
    } catch (error) {
      console.error("Error en extracción de habilidades:", error);
      return cvData;
    }
  }

  extractAwardsGlobally(cvData) {
    try {
      const awardPatterns = [
        /.*(?:premio|reconocimiento|galardón|ganador|ganadores|finalista|menciones?)/gi,
        /.*(?:award|prize|recognition|winner|finalist|achievement|distinction)/gi,
        /.*(?:first place|segundo lugar|third place|1st|2nd|3rd)/gi,
      ];

      const foundAwards = new Set(cvData.premios_reconocimientos || []);

      // Buscar en experiencia laboral
      (cvData.experiencia_laboral || []).forEach((exp) => {
        const textToSearch = `${exp.descripcion || ""} ${(
          exp.logros || []
        ).join(" ")}`;

        awardPatterns.forEach((pattern) => {
          const matches = textToSearch.match(pattern) || [];
          matches.forEach((match) => {
            const cleaned = match.trim();
            if (cleaned.length > 20) {
              foundAwards.add(cleaned);
            }
          });
        });
      });

      // Buscar en educación
      (cvData.educacion || []).forEach((edu) => {
        (edu.logros || []).forEach((logro) => {
          awardPatterns.forEach((pattern) => {
            const matches = logro.match(pattern) || [];
            matches.forEach((match) => {
              const cleaned = match.trim();
              if (cleaned.length > 20) {
                foundAwards.add(cleaned);
              }
            });
          });
        });
      });

      cvData.premios_reconocimientos = Array.from(foundAwards).sort();
      return cvData;
    } catch (error) {
      console.error("Error en extracción de premios:", error);
      return cvData;
    }
  }

  inferNationalityGlobally(cvData) {
    try {
      if (cvData.informacion_personal?.nacionalidad) {
        return cvData;
      }

      if (!cvData.informacion_personal) {
        cvData.informacion_personal = {};
      }

      const phone = cvData.informacion_personal.telefono || "";
      const address = cvData.informacion_personal.direccion || "";

      const countryCodes = {
        "+1": "Estados Unidos/Canadá",
        "+52": "México",
        "+34": "España",
        "+49": "Alemania",
        "+33": "Francia",
        "+44": "Reino Unido",
        "+86": "China",
        "+81": "Japón",
        "+82": "Corea del Sur",
        "+55": "Brasil",
        "+54": "Argentina",
      };

      // Buscar por código telefónico
      for (const [code, country] of Object.entries(countryCodes)) {
        if (phone.includes(code)) {
          cvData.informacion_personal.nacionalidad = country;
          return cvData;
        }
      }

      // Buscar por ubicación
      const locationPatterns = {
        "monterrey|guadalajara|cdmx|mexico city|puebla|tijuana|méxico":
          "México",
        "madrid|barcelona|valencia|sevilla|españa|spain": "España",
        "berlin|munich|hamburg|cologne|deutschland|germany": "Alemania",
        "beijing|shanghai|guangzhou|shenzhen|china": "China",
        "new york|los angeles|chicago|houston|miami|usa|united states":
          "Estados Unidos",
      };

      const addressLower = address.toLowerCase();
      for (const [pattern, country] of Object.entries(locationPatterns)) {
        if (new RegExp(pattern).test(addressLower)) {
          cvData.informacion_personal.nacionalidad = country;
          break;
        }
      }

      return cvData;
    } catch (error) {
      console.error("Error en inferencia de nacionalidad:", error);
      return cvData;
    }
  }

  async processCV(fileBuffer, fileType) {
    try {
      let rawText = "";

      if (fileType === "pdf") {
        rawText = await this.extractTextFromPDF(fileBuffer);
      } else if (fileType === "docx") {
        rawText = await this.extractTextFromDocx(fileBuffer);
      } else {
        throw new Error(`Tipo de archivo no soportado: ${fileType}`);
      }

      const processedText = this.preprocessText(rawText);

      if (!processedText.trim()) {
        throw new Error("No se pudo extraer texto del documento");
      }

      const maxText = processedText.substring(0, 25000);

      const result = await this.makeAIRequest({
        cv_content: maxText,
      });

      let cleanedResult = result.trim();

      if (cleanedResult.startsWith("```json")) {
        cleanedResult = cleanedResult
          .replace(/```json\n?/, "")
          .replace(/\n?```$/, "");
      } else if (cleanedResult.startsWith("```")) {
        cleanedResult = cleanedResult
          .replace(/```\n?/, "")
          .replace(/\n?```$/, "");
      }

      let cvData;
      try {
        cvData = JSON.parse(cleanedResult);
      } catch (parseError) {
        console.error("❌ Error parseando JSON:", parseError);

        const jsonMatch = cleanedResult.match(/\{.*\}/s);
        if (jsonMatch) {
          try {
            cvData = JSON.parse(jsonMatch[0]);
          } catch (e) {
            throw new Error("No se pudo extraer JSON válido de la respuesta");
          }
        } else {
          throw new Error("No se encontró JSON en la respuesta del LLM");
        }
      }

      cvData = this.intelligentSkillExtraction(cvData);
      cvData = this.extractAwardsGlobally(cvData);
      cvData = this.inferNationalityGlobally(cvData);

      if (!cvData.metadata) {
        cvData.metadata = {};
      }

      cvData.metadata.fecha_procesamiento = new Date().toISOString();
      cvData.metadata.confianza_extraccion = this.calculateConfidence(cvData);
      cvData.metadata.formato_original = fileType;
      cvData.metadata.proveedor_ai = this.currentProvider;

      return cvData;
    } catch (error) {
      console.error("❌ Error en processCV:", error);
      throw error;
    }
  }

  calculateConfidence(cvData) {
    try {
      let totalScore = 0;
      const maxScore = 10;

      if (cvData.informacion_personal?.nombre_completo) totalScore += 1;
      if (cvData.informacion_personal?.email) totalScore += 1;
      if (cvData.experiencia_laboral?.length > 0) totalScore += 1;
      if (cvData.educacion?.length > 0) totalScore += 1;

      if (cvData.habilidades?.tecnicas?.length > 0) totalScore += 1;
      if (cvData.habilidades?.blandas?.length > 0) totalScore += 1;
      if (cvData.premios_reconocimientos?.length > 0) totalScore += 1;
      if (cvData.informacion_personal?.nacionalidad) totalScore += 1;
      if (cvData.resumen_profesional) totalScore += 1;
      if (cvData.experiencia_laboral?.some((exp) => exp.logros?.length > 0))
        totalScore += 1;

      return Math.round((totalScore / maxScore) * 100) / 100;
    } catch (error) {
      console.error("Error calculando confianza:", error);
      return 0.5;
    }
  }
}

module.exports = CVProcessor;
