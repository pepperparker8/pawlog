import type { LabRow } from '../../lib/types'
import type { RangeStatus } from './status'

/** Plain reference text per analyte. General descriptions only; nothing here reads a cat's result. */
interface Analyte { name: string; about: string; aliases: string[] }

const A: Record<string, Analyte> = {
  rbc: { name: 'Red blood cells', about: 'Count of red blood cells, which carry oxygen.', aliases: ['rbc', 'erythrocytes', 'eritrosit'] },
  hct: { name: 'Hematocrit', about: 'Share of blood volume made up of red cells.', aliases: ['hct', 'hematocrit', 'pcv', 'hematokrit'] },
  hgb: { name: 'Hemoglobin', about: 'Oxygen-carrying protein inside red cells.', aliases: ['hgb', 'hb', 'hemoglobin', 'haemoglobin'] },
  mcv: { name: 'MCV', about: 'Average size of red cells.', aliases: ['mcv'] },
  mch: { name: 'MCH', about: 'Average amount of hemoglobin per red cell.', aliases: ['mch'] },
  mchc: { name: 'MCHC', about: 'Hemoglobin concentration within red cells.', aliases: ['mchc'] },
  rdw: { name: 'RDW', about: 'How much red cell size varies.', aliases: ['rdw', 'rdw-cv', 'rdw-sd'] },
  retic: { name: 'Reticulocytes', about: 'Young red cells, a sign of new red cell production.', aliases: ['retic', 'reticulocytes', 'reticulocyte'] },
  wbc: { name: 'White blood cells', about: 'Total white cells, part of the immune system.', aliases: ['wbc', 'leukocytes', 'leukosit'] },
  neu: { name: 'Neutrophils', about: 'White cells that respond first to infection and inflammation.', aliases: ['neu', 'neut', 'neutrophils', 'neutrofil', 'gran', 'segs'] },
  band: { name: 'Band neutrophils', about: 'Immature neutrophils released from the bone marrow.', aliases: ['band', 'bands', 'band neutrophils'] },
  lym: { name: 'Lymphocytes', about: 'White cells involved in immune memory and antibody production.', aliases: ['lym', 'lymph', 'lymphocytes', 'limfosit'] },
  mono: { name: 'Monocytes', about: 'White cells that clear debris and help fight infection.', aliases: ['mono', 'mon', 'monocytes', 'monosit'] },
  eos: { name: 'Eosinophils', about: 'White cells linked to allergy and parasite responses.', aliases: ['eos', 'eosinophils', 'eosinofil'] },
  baso: { name: 'Basophils', about: 'Rare white cells involved in allergic responses.', aliases: ['baso', 'bas', 'basophils', 'basofil'] },
  plt: { name: 'Platelets', about: 'Cell fragments that help blood clot. Cat platelets often clump in samples.', aliases: ['plt', 'platelets', 'trombosit', 'thrombocytes'] },
  mpv: { name: 'MPV', about: 'Average platelet size.', aliases: ['mpv'] },
  tp: { name: 'Total protein', about: 'All proteins in the blood, mainly albumin and globulins.', aliases: ['tp', 'total protein', 'protein total', 'tpro'] },
  alb: { name: 'Albumin', about: 'Main blood protein, made by the liver.', aliases: ['alb', 'albumin'] },
  glob: { name: 'Globulin', about: 'Blood proteins that include antibodies.', aliases: ['glob', 'globulin'] },
  ag_ratio: { name: 'A/G ratio', about: 'Albumin divided by globulin.', aliases: ['a/g', 'a/g ratio', 'alb/glob'] },
  alt: { name: 'ALT', about: 'Liver enzyme released when liver cells are stressed or damaged.', aliases: ['alt', 'sgpt', 'alt (gpt)'] },
  ast: { name: 'AST', about: 'Enzyme found in liver and muscle.', aliases: ['ast', 'sgot', 'ast (got)'] },
  alp: { name: 'ALP', about: 'Enzyme from liver and bone.', aliases: ['alp', 'alkp', 'alkaline phosphatase'] },
  ggt: { name: 'GGT', about: 'Enzyme linked to the liver and bile ducts.', aliases: ['ggt', 'gamma gt'] },
  tbil: { name: 'Total bilirubin', about: 'Pigment from red cell breakdown, cleared by the liver.', aliases: ['tbil', 'bilirubin', 'total bilirubin', 'bil-t'] },
  chol: { name: 'Cholesterol', about: 'Blood fat, affected by diet, liver and hormones.', aliases: ['chol', 'cholesterol', 'kolesterol'] },
  tg: { name: 'Triglycerides', about: 'Blood fat, often higher after a meal.', aliases: ['tg', 'trig', 'triglycerides', 'trigliserida'] },
  glu: { name: 'Glucose', about: 'Blood sugar. Stress at the clinic can raise it in cats.', aliases: ['glu', 'glucose', 'glukosa', 'blood sugar'] },
  bun: { name: 'Urea (BUN)', about: 'Waste product cleared by the kidneys; also affected by diet and hydration.', aliases: ['bun', 'urea', 'ureum', 'blood urea nitrogen'] },
  crea: { name: 'Creatinine', about: 'Muscle waste product cleared by the kidneys.', aliases: ['crea', 'creat', 'creatinine', 'kreatinin', 'cre'] },
  sdma: { name: 'SDMA', about: 'Kidney filtration marker, less affected by muscle mass than creatinine.', aliases: ['sdma'] },
  phos: { name: 'Phosphorus', about: 'Mineral regulated by the kidneys and hormones.', aliases: ['phos', 'phosphorus', 'phosphate', 'fosfor', 'p'] },
  ca: { name: 'Calcium', about: 'Mineral for bones, nerves and muscles.', aliases: ['ca', 'calcium', 'kalsium'] },
  na: { name: 'Sodium', about: 'Electrolyte that helps control body water.', aliases: ['na', 'sodium', 'natrium'] },
  k: { name: 'Potassium', about: 'Electrolyte for nerve and muscle function.', aliases: ['k', 'potassium', 'kalium'] },
  cl: { name: 'Chloride', about: 'Electrolyte that moves with sodium and water.', aliases: ['cl', 'chloride', 'klorida'] },
  na_k_ratio: { name: 'Na/K ratio', about: 'Sodium divided by potassium.', aliases: ['na/k', 'na:k', 'na/k ratio'] },
  tco2: { name: 'Bicarbonate (TCO2)', about: 'Reflects the acid-base balance of the blood.', aliases: ['tco2', 'hco3', 'bicarbonate'] },
  amyl: { name: 'Amylase', about: 'Digestive enzyme; of limited use on its own in cats.', aliases: ['amyl', 'amylase'] },
  lipa: { name: 'Lipase', about: 'Digestive enzyme from the pancreas.', aliases: ['lipa', 'lipase', 'dgge lipase'] },
  fpli: { name: 'fPLI', about: 'Pancreas-specific lipase test for cats.', aliases: ['fpli', 'spec fpl', 'fpl'] },
  ck: { name: 'CK', about: 'Muscle enzyme; can rise after handling or injections.', aliases: ['ck', 'cpk', 'creatine kinase'] },
  fructosamine: { name: 'Fructosamine', about: 'Average blood sugar over the past one to three weeks.', aliases: ['fructosamine'] },
  t4: { name: 'Total T4', about: 'Thyroid hormone.', aliases: ['t4', 'tt4', 'total t4', 'thyroxine'] },
  saa: { name: 'SAA', about: 'Serum amyloid A, a protein that rises quickly with inflammation.', aliases: ['saa', 'serum amyloid a'] },
  felv: { name: 'FeLV antigen', about: 'Test for feline leukemia virus.', aliases: ['felv', 'felv ag', 'felv antigen'] },
  fiv: { name: 'FIV antibody', about: 'Test for antibodies to feline immunodeficiency virus.', aliases: ['fiv', 'fiv ab', 'fiv antibody'] },
  fcov_ab: { name: 'FCoV antibody', about: 'Antibodies to feline coronavirus, which is common in cats.', aliases: ['fcov', 'fcov ab', 'fcov antibody', 'fip ab', 'corona ab'] },
  rivalta: { name: 'Rivalta test', about: 'Simple test on body cavity fluid.', aliases: ['rivalta', 'rivalta test'] },
  usg: { name: 'Urine specific gravity', about: 'How concentrated the urine is.', aliases: ['usg', 'sg', 'specific gravity', 'bj urine', 'berat jenis'] },
  upc: { name: 'UPC ratio', about: 'Urine protein compared with urine creatinine.', aliases: ['upc', 'up:c', 'upc ratio'] },
  urine_ph: { name: 'Urine pH', about: 'Acidity of the urine.', aliases: ['urine ph', 'ph'] },
  urine_protein: { name: 'Urine protein', about: 'Protein measured on a urine dipstick.', aliases: ['urine protein', 'protein urine', 'pro'] },
}

