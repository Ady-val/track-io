import {
  Test,
  type TestingModule,
  type TestingModuleBuilder,
} from '@nestjs/testing';

export class TestModuleBuilder {
  private builder: TestingModuleBuilder;

  constructor(moduleMetadata: any) {
    this.builder = Test.createTestingModule(moduleMetadata);
  }

  overrideProvider(provider: any, value: any): this {
    this.builder = this.builder.overrideProvider(provider).useValue(value);
    return this;
  }

  overrideGuard(guard: any): this {
    this.builder = this.builder.overrideGuard(guard).useValue({
      canActivate: jest.fn(() => true),
    });
    return this;
  }

  build(): Promise<TestingModule> {
    return this.builder.compile();
  }
}
