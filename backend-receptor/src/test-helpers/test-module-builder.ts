import {
  Test,
  type TestingModule,
  type TestingModuleBuilder,
} from '@nestjs/testing';

type ModuleMetadata = Parameters<typeof Test.createTestingModule>[0];

export class TestModuleBuilder {
  private builder: TestingModuleBuilder;

  constructor(moduleMetadata: ModuleMetadata) {
    this.builder = Test.createTestingModule(moduleMetadata);
  }

  overrideProvider(
    provider: string | symbol | (new (...args: unknown[]) => unknown),
    value: unknown
  ): this {
    this.builder = this.builder.overrideProvider(provider).useValue(value);
    return this;
  }

  overrideGuard(
    guard: string | symbol | (new (...args: unknown[]) => unknown)
  ): this {
    this.builder = this.builder.overrideGuard(guard).useValue({
      canActivate: jest.fn(() => true),
    });
    return this;
  }

  build(): Promise<TestingModule> {
    return this.builder.compile();
  }
}
