# Development Configuration

Este proyecto está configurado con las mejores prácticas actuales para desarrollo con NestJS, TypeScript, ESLint y Prettier.

## Configuración de Formateo

### Prettier

- **Indentación**: 2 espacios
- **Semicolons**: Siempre requeridos
- **Comillas**: Simples
- **Trailing commas**: ES5 compatible
- **Línea máxima**: 80 caracteres
- **End of line**: LF (Unix)

### ESLint

- Configuración moderna con TypeScript ESLint
- Reglas estrictas para TypeScript
- Integración con Prettier
- Reglas para mejor calidad de código

### TypeScript

- Configuración estricta habilitada
- Todas las verificaciones de tipo activadas
- Mejores prácticas de TypeScript

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Inicia en modo desarrollo
npm run start:debug        # Inicia en modo debug

# Formateo y Linting
npm run format              # Formatea el código con Prettier
npm run format:check       # Verifica formato sin modificar
npm run lint               # Ejecuta ESLint con auto-fix
npm run lint:check         # Verifica linting sin modificar
npm run lint:fix           # Ejecuta ESLint con auto-fix

# Testing
npm run test               # Ejecuta tests
npm run test:watch         # Ejecuta tests en modo watch
npm run test:cov           # Ejecuta tests con coverage
npm run test:e2e           # Ejecuta tests end-to-end

# Build
npm run build              # Compila el proyecto
npm run start:prod         # Inicia en modo producción

# Pre-commit
npm run pre-commit         # Ejecuta linting, formateo y tests
```

## Configuración de Git Hooks

El proyecto incluye configuración para Husky y lint-staged:

- **Pre-commit**: Ejecuta linting y formateo automático
- **Pre-push**: Ejecuta verificación completa (linting, formateo y tests)

## Configuración de VS Code

El proyecto incluye configuración recomendada para VS Code:

- Formateo automático al guardar
- Auto-fix de ESLint
- Organización automática de imports
- Configuración de indentación consistente

### Extensiones Recomendadas

Instala las siguientes extensiones para mejor experiencia de desarrollo:

- Prettier - Code formatter
- ESLint
- TypeScript Importer
- Auto Rename Tag
- Path Intellisense

## Estructura de Archivos

```
backend-receptor/
├── .vscode/                 # Configuración de VS Code
├── src/                     # Código fuente
├── test/                    # Tests
├── .prettierrc              # Configuración de Prettier
├── .prettierignore          # Archivos ignorados por Prettier
├── .huskyrc                 # Configuración de Husky
├── eslint.config.mjs        # Configuración de ESLint
├── tsconfig.json            # Configuración de TypeScript
└── package.json             # Dependencias y scripts
```

## Mejores Prácticas

1. **Siempre usar 2 espacios** para indentación
2. **Siempre usar punto y coma** al final de las declaraciones
3. **Usar comillas simples** para strings
4. **Seguir las reglas de ESLint** configuradas
5. **Formatear código** antes de hacer commit
6. **Escribir tests** para nueva funcionalidad
7. **Usar TypeScript estricto** para mejor calidad de código

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Configurar Husky (solo la primera vez)
npm run prepare

# Verificar todo el proyecto
npm run pre-commit

# Formatear todo el código
npm run format

# Verificar linting en todo el proyecto
npm run lint:check
```
