/** Canonical analyte keys the model maps printed names onto, so results line up across labs for trends. */
export const ANALYTE_KEYS = [
  'rbc', 'hct', 'hgb', 'mcv', 'mch', 'mchc', 'rdw', 'retic',
  'wbc', 'neu', 'band', 'lym', 'mono', 'eos', 'baso', 'plt', 'mpv',
  'tp', 'alb', 'glob', 'ag_ratio', 'alt', 'ast', 'alp', 'ggt', 'tbil', 'chol', 'tg', 'glu',
  'bun', 'crea', 'sdma', 'phos', 'ca', 'na', 'k', 'cl', 'na_k_ratio', 'tco2',
  'amyl', 'lipa', 'fpli', 'ck', 'fructosamine', 't4', 'saa',
  'felv', 'fiv', 'fcov_ab', 'rivalta',
  'usg', 'upc', 'urine_ph', 'urine_protein',
  'other',
] as const
export type AnalyteKey = (typeof ANALYTE_KEYS)[number]
