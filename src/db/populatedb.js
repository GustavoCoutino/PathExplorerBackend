const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const SQL = `
-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS personas;

-- Drop tables if they exist (in correct order)
DROP TABLE IF EXISTS personas.perfil;
DROP TABLE IF EXISTS personas.administrador;
DROP TABLE IF EXISTS personas.manager;
DROP TABLE IF EXISTS personas.empleado;
DROP TABLE IF EXISTS personas.persona;

-- Create enum type for employee status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_empleado') THEN
        CREATE TYPE estado_empleado AS ENUM ('ACTIVO', 'INACTIVO', 'BANCA');
    END IF;
END $$;

-- Create tables using your existing SQL definitions
CREATE TABLE personas.persona (
    id_persona SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fecha_contratacion DATE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add password field for authentication
    password VARCHAR(255) NOT NULL
);

CREATE TABLE personas.empleado (
    id_empleado SERIAL PRIMARY KEY,
    id_persona INTEGER NOT NULL REFERENCES personas.persona(id_persona) ON DELETE CASCADE,
    estado estado_empleado DEFAULT 'BANCA',
    porcentaje_disponibilidad NUMERIC(5,2) DEFAULT 100.00 CHECK (porcentaje_disponibilidad BETWEEN 0 AND 100),
    CONSTRAINT unique_persona_empleado UNIQUE (id_persona)
);

CREATE TABLE personas.manager (
    id_manager SERIAL PRIMARY KEY,
    id_persona INTEGER NOT NULL REFERENCES personas.persona(id_persona) ON DELETE CASCADE,
    area_responsabilidad VARCHAR(100) NOT NULL,
    nivel_autorizacion INTEGER NOT NULL CHECK (nivel_autorizacion BETWEEN 1 AND 5),
    CONSTRAINT unique_persona_manager UNIQUE (id_persona)
);

CREATE TABLE personas.administrador (
    id_administrador SERIAL PRIMARY KEY,
    id_persona INTEGER NOT NULL REFERENCES personas.persona(id_persona) ON DELETE CASCADE,
    nivel_acceso INTEGER NOT NULL CHECK (nivel_acceso BETWEEN 1 AND 5),
    departamento VARCHAR(100) NOT NULL,
    CONSTRAINT unique_persona_administrador UNIQUE (id_persona)
);

CREATE TABLE personas.perfil (
    id_perfil SERIAL PRIMARY KEY,
    id_persona INTEGER NOT NULL REFERENCES personas.persona(id_persona) ON DELETE CASCADE,
    puesto_actual VARCHAR(100) NOT NULL,
    antiguedad INTEGER DEFAULT 0,
    historial_profesional TEXT,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_persona_perfil UNIQUE (id_persona)
);

-- Insert seed data for login and user access testing

-- Insert personas
INSERT INTO personas.persona (nombre, apellido, email, fecha_contratacion, password)
VALUES
    ('Admin', 'Principal', 'admin@example.com', '2020-01-01', '$2b$10$PMVZhm3Sq/g9zPWxH5MMB.kxzBOZmYjyDVWtYNUhNylaLlNoh3KDK'),
    ('Manager', 'Uno', 'manager@example.com', '2021-03-15', '$2b$10$PMVZhm3Sq/g9zPWxH5MMB.kxzBOZmYjyDVWtYNUhNylaLlNoh3KDK'),
    ('Empleado', 'Uno', 'emp1@example.com', '2022-05-20', '$2b$10$PMVZhm3Sq/g9zPWxH5MMB.kxzBOZmYjyDVWtYNUhNylaLlNoh3KDK'),
    ('Empleado', 'Dos', 'emp2@example.com', '2023-01-10', '$2b$10$PMVZhm3Sq/g9zPWxH5MMB.kxzBOZmYjyDVWtYNUhNylaLlNoh3KDK');

-- Create an administrator
INSERT INTO personas.administrador (id_persona, nivel_acceso, departamento)
VALUES
    (1, 5, 'Administración');

-- Create a manager
INSERT INTO personas.manager (id_persona, area_responsabilidad, nivel_autorizacion)
VALUES
    (2, 'Desarrollo de Proyectos', 4);

-- Create employees
INSERT INTO personas.empleado (id_persona, estado, porcentaje_disponibilidad)
VALUES
    (3, 'ACTIVO', 100.00),
    (4, 'ACTIVO', 90.00);

-- Create profiles for all users
INSERT INTO personas.perfil (id_persona, puesto_actual, antiguedad, historial_profesional)
VALUES
    (1, 'Administrador de Sistemas', 5, 'Experiencia en administración de sistemas y gestión de equipos'),
    (2, 'Project Manager', 3, 'Gestión de proyectos de desarrollo de software'),
    (3, 'Desarrollador Full Stack', 2, 'Desarrollo de aplicaciones web y móviles'),
    (4, 'Desarrollador Frontend', 1, 'Desarrollo de interfaces de usuario y experiencia de usuario');
`;

async function main() {
  console.log("Initializing database schema and seeding data...");

  try {
    const client = new Client({
      connectionString: process.env.DB_CONNECTION,
    });

    await client.connect();
    console.log("Connected to database successfully");

    await client.query(SQL);
    console.log("Schema created and data seeded successfully");

    await client.end();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

main();
