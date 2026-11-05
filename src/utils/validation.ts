/**
 * Input sanitization and format validation for SÓ AMIZADE.
 */

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '') // Basic HTML tag strip
    .trim();
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Nome de usuário é obrigatório.' };
  }
  const clean = username.trim().toLowerCase();
  if (clean.length < 3) {
    return { isValid: false, error: 'O nome de usuário deve ter no mínimo 3 caracteres.' };
  }
  if (clean.length > 30) {
    return { isValid: false, error: 'O nome de usuário deve ter no máximo 30 caracteres.' };
  }
  // Letters, numbers, underscores, dots, hyphens
  if (!/^[a-z0-9_.-]+$/.test(clean)) {
    return {
      isValid: false,
      error: 'O nome de usuário pode conter apenas letras minúsculas, números, pontos, traços e sublinhados.',
    };
  }
  // Reserved handles
  const reserved = ['admin', 'moderador', 'soamizade', 'suporte', 'sistema', 'root', 'seguranca', 'oficial'];
  if (reserved.includes(clean)) {
    return { isValid: false, error: 'Este nome de usuário é reservado pela moderação.' };
  }
  return { isValid: true };
}

export function calculateCommonInterests(userAInterests: string[], userBInterests: string[]): string[] {
  if (!Array.isArray(userAInterests) || !Array.isArray(userBInterests)) return [];
  const setA = new Set(userAInterests.map((i) => i.toLowerCase().trim()));
  return userBInterests.filter((item) => setA.has(item.toLowerCase().trim()));
}
