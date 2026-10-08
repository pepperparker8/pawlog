/** Values of the `food_type` enum, in the order shown when logging a meal. */
export const FOOD_TYPES = [
  { code: 'dry', label: 'Kibble', unit: 'g' },
  { code: 'wet', label: 'Wet food', unit: 'pouch' },
  { code: 'treat', label: 'Treats', unit: 'piece' },
  { code: 'supplement', label: 'Supplement', unit: 'scoop' },
  { code: 'raw', label: 'Raw', unit: 'g' },
  { code: 'other', label: 'Other', unit: 'g' },
] as const

export type FoodType = (typeof FOOD_TYPES)[number]['code']
export const foodType = (code?: string | null) => FOOD_TYPES.find(t => t.code === code) ?? FOOD_TYPES[0]

const LAST_KEY = 'pawlog.lastFoodType'
export function lastFoodType(): FoodType {
  try { return foodType(localStorage.getItem(LAST_KEY)).code } catch { return 'dry' }
}
export function rememberFoodType(code: string) {
  try { localStorage.setItem(LAST_KEY, foodType(code).code) } catch { /* private mode */ }
}
