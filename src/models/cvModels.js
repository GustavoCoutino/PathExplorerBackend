class ContactInfo {
    constructor(data = {}) {
        this.nombre_completo = data.nombre_completo || null;
        this.email = data.email || null;
        this.telefono = data.telefono || null;
        this.direccion = data.direccion || null;
        this.linkedin = data.linkedin || null;
        this.github = data.github || null;
        this.portfolio = data.portfolio || null;
        this.fecha_nacimiento = data.fecha_nacimiento || null;
        this.nacionalidad = data.nacionalidad || null;
    }
}

class CVStructure {
    constructor(data = {}) {
        this.informacion_personal = new ContactInfo(data.informacion_personal);
        this.resumen_profesional = data.resumen_profesional || null;
        this.experiencia_laboral = data.experiencia_laboral || [];
        this.educacion = data.educacion || [];
        this.habilidades = data.habilidades || { tecnicas: [], blandas: [], idiomas: [] };
        this.certificaciones = data.certificaciones || [];
        this.proyectos = data.proyectos || [];
        this.metadata = data.metadata || {};
    }
}