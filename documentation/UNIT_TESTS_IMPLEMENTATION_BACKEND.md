# Documentación de Implementación de Unit Tests - Backend Receptor

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Configuración Inicial](#configuración-inicial)
4. [Estructura de Tests](#estructura-de-tests)
5. [Patrones y Mejores Prácticas](#patrones-y-mejores-prácticas)
6. [Guía de Implementación por Fases](#guía-de-implementación-por-fases)
7. [Ejemplos de Código](#ejemplos-de-código)
8. [Comandos y Scripts](#comandos-y-scripts)
9. [Troubleshooting](#troubleshooting)

## Introducción

Este documento describe la implementación completa de unit tests para la aplicación backend-receptor usando Jest y NestJS Testing. El objetivo es alcanzar una cobertura de código del 80%+ siguiendo las mejores prácticas de clean code y testing moderno.

## Stack Tecnológico

### Dependencias Principales

- **Jest** (`^30.0.0`): Framework de testing
- **@nestjs/testing** (`^11.0.1`): Utilidades de testing para NestJS
- **ts-jest** (`^29.2.5`): Transpilador TypeScript para Jest
- **jest-progress-bar-reporter**: Reporter con barra de progreso visual

### Instalación

```bash
cd backend-receptor
pnpm add -D jest-progress-bar-reporter
```

## Configuración Inicial

### Jest Configuration (`jest.config.js`)

Crear archivo `backend-receptor/jest.config.js`:

```javascript
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/*.spec.ts",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/coverage/**",
    "!**/migrations/**",
    "!**/main.ts",
    "!**/*.module.ts",
    "!**/*.entity.ts",
  ],
  coverageDirectory: "../coverage",
  coverageReporters: ["text", "lcov", "html"],
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  reporters: [
    "default",
    [
      "jest-progress-bar-reporter",
      {
        barChar: "█",
        successChar: "█",
        failureChar: "█",
        pendingChar: "█",
      },
    ],
  ],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/$1",
  },
};
```

### Estructura de Helpers

Crear carpeta `backend-receptor/src/test-helpers/` con los siguientes archivos:

#### `test-helpers/index.ts`

```typescript
export * from "./entity-factories";
export * from "./mock-factories";
export * from "./test-module-builder";
```

#### `test-helpers/entity-factories.ts`

```typescript
import { Area } from "../areas/domain/entities/area.entity";
import { Department } from "../departments/domain/entities/department.entity";

export const createMockArea = (overrides?: Partial<Area>): Area => {
  const area = new Area();
  area.id = overrides?.id ?? 1;
  area.name = overrides?.name ?? "Test Area";
  area.createdAt = overrides?.createdAt ?? new Date();
  area.updatedAt = overrides?.updatedAt ?? new Date();
  area.deletedAt = overrides?.deletedAt ?? null;
  return Object.assign(area, overrides);
};

export const createMockDepartment = (
  overrides?: Partial<Department>
): Department => {
  const department = new Department();
  department.id = overrides?.id ?? 1;
  department.name = overrides?.name ?? "Test Department";
  department.htmlColor = overrides?.htmlColor ?? "#000000";
  department.createdAt = overrides?.createdAt ?? new Date();
  department.updatedAt = overrides?.updatedAt ?? new Date();
  department.deletedAt = overrides?.deletedAt ?? null;
  return Object.assign(department, overrides);
};
```

#### `test-helpers/mock-factories.ts`

```typescript
import { Repository } from "typeorm";

export const createMockRepository = <T>(): jest.Mocked<Repository<T>> => {
  return {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
};

export const createMockRepositoryWithMethods = <T>(
  methods: Partial<Repository<T>>
): jest.Mocked<Repository<T>> => {
  return {
    ...createMockRepository<T>(),
    ...methods,
  } as jest.Mocked<Repository<T>>;
};
```

#### `test-helpers/test-module-builder.ts`

```typescript
import { TestingModule, TestingModuleBuilder } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

export class TestModuleBuilder {
  private builder: TestingModuleBuilder;

  constructor() {
    this.builder = TestingModule.createTestingModule({});
  }

  withTypeOrmEntities(...entities: any[]): this {
    this.builder = this.builder.overrideModule(
      TypeOrmModule.forFeature(entities)
    );
    return this;
  }

  withMockRepository<T>(
    entity: any,
    mockRepository: Partial<Repository<T>>
  ): this {
    this.builder = this.builder
      .overrideProvider(getRepositoryToken(entity))
      .useValue(mockRepository);
    return this;
  }

  withProviders(...providers: any[]): this {
    this.builder = this.builder.overrideProvider(providers);
    return this;
  }

  build(): Promise<TestingModule> {
    return this.builder.compile();
  }
}
```

## Estructura de Tests

### Convención de Nombres

- Archivos de test: `*.spec.ts` (junto al archivo fuente)
- Describe blocks: Nombre de la clase/módulo
- Test cases: `should [expected behavior] when [condition]`

### Estructura de Carpetas

```
module/
├── application/
│   └── services/
│       └── service-name.service.spec.ts
├── controllers/
│   └── controller-name.controller.spec.ts
└── domain/
    └── repositories/
        └── repository-name.repository.spec.ts (opcional)
```

## Patrones y Mejores Prácticas

### Patrón AAA (Arrange-Act-Assert)

```typescript
describe("ServiceName", () => {
  describe("methodName", () => {
    it("should return expected result when valid input is provided", async () => {
      // Arrange
      const mockData = createMockData();
      const expectedResult = { id: 1, name: "Test" };
      jest.spyOn(repository, "method").mockResolvedValue(expectedResult);

      // Act
      const result = await service.method(mockData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(repository.method).toHaveBeenCalledWith(mockData);
    });
  });
});
```

### Mocking de Dependencias

```typescript
describe("AreaService", () => {
  let service: AreaService;
  let repository: jest.Mocked<AreaRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaService,
        {
          provide: AreaRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AreaService>(AreaService);
    repository = module.get(AreaRepository);
  });
});
```

### Testing de Excepciones

```typescript
it("should throw NotFoundException when area does not exist", async () => {
  const id = 999;
  repository.findById.mockResolvedValue(null);

  await expect(service.findById(id)).rejects.toThrow(NotFoundException);
  await expect(service.findById(id)).rejects.toThrow(
    `Area with ID ${id} not found`
  );
});
```

### Testing de Controllers

```typescript
describe("AreaController", () => {
  let controller: AreaController;
  let service: jest.Mocked<AreaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaController],
      providers: [
        {
          provide: AreaService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            getCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AreaController>(AreaController);
    service = module.get(AreaService);
  });

  describe("create", () => {
    it("should create area and return success response", async () => {
      const createDto = { name: "New Area" };
      const mockArea = createMockArea({ name: "New Area" });
      service.create.mockResolvedValue(mockArea);

      const result = await controller.create(createDto);

      expect(result.message).toBe("Area created successfully");
      expect(result.data.name).toBe("New Area");
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
});
```

## Guía de Implementación por Fases

### Fase 1: Configuración y Setup

#### 1.1 Instalar Dependencias

```bash
cd backend-receptor
pnpm add -D jest-progress-bar-reporter
```

#### 1.2 Crear Archivos de Configuración

- [ ] Crear `jest.config.js` en raíz de `backend-receptor`
- [ ] Crear carpeta `src/test-helpers/`
- [ ] Crear `test-helpers/index.ts`
- [ ] Crear `test-helpers/entity-factories.ts`
- [ ] Crear `test-helpers/mock-factories.ts`
- [ ] Crear `test-helpers/test-module-builder.ts`

#### 1.3 Actualizar package.json

Agregar scripts adicionales:

```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern=spec.ts$",
    "test:unit:watch": "jest --testPathPattern=spec.ts$ --watch",
    "test:unit:cov": "jest --testPathPattern=spec.ts$ --coverage"
  }
}
```

### Fase 2: Módulos Simples

#### 2.1 Areas Module

**Archivos a crear:**

- `src/areas/application/services/area.service.spec.ts`
- `src/areas/controllers/area.controller.spec.ts`

**Cobertura objetivo:** 90%+

**Tests a implementar:**

**AreaService:**

- ✅ `create` - éxito cuando datos válidos
- ✅ `create` - lanza ConflictException cuando nombre existe
- ✅ `findAll` - retorna lista paginada
- ✅ `findAll` - aplica filtros correctamente
- ✅ `findById` - retorna área cuando existe
- ✅ `findById` - lanza NotFoundException cuando no existe
- ✅ `update` - actualiza correctamente
- ✅ `update` - lanza ConflictException cuando nombre duplicado
- ✅ `update` - lanza NotFoundException cuando área no existe
- ✅ `remove` - elimina correctamente (soft delete)
- ✅ `remove` - lanza NotFoundException cuando no existe
- ✅ `restore` - restaura correctamente
- ✅ `restore` - lanza NotFoundException cuando no existe o no está eliminado
- ✅ `getCount` - retorna conteo correcto

**AreaController:**

- ✅ `POST /areas` - crea área exitosamente
- ✅ `GET /areas` - lista áreas con paginación
- ✅ `GET /areas` - aplica filtros de query
- ✅ `GET /areas/count` - retorna conteo
- ✅ `GET /areas/:id` - retorna área por ID
- ✅ `PATCH /areas/:id` - actualiza área
- ✅ `DELETE /areas/:id` - elimina área
- ✅ `PATCH /areas/:id/restore` - restaura área

#### 2.2 Departments Module

Misma estructura que Areas Module.

#### 2.3 Torreta Colors Module

Misma estructura que Areas Module.

#### 2.4 Receptors Module

Misma estructura que Areas Module.

#### 2.5 Torretas Module

Misma estructura que Areas Module.

### Fase 3: Módulos de Complejidad Media

Implementar tests siguiendo el mismo patrón pero considerando:

- Relaciones entre entidades
- Lógica de negocio más compleja
- Validaciones adicionales

### Fase 4: Módulos Complejos

Implementar tests considerando:

- Mocking de servicios externos (HTTP, WebSocket)
- Testing de guards y decorators
- Testing de cron jobs (mockear ejecución)
- Testing de estrategias de autenticación

## Ejemplos de Código

### Ejemplo Completo: AreaService.spec.ts

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { AreaService } from "./area.service";
import { AreaRepository } from "../../domain/repositories/area.repository";
import { createMockArea } from "../../../test-helpers";

describe("AreaService", () => {
  let service: AreaService;
  let repository: jest.Mocked<AreaRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaService,
        {
          provide: AreaRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AreaService>(AreaService);
    repository = module.get(AreaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create area successfully when valid data is provided", async () => {
      const createDto = { name: "New Area" };
      const mockArea = createMockArea({ name: "New Area" });

      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockArea);

      const result = await service.create(createDto);

      expect(result).toEqual(mockArea);
      expect(repository.findByName).toHaveBeenCalledWith("New Area");
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it("should throw ConflictException when area name already exists", async () => {
      const createDto = { name: "Existing Area" };
      const existingArea = createMockArea({ name: "Existing Area" });

      repository.findByName.mockResolvedValue(existingArea);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Area with name 'Existing Area' already exists"
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return area when found", async () => {
      const id = 1;
      const mockArea = createMockArea({ id });

      repository.findById.mockResolvedValue(mockArea);

      const result = await service.findById(id);

      expect(result).toEqual(mockArea);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it("should throw NotFoundException when area not found", async () => {
      const id = 999;

      repository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Area with ID ${id} not found`
      );
    });
  });

  // Más tests...
});
```

### Ejemplo Completo: AreaController.spec.ts

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { AreaController } from "./area.controller";
import { AreaService } from "../application/services/area.service";
import { createMockArea } from "../../test-helpers";
import { CreateAreaDto, UpdateAreaDto } from "../application/dtos/area.dto";

describe("AreaController", () => {
  let controller: AreaController;
  let service: jest.Mocked<AreaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaController],
      providers: [
        {
          provide: AreaService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            getCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AreaController>(AreaController);
    service = module.get(AreaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create area and return success response", async () => {
      const createDto: CreateAreaDto = { name: "New Area" };
      const mockArea = createMockArea({ name: "New Area" });

      service.create.mockResolvedValue(mockArea);

      const result = await controller.create(createDto);

      expect(result.message).toBe("Area created successfully");
      expect(result.data.name).toBe("New Area");
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("findAll", () => {
    it("should return paginated areas", async () => {
      const mockAreas = [
        createMockArea({ id: 1, name: "Area 1" }),
        createMockArea({ id: 2, name: "Area 2" }),
      ];

      service.findAll.mockResolvedValue({
        data: mockAreas,
        total: 2,
      });

      const result = await controller.findAll(10, 0, undefined, false);

      expect(result.message).toBe("Areas retrieved successfully");
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
    });
  });

  // Más tests...
});
```

## Comandos y Scripts

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Solo unit tests
pnpm test:unit

# Watch mode
pnpm test:watch

# Con cobertura
pnpm test:cov

# Unit tests con cobertura
pnpm test:unit:cov

# Debug mode
pnpm test:debug
```

### Ver Cobertura

```bash
pnpm test:cov
# Abrir coverage/index.html en navegador
```

## Troubleshooting

### Problemas Comunes

1. **Error: Cannot find module**

   - Verificar que `jest.config.js` tenga `moduleNameMapper` correcto
   - Verificar paths en `tsconfig.json`

2. **Tests lentos**

   - Usar `jest --maxWorkers=2` para limitar workers
   - Verificar que no se esté usando base de datos real

3. **Mocks no funcionan**

   - Verificar que `clearMocks: true` y `restoreMocks: true` estén en config
   - Usar `jest.clearAllMocks()` en `afterEach`

4. **Coverage bajo**
   - Verificar que `collectCoverageFrom` incluya los archivos correctos
   - Excluir archivos que no necesitan testing (entities, migrations)

## Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
