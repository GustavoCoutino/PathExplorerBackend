const db = require("../pool");

class CVQueries {
  static async saveCVDataBatch(id_persona, cvData) {
    return await db.withTransaction(async (client) => {
      const results = {
        profile: null,
        personal_info: null,
        certifications: [],
        courses: [],
        skills: [],
      };

      try {
        if (cvData.informacion_personal) {
          const personalData = cvData.informacion_personal;
          const nombres = personalData.nombre_completo
            ? personalData.nombre_completo.split(" ")
            : [];
          const nombre = nombres[0] || "";
          const apellido = nombres.slice(1).join(" ") || "";

          const personalResult = await client.query(
            `
            UPDATE personas.persona 
            SET 
              nombre = COALESCE($2, nombre),
              apellido = COALESCE($3, apellido),
              email = COALESCE($4, email),
              telefono = COALESCE($5, telefono),
              direccion = COALESCE($6, direccion),
              linkedin = COALESCE($7, linkedin),
              github = COALESCE($8, github),
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_persona = $1
            RETURNING *
          `,
            [
              id_persona,
              nombre,
              apellido,
              personalData.email,
              personalData.telefono,
              personalData.direccion,
              personalData.linkedin,
              personalData.github,
            ]
          );

          results.personal_info = personalResult.rows[0];
        }

        if (cvData.resumen_profesional || cvData.experiencia_laboral) {
          const profileData = {
            puesto_actual: cvData.experiencia_laboral?.[0]?.cargo || null,
            historial_profesional: JSON.stringify({
              resumen_profesional: cvData.resumen_profesional,
              experiencia_laboral: cvData.experiencia_laboral,
            }),
          };

          const profileResult = await client.query(
            `
            INSERT INTO personas.perfil (id_persona, puesto_actual, historial_profesional)
            VALUES ($1, $2, $3)
            ON CONFLICT (id_persona) 
            DO UPDATE SET 
              puesto_actual = COALESCE(EXCLUDED.puesto_actual, personas.perfil.puesto_actual),
              historial_profesional = COALESCE(EXCLUDED.historial_profesional, personas.perfil.historial_profesional),
              fecha_actualizacion = CURRENT_TIMESTAMP
            RETURNING *
          `,
            [
              id_persona,
              profileData.puesto_actual,
              profileData.historial_profesional,
            ]
          );

          results.profile = profileResult.rows[0];
        }

        if (cvData.certificaciones?.length > 0) {
          for (const cert of cvData.certificaciones) {
            try {
              let certResult = await client.query(
                `
                SELECT id_certificacion FROM desarrollo.certificacion 
                WHERE LOWER(nombre) = LOWER($1)
              `,
                [cert.nombre]
              );

              let id_certificacion;
              if (certResult.rows.length > 0) {
                id_certificacion = certResult.rows[0].id_certificacion;
              } else {
                const newCertResult = await client.query(
                  `
                  INSERT INTO desarrollo.certificacion (nombre, institucion)
                  VALUES ($1, $2)
                  RETURNING id_certificacion
                `,
                  [cert.nombre, cert.emisor || "N/A"]
                );
                id_certificacion = newCertResult.rows[0].id_certificacion;
              }

              const personCertResult = await client.query(
                `
                INSERT INTO desarrollo.persona_certificacion 
                (id_persona, id_certificacion, fecha_obtencion)
                VALUES ($1, $2, $3)
                ON CONFLICT (id_persona, id_certificacion, fecha_obtencion) DO NOTHING
                RETURNING *
              `,
                [id_persona, id_certificacion, new Date()]
              );

              if (personCertResult.rows[0]) {
                results.certifications.push(personCertResult.rows[0]);
              }
            } catch (e) {
              console.error(`Error cert ${cert.nombre}:`, e.message);
            }
          }
        }

        // 4. Habilidades
        const allSkills = [
          ...(cvData.habilidades?.tecnicas || []).map((s) => ({
            skill: s,
            categoria: "TECNICA",
          })),
          ...(cvData.habilidades?.blandas || []).map((s) => ({
            skill: s,
            categoria: "BLANDA",
          })),
        ];

        for (const { skill, categoria } of allSkills) {
          try {
            if (!skill || skill.trim() === "") continue;

            let skillResult = await client.query(
              `
              SELECT id_habilidad FROM recursos.habilidad 
              WHERE LOWER(nombre) = LOWER($1)
            `,
              [skill.trim()]
            );

            let id_habilidad;
            if (skillResult.rows.length > 0) {
              id_habilidad = skillResult.rows[0].id_habilidad;
            } else {
              const newSkillResult = await client.query(
                `
                INSERT INTO recursos.habilidad (nombre, categoria)
                VALUES ($1, $2)
                RETURNING id_habilidad
              `,
                [skill.trim(), categoria]
              );
              id_habilidad = newSkillResult.rows[0].id_habilidad;
            }

            const personSkillResult = await client.query(
              `
              INSERT INTO personas.persona_habilidad 
              (id_persona, id_habilidad, nivel_demostrado, fecha_adquisicion)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (id_persona, id_habilidad) DO NOTHING
              RETURNING *
            `,
              [id_persona, id_habilidad, 3, new Date()]
            );

            if (personSkillResult.rows[0]) {
              results.skills.push(personSkillResult.rows[0]);
            }
          } catch (e) {
            console.error(`Error skill ${skill}:`, e.message);
          }
        }

        return results;
      } catch (error) {
        console.error(`❌ Error transacción:`, error);
        throw error;
      }
    });
  }
}

module.exports = CVQueries;
