// Signs that need a vet now, checked before the model call. A match sets the answer's urgency to emergency
// whatever the model says. Patterns cover English and Indonesian wording.

export type RedFlag = { code: string; label: string }

const RULES: Array<RedFlag & { re: RegExp }> = [
  { code: 'breathing', label: 'Breathing difficulty',
    re: /open[- ]mouth(ed)? breath|breath\w* (with|through) (an |her |his |its )?(open )?mouth|mouth[- ]breath|breathing (hard|fast|heavily)|struggling to breathe|can'?t breathe|gasping|panting|sesak( napas| nafas)?|napas (lewat |pakai )?mulut|nafas (lewat |pakai )?mulut|megap/i },
  { code: 'urinary_block', label: 'Straining with little or no urine',
    re: /strain\w* (to|when) (pee|urinat)|no (pee|urine)|can'?t (pee|urinate)|not (peeing|urinating)|(tidak|nggak|gak|ga) bisa (pipis|kencing)|susah (pipis|kencing)|ngeden (pipis|kencing)|(pipis|kencing) (tidak|nggak|gak) keluar/i },
  { code: 'collapse', label: 'Collapse or unresponsive',
    re: /collaps|unconscious|unresponsive|can'?t stand|pingsan|(tidak|nggak|gak) sadar|lemas sekali|(tidak|nggak|gak) bisa (berdiri|jalan)/i },
  { code: 'seizure', label: 'Seizure',
    re: /seizure|convuls|fitting|kejang/i },
  { code: 'paralysis', label: 'Sudden hind-leg weakness',
    re: /back legs? (paraly|drag|not working)|hind legs? (paraly|drag)|lumpuh|kaki belakang (lumpuh|diseret|(tidak|nggak|gak) bisa)/i },
  { code: 'toxin', label: 'Possible poisoning',
    re: /\blil(y|ies)\b|antifreeze|paracetamol|acetaminophen|tylenol|permethrin|rat poison|poison|lili\b|racun|keracunan|obat (manusia|orang)/i },
  { code: 'trauma', label: 'Injury or heavy bleeding',
    re: /hit by (a )?(car|vehicle)|fell from|bleeding (heavily|a lot|won'?t stop)|tertabrak|ketabrak|jatuh dari|(pendarahan|perdarahan|berdarah) (banyak|terus|hebat)/i },
]

export function questionRedFlag(text: string): RedFlag | null {
  const hit = RULES.find(r => r.re.test(text))
  return hit ? { code: hit.code, label: hit.label } : null
}

/** Not eating on the latest two consecutive local days of check-ins means 24 hours or more without food. */
export function checkinRedFlag(checkins: Array<{ day: string; eating: string }>): RedFlag | null {
  const byDay = new Map(checkins.map(c => [c.day, c.eating]))
  const latest = [...byDay.keys()].sort().at(-1)
  if (!latest || byDay.get(latest) !== 'none') return null
  const prev = new Date(`${latest}T12:00:00Z`)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return byDay.get(prev.toISOString().slice(0, 10)) === 'none' ? { code: 'not_eating', label: 'Not eating for 24 hours or more' } : null
}
