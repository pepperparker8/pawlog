import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown } from './markdown'

describe('parseMarkdown', () => {
  it('reads headings, lists, quotes and paragraphs', () => {
    const md = '## Start\nFirst line\nsecond line\n\n- a\n- b\n1. one\n2) two\n> Call your vet\n### Small'
    expect(parseMarkdown(md)).toEqual([
      { type: 'h2', text: 'Start' },
      { type: 'p', text: 'First line second line' },
      { type: 'ul', items: ['a', 'b'] },
      { type: 'ol', items: ['one', 'two'] },
      { type: 'quote', text: 'Call your vet' },
      { type: 'h3', text: 'Small' },
    ])
  })
  it('splits bold spans', () => {
    expect(parseInline('Do **not** give paracetamol')).toEqual([
      { bold: false, text: 'Do ' }, { bold: true, text: 'not' }, { bold: false, text: ' give paracetamol' },
    ])
  })
})
