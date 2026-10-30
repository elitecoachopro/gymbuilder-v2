export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const records: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  const firstLine = source.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) { row.push(field.trim()); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(value => value !== '')) records.push(row);
      row = []; field = '';
    } else field += char;
  }
  if (quoted) throw new Error('CSV conține un câmp între ghilimele neînchis.');
  row.push(field.trim()); if (row.some(value => value !== '')) records.push(row);
  const headers = records.shift()?.map(value => value.toLowerCase()) || [];
  if (new Set(headers).size !== headers.length) throw new Error('CSV conține coloane duplicate.');
  if (records.some(record => record.length !== headers.length)) throw new Error('Numărul de coloane diferă între rânduri.');
  return { headers, rows: records };
}

export function parseCSVPrice(value: string): number {
  let normalized = value.replace(/[€\s]/g, '');
  if (normalized.includes(',') && !normalized.includes('.')) normalized = normalized.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 && price <= 99999999.99 ? price : NaN;
}
