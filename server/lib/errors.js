/**
 * @param {string} message
 * @param {number} [status]
 * @param {string} [code]
 */
export function createError(message, status = 400, code = "") {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}
