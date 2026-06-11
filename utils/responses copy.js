const Responses = {
  success: {
    success: true,
    statusCode: 200,
    message: "success",
    clientMessage: { Message: "Success" },
  },
  created: {
    success: true,
    statusCode: 201,
    message: "created",
    clientMessage: { Message: "Created" },
  },
  emailExists: {
    success: false,
    statusCode: 400,
    message: "bad request",
    clientMessage: { Message: "Email already exists" },
  },
  alreadyExist: {
    success: false,
    statusCode: 400,
    message: "bad request",
    clientMessage: { Message: "Already exists" },
  },
  badRequest: {
    success: false,
    statusCode: 400,
    message: "bad request",
    clientMessage: { Message: "Bad Request" },
  },
  unauthorized: {
    success: false,
    statusCode: 401,
    message: "unauthorized",
    clientMessage: { Message: "Unauthorized" },
  },
  paymentRequired: {
    success: false,
    statusCode: 402,
    message: "payment required",
    clientMessage: { Message: "Payment Required" },
  },
  notFound: {
    success: false,
    statusCode: 404,
    message: "not found",
    clientMessage: { Message: 'Data not found' },
  },
  userNotFound: {
    success: false,
    statusCode: 404,
    message: "User not found",
    clientMessage: { Message: "User not found" },
  },
  serverTimeout: {
    success: false,
    statusCode: 408,
    message: "server timeout",
    clientMessage: { Message: "Server Timeout" },
  },
  requestEntryLarge: {
    success: false,
    statusCode: 413,
    message: "request entry too large",
    clientMessage: { Message: "Request entry too large" },
  },
  requestURLToLong: {
    success: false,
    statusCode: 414,
    message: "request-URL too long",
    clientMessage: { Message: "Request-URL too long" },
  },
  unsupportedMedia: {
    success: false,
    statusCode: 415,
    message: "unsupported media type",
    clientMessage: { Message: "Unsupported media type" },
  },
  expectationFailed: {
    success: false,
    statusCode: 417,
    message: "expectation failed",
    clientMessage: { Message: "Expectation failed" },
  },
  serverError: {
    success: false,
    statusCode: 500,
    message: "internal server error",
    clientMessage: { Message: "Internal server error" },
  },
  unavailable: {
    success: false,
    statusCode: 503,
    message: "service unavailable",
    clientMessage: { Message: "Service unavailable" },
  },
  validEmail: {
    success: false,
    statusCode: 400,
    message: "bad request",
    clientMessage: { Message: "Please enter valid email" },
  },
  validUserName: {
    success: false,
    statusCode: 400,
    message: "bad request",
    clientMessage: { Message: "Please enter valid UserName" },
  },
  validPassword: {
    success: false,
    statusCode: 400,
    message: "bad request",
    clientMessage: { Message: "Please enter valid password" },
  },
  tryAgain: {
    success: false,
    statusCode: 400,
    message: "bad request",
    clientMessage: { Message: "Something went wrong, Please try again later" },
  }
};

module.exports = { Responses };
