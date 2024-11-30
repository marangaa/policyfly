
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class DocumentNotFoundError extends AppError {
  constructor(id: string) {
    super(`Document with id ${id} not found`, 404);
  }
}