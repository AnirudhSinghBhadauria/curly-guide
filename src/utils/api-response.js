class apiResponse {
  constructor(statusCode, data, message = "Response send succesfully") {
    this.statusCode = statusCode;
    this.meesage = message;
    this.data = data;
    this.success = true;
  }
}

export { apiResponse };
