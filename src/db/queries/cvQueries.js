const db = require("../pool");

class CVQueries {
    static async saveCVDataBatch(id_persona, cvData) {
        return await db.withTransaction(async (client) => {
            const results = {
                profile: null,
                certifications: [],
                skills: [],
            };

            try {
                // SOLO ACTUALIZAR HISTORIAL PROFESIONAL (como texto plano)
                if (cvData.resumen_profesional || cvData.experiencia_laboral) {
                    let historialTextoPlano = '';

                    // Agregar resumen profesional
                    if (cvData.resumen_profesional) {
                        historialTextoPlano += `RESUMEN PROFESIONAL:\n${cvData.resumen_profesional}\n\n`;
                    }

                    // Agregar experiencia laboral
                    if (cvData.experiencia_laboral && cvData.experiencia_laboral.length > 0) {
                        historialTextoPlano += `EXPERIENCIA LABORAL:\n\n`;

                        cvData.experiencia_laboral.forEach((exp, index) => {
                            historialTextoPlano += `${index + 1}. ${exp.cargo || 'Cargo no especificado'}\n`;
                            if (exp.empresa) historialTextoPlano += `   Empresa: ${exp.empresa}\n`;
                            if (exp.fecha_inicio || exp.fecha_fin) {
                                historialTextoPlano += `   Período: ${exp.fecha_inicio || 'N/A'} - ${exp.fecha_fin || 'Actualidad'}\n`;
                            }
                            if (exp.ubicacion) historialTextoPlano += `   Ubicación: ${exp.ubicacion}\n`;
                            if (exp.descripcion) historialTextoPlano += `   Descripción: ${exp.descripcion}\n`;

                            if (exp.logros && exp.logros.length > 0) {
                                historialTextoPlano += `   Logros:\n`;
                                exp.logros.forEach(logro => {
                                    historialTextoPlano += `   • ${logro}\n`;
                                });
                            }
                            historialTextoPlano += '\n';
                        });
                    }

                    // SOLO actualizar historial_profesional, nada más
                    const profileResult = await client.query(
                        `
                            UPDATE personas.perfil
                            SET
                                historial_profesional = $2,
                                fecha_actualizacion = CURRENT_TIMESTAMP
                            WHERE id_persona = $1
                                RETURNING *
                        `,
                        [id_persona, historialTextoPlano.trim()]
                    );

                    results.profile = profileResult.rows[0];
                }

                // 2. CERTIFICACIONES
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

                // 3. HABILIDADES
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