export const cleanJsonString = (raw) => {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  if (s.startsWith('"') && s.endsWith('"')) {
    try {
      s = JSON.parse(s); 
    } catch {
      s = s.slice(1, -1);
    }
  }

  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    s = s.substring(start, end + 1);
  }

  return s;
};

export const parseAIResponse = (response) => {
  try {
    let clean = response.trim();
    const match = clean.match(/(?:```json\n?)([\s\S]*?)(?:\n?```)/);
    if (match) {
      clean = match[1].trim();
    }
    if (!clean.startsWith('{')) {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        clean = jsonMatch[0];
      }
    }
    clean = clean.replace(/\n/g, ' ').replace(/\r/g, ' ');
    const parsed = JSON.parse(clean);
    return { isValid: true, parsed };
  } catch (error) {
    return { isValid: false, error: error.message, raw: response };
  }
};