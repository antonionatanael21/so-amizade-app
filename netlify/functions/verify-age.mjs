const RESPONSE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function getRecifeToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Recife',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function validateBirthDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { valid: false, age: 0, error: 'Informe uma data de nascimento válida no formato AAAA-MM-DD.' };
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { valid: false, age: 0, error: 'A data informada não existe no calendário.' };
  }

  const today = getRecifeToday();
  if (
    year < today.year - 125 ||
    year > today.year ||
    (year === today.year && (month > today.month || (month === today.month && day > today.day)))
  ) {
    return { valid: false, age: 0, error: 'Informe uma data de nascimento válida.' };
  }

  let age = today.year - year;
  if (month > today.month || (month === today.month && day > today.day)) age -= 1;

  if (age < 18) {
    return {
      valid: false,
      age,
      error: 'O SÓ AMIZADE é exclusivo para pessoas com 18 anos ou mais.',
    };
  }

  return { valid: true, age };
}

export const handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({ ok: true, service: 'SÓ AMIZADE age verification' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...RESPONSE_HEADERS, Allow: 'GET, POST' },
      body: JSON.stringify({ valid: false, error: 'Método não permitido.' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const result = validateBirthDate(payload.birthDate);
    return {
      statusCode: result.valid ? 200 : 403,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify(result),
    };
  } catch {
    return {
      statusCode: 400,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({ valid: false, error: 'Não foi possível processar a data informada.' }),
    };
  }
};
