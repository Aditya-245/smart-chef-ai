const COMMA = 44;
const QUOTE = 34;
const CR = 13;
const LF = 10;

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  const n = text.length;

  if (n > 0 && text.charCodeAt(0) === 0xfeff) i = 1;

  while (i < n) {
    const c = text.charCodeAt(i);

    if (c === QUOTE) {
      i++;
      let start = i;
      for (;;) {
        const q = text.indexOf('"', i);
        if (q === -1) {
          field += text.slice(start);
          i = n;
          break;
        }
        if (q + 1 < n && text.charCodeAt(q + 1) === QUOTE) {
          field += text.slice(start, q + 1);
          i = q + 2;
          start = i;
          continue;
        }
        field += text.slice(start, q);
        i = q + 1;
        break;
      }
      continue;
    }

    if (c === COMMA) {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (c === LF) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    if (c === CR) {
      i++;
      continue;
    }

    const s = i;
    while (i < n) {
      const d = text.charCodeAt(i);
      if (d === QUOTE || d === COMMA || d === LF || d === CR) break;
      i++;
    }
    field += text.slice(s, i);
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function toObjects(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { header: [], records: [] };
  const header = rows[0].map((h) => h.trim());
  const records = [];
  for (let r = 1; r < rows.length; r++) {
    const line = rows[r];
    if (line.length === 1 && line[0].trim() === "") continue;
    const obj = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = line[c] === undefined ? "" : line[c];
    }
    records.push(obj);
  }
  return { header, records };
}