export const analyteName = (key: string, printed: string) => A[key]?.name ?? printed
export const analyteAbout = (r: Pick<LabRow, 'analyte_key' | 'about'>) => A[r.analyte_key]?.about ?? r.about ?? null

const norm = (s: string) => s.toLowerCase().replace(/[()#%]/g, ' ').replace(/\s+/g, ' ').trim()
const ALIAS = new Map(Object.entries(A).flatMap(([k, a]) => a.aliases.map(x => [norm(x), k] as const)))

/** Maps a hand-typed test name onto a known key so it trends with read results; unknown names stay 'other'. */
export function keyFor(analyte: string): string {
  const n = norm(analyte)
  return ALIAS.get(n) ?? ALIAS.get(n.split(' ')[0]) ?? 'other'
}

/** Questions to bring to the vet. Asked, not answered: the app never explains why a value moved. */
export function vetQuestions(r: Pick<LabRow, 'analyte' | 'analyte_key'>, status: RangeStatus, moved: boolean): string[] {
  const name = analyteName(r.analyte_key, r.analyte)
  const q: string[] = []
  if (status === 'high' || status === 'low') {
    q.push(`What could make ${name} ${status} right now?`)
    q.push(`Should ${name} be rechecked, and when?`)
  }
  if (moved) q.push(`Is the change in ${name} since the last test meaningful?`)
  return q
}
