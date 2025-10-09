export class Measurement {
  constructor(
    private readonly _id: string,
    private readonly _value: string,
    private readonly _createdAt: Date = new Date()
  ) {}

  get id(): string {
    return this._id;
  }

  get value(): string {
    return this._value;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
