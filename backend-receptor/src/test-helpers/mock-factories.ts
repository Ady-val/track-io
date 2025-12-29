import type { Repository, ObjectLiteral } from 'typeorm';

export const createMockRepository = <T extends ObjectLiteral>(): jest.Mocked<
  Repository<T>
> => {
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

export const createMockRepositoryWithMethods = <T extends ObjectLiteral>(
  methods: Partial<Repository<T>>
): jest.Mocked<Repository<T>> => {
  return {
    ...createMockRepository<T>(),
    ...methods,
  } as jest.Mocked<Repository<T>>;
};
