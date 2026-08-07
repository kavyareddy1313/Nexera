export class ApiResponse {
  constructor(statusCode, message, data = null, errors = []) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  static ok(data, message = 'Success') {
    return new ApiResponse(200, message, data);
  }

  static created(data, message = 'Created') {
    return new ApiResponse(201, message, data);
  }

  static noContent(message = 'No content') {
    return new ApiResponse(204, message);
  }
}
