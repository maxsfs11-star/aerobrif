export function isValidICAO(code) {
  return /^[A-Z]{4}$/.test(code);
}
