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
        `Eres un extractor de CV que se enfoca SOLO en extraer:
1. 📋 EXPERIENCIA LABORAL (completa y detallada)
2. 🧠 HABILIDADES (técnicas y blandas)  
3. 🏆 CERTIFICACIONES

🛡️ REGLA FUNDAMENTAL - NO EXTRAER DATOS PERSONALES:
❌ NO extraer nombre, apellido, email, teléfono
❌ NO extraer puesto actual 
✅ SOLO extraer historial laboral, habilidades y certificaciones

📋 EXPERIENCIA LABORAL - PRESERVACIÓN TOTAL:
✅ descripcion: TODA la información que escribió el usuario
- Si hay párrafo descriptivo: copiarlo EXACTO
- Si solo hay bullet points: ponerlos TODOS en descripción
- Si hay ambos: párrafo + todos los bullet points

✅ logros: TODOS los logros/bullets que escribió el usuario
- Mantener CADA bullet point exacto
- No eliminar ningún logro por "menor importancia"

🧠 EXTRACCIÓN INTELIGENTE DE HABILIDADES:
✅ TÉCNICAS: Extraer de TODA la experiencia, proyectos, educación
- Tecnologías mencionadas en descripción de trabajos
- Herramientas usadas en proyectos académicos
- Software mencionado en certificaciones

✅ BLANDAS: Extraer habilidades implícitas de experiencia
- "Lideré equipo" → Liderazgo
- "Colaboré con áreas" → Trabajo en equipo
- "Presenté resultados" → Comunicación

🏆 CERTIFICACIONES:
✅ Extraer todas las certificaciones mencionadas

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO con esta estructura exacta:
{{
  "informacion_personal": null,
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
  "educacion": [],
  "habilidades": {{
    "tecnicas": ["array of strings"],
    "blandas": ["array of strings"],
    "idiomas": []
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
  "premios_reconocimientos": [],
  "referencias": [],
  "metadata": {{
    "fecha_procesamiento": "2025-06-09T22:45:09.000Z",
    "confianza_extraccion": 0.95,
    "formato_original": "pdf"
  }}
}}`,
      ],
      [
        "human",
        `Extrae información de este CV enfocándote SOLO en historial laboral, habilidades y certificaciones:

{cv_content}

RECORDATORIOS CRÍTICOS:
1. 🛡️ NO extraer datos personales (nombre, apellido, email, puesto actual)
2. 📝 PRESERVAR descripción/logros EXACTOS y COMPLETOS
3. 🧠 EXTRAER habilidades implícitas de experiencia
4. 🏆 EXTRAER todas las certificaciones

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
          modelName: "gpt-4o",
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
      "429",
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
      const fullText = [
        cvData.resumen_profesional || "",
        ...(cvData.experiencia_laboral || []).map(
            (exp) => `${exp.descripcion || ""} ${(exp.logros || []).join(" ")}`
        ),
      ]
          .join(" ")
          .toLowerCase();

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
      const maxScore = 6;

      if (cvData.experiencia_laboral?.length > 0) totalScore += 2;
      if (cvData.habilidades?.tecnicas?.length > 0) totalScore += 1;
      if (cvData.habilidades?.blandas?.length > 0) totalScore += 1;
      if (cvData.certificaciones?.length > 0) totalScore += 1;
      if (cvData.resumen_profesional) totalScore += 1;

      return Math.round((totalScore / maxScore) * 100) / 100;
    } catch (error) {
      console.error("Error calculando confianza:", error);
      return 0.5;
    }
  }
}

module.exports = CVProcessor;