function sendJSONResponse(request, response, statusCode, messageOrObject) {
  let data;

  if (typeof messageOrObject === 'string') {
    data = { message: messageOrObject };
  } else if (typeof messageOrObject === 'object' && messageOrObject !== null) {
    data = messageOrObject;
  } else {
    data = { message: 'Invalid response format' };
  }

  response.status(statusCode).json({
    statusCode: statusCode,
    data: data
  });
}

function sendResponse(request, response, statusCode, messageOrObject) {
  sendJSONResponse(request, response, statusCode, messageOrObject);
}

module.exports = { sendResponse };
