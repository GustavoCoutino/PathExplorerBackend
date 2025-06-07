# PathExplorer Backend

Una API RESTful desarrollada con Node.js y Express para la aplicación Path Explorer.

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: PostgreSQL
- **IA/ML**:
  - OpenAI GPT-3.5-turbo
  - LangChain
  - Análisis vectorial personalizado
- **Cache**: Node-Cache
- **Autenticación**: JWT (jsonwebtoken)
- **Testing**: Jest, Supertest

## Requisitos Previos

- Node.js >= 16.0.0
- PostgreSQL >= 8.0
- Cuenta de OpenAI con API Key

## Instalación

1. **Clona el repositorio**

   ```bash
   git clone https://github.com/GustavoCoutino/PathExplorerBackend.git
   cd PathExplorerBackend
   ```

2. **Instala las dependencias**

   ```bash
   npm install
   ```

3. **Configura las variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Edita el archivo `.env` con tus configuraciones:

   ```env
   # Base de Datos
   DB_HOST=
   DB_USER=
   DB_NAME=
   DB_PASSWORD=
   DB_CONNECTION=

   # JWT
   JWT_SECRET=
   SESSION_SECRET=

   # OpenAI
   OPENAI_API_KEY=

   # Base de datos de prueba
   DB_HOST_TEST=
   DB_USER_TEST=
   DB_NAME_TEST=
   DB_PASSWORD_TEST=
   ```

## Uso

```bash
node app.js
```

### Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch
```
