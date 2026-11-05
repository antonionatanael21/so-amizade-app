/**
 * Age calculation and 18+ verification utilities for SÓ AMIZADE.
 * Strictly enforces that every member is at least 18 years old.
 */

export interface AgeValidationResult {
  isValid: boolean;
  age: number;
  error?: string;
}

/**
 * Calculates exact age in years based on ISO date string (YYYY-MM-DD).
 * Handles leap years and day-of-birth precision.
 */
export function calculateAge(birthDateStr: string, referenceDate: Date = new Date()): AgeValidationResult {
  if (!birthDateStr || typeof birthDateStr !== 'string') {
    return { isValid: false, age: 0, error: 'Data de nascimento é obrigatória.' };
  }

  const parts = birthDateStr.split('-');
  if (parts.length !== 3) {
    return { isValid: false, age: 0, error: 'Formato de data inválido. Use AAAA-MM-DD.' };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { isValid: false, age: 0, error: 'Data de nascimento contém valores inválidos.' };
  }

  const birthDate = new Date(year, month, day);
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month ||
    birthDate.getDate() !== day
  ) {
    return { isValid: false, age: 0, error: 'Data de nascimento inexistente no calendário.' };
  }

  if (birthDate > referenceDate) {
    return { isValid: false, age: 0, error: 'Data de nascimento não pode estar no futuro.' };
  }

  // Minimum realistic year check (e.g., maximum 120 years old)
  if (referenceDate.getFullYear() - year > 125) {
    return { isValid: false, age: 0, error: 'Por favor, informe uma data de nascimento válida.' };
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return {
      isValid: false,
      age,
      error: 'O SÓ AMIZADE é exclusivo para maiores de 18 anos. Você deve ter pelo menos 18 anos para se cadastrar.',
    };
  }

  return { isValid: true, age };
}
