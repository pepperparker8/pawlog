export type Block =
  | { type: 'h2' | 'h3' | 'p' | 'quote'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }

/** A small subset of Markdown for article bodies: headings, lists, quotes, paragraphs. */
export function parseMarkdown(md: string): Block[] {
  const out: Block[] = []
  let para: string[] = []
  const flush = () => { if (para.length) { out.push({ type: 'p', text: para.join(' ') }); para = [] } }
  for (const raw of md.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    let m: RegExpMatchArray | null
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) { flush(); out.push({ type: m[1].length === 2 ? 'h2' : 'h3', text: m[2] }); continue }
    if ((m = line.match(/^>\s?(.*)$/))) { flush(); out.push({ type: 'quote', text: m[1] }); continue }
    const ul = line.match(/^[-*]\s+(.*)$/), ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ul || ol) {
      flush()
      const type = ul ? 'ul' : 'ol', text = (ul ?? ol)![1]
      const last = out[out.length - 1]
      if (last && last.type === type) last.items.push(text)
      else out.push({ type, items: [text] })
      continue
    }
    para.push(line)
  }
  flush()
  return out
}

export type Span = { bold: boolean; text: string }

export function parseInline(text: string): Span[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean)
    .map(t => (t.startsWith('**') && t.endsWith('**') ? { bold: true, text: t.slice(2, -2) } : { bold: false, text: t }))
}
