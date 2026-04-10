export function parseGemini(texto) {
  const clean = texto.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("JSON inválido retornado pela IA");
  }
}
