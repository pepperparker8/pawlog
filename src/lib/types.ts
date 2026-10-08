export type HouseholdRole = 'owner' | 'caregiver' | 'viewer'
export type CatSex = 'male' | 'female' | 'unknown'
export type Severity = 'mild' | 'moderate' | 'severe'

export interface Profile { id: string; display_name: string; avatar_path: string | null }
export interface Household { id: string; name: string; created_by: string; created_at: string }
export interface HouseholdMember { household_id: string; user_id: string; role: HouseholdRole; joined_at: string; profiles?: Profile }

export interface Cat {
  id: string; household_id: string; name: string; nickname: string | null; breed: string | null; color: string | null
  sex: CatSex; date_of_birth: string | null; dob_is_estimate: boolean; adopted_on: string | null
  microchip_id: string | null; neutered: boolean | null; blood_type: string | null; allergies: string | null
  known_conditions: string | null; emergency_notes: string | null; vet_name: string | null; clinic_name: string | null
  clinic_phone: string | null; profile_photo_id: string | null; archived_at: string | null; deceased_on: string | null
  breed_code?: string | null; created_at: string
}

export interface CatSummary {
  cat_id: string; household_id: string; name: string; nickname: string | null; sex: CatSex; breed: string | null; color: string | null
  date_of_birth: string | null; dob_is_estimate: boolean; archived_at: string | null; profile_photo_id: string | null
  profile_thumbnail_path: string | null; profile_photo_path: string | null
  last_weight_kg: number | null; last_weight_at: string | null; last_fed_at: string | null; last_litter_at: string | null
  last_medication_at: string | null; last_grooming_at: string | null; last_symptom_at: string | null
  symptoms_7d: number; active_medications: number; next_vaccine_due: string | null; next_parasite_due: string | null
  next_task_due: string | null; total_xp: number; level: number; streak_current: number; photo_count: number
}

export type TimelineKind =
  | 'weight' | 'feeding' | 'water' | 'litter' | 'symptom' | 'medication' | 'grooming' | 'behavior'
  | 'activity' | 'journal' | 'photo' | 'vet_visit' | 'vaccination' | 'parasite' | 'care_task' | 'milestone'

export interface TimelineEvent {
  id: string; household_id: string; cat_id: string | null; kind: TimelineKind; occurred_at: string
  title: string; detail: string | null; data: Record<string, unknown>; created_by: string | null; created_at: string
}

export interface WeightLog { id: string; cat_id: string; logged_at: string; weight_kg: number; body_condition_score: number | null; body_condition_source: 'vet' | 'owner' | null; note: string | null }
export interface WeightWeekly { cat_id: string; week_start: string; avg_kg: number; min_kg: number; max_kg: number; samples: number }

export interface Photo {
  id: string; household_id: string; cat_id: string; storage_path: string; thumbnail_path: string | null; caption: string | null
  tags: string[]; taken_at: string; is_favorite: boolean; width: number | null; height: number | null
}

export interface CareTask {
  id: string; household_id: string; cat_id: string | null; name: string; kind: string; frequency_days: number | null
  next_due_on: string | null; assigned_to: string | null; reminder_enabled: boolean; active: boolean
}

export interface CatMedication {
  id: string; cat_id: string; name: string; dose: string | null; frequency: string | null; times_per_day: number | null
  start_on: string | null; end_on: string | null; reason: string | null; active: boolean
}
export interface CatCondition { id: string; cat_id: string; name: string; noted_on: string | null; status: string; notes: string | null }
export interface VetVisit {
  id: string; cat_id: string; visited_on: string; clinic: string | null; vet_name: string | null; reason: string | null
  findings: string | null; cost: number | null; currency: string | null; follow_up_on: string | null; note: string | null
}
export interface VaccinationRecord { id: string; cat_id: string; vaccine_name: string; given_on: string; next_due_on: string | null; clinic: string | null; batch_no: string | null; note: string | null }
export interface ParasiteTreatment { id: string; cat_id: string; kind: string; product: string | null; given_on: string; next_due_on: string | null; note: string | null }
export interface FoodProfile { id: string; household_id: string; brand: string | null; product: string; type: string; kcal_per_100g: number | null; serving_size_g: number | null; archived_at: string | null }

export interface XpRule { event_type: string; label: string; xp: number; window_minutes: number; daily_cap: number; full_per_day: number; active: boolean }
export interface LevelConfig { level: number; min_xp: number; title: string; perk: string | null }
export interface UserStats { user_id: string; total_xp: number; level: number; streak_current: number; streak_best: number; streak_last_on: string | null; freezes_left: number }
export interface HouseholdStats { household_id: string; total_xp: number; level: number; streak_current: number; streak_best: number }
export interface XpTransaction { id: string; household_id: string; user_id: string; cat_id: string | null; event_type: string; xp: number; reason: string | null; created_at: string }
export interface Badge { code: string; name: string; description: string; icon: string; scope: 'user' | 'cat' | 'household'; sort_order: number; retired: boolean }
export interface UserBadge { user_id: string; badge_code: string; cat_id: string; household_id: string; earned_at: string }
export interface WeeklyQuest { cat_id: string; cat_name: string; quest_code: string; title: string; description: string; icon: string; xp_reward: number; target: number; done: number; completed: boolean }
export interface RhythmWeek { cat_id: string; week_start: string; goals_done: number; goals_total: number }
export interface QuestProgress { quest_code: string; title: string; description: string; xp_reward: number; target: number; done: number; completed: boolean }

export interface Pattern { cat_id: string; cat_name: string; code: string; severity: 'info' | 'watch' | 'act'; title: string; detail: string; since: string }
export interface HouseholdToday { date: string; cats: number; logs_today: number; xp_today: number; cats_fed_today: number; tasks_due: number; symptoms_7d: number }

export interface Notification { id: string; household_id: string; user_id: string; cat_id: string | null; kind: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }
export interface SearchHit { kind: string; id: string; cat_id: string | null; title: string; snippet: string; occurred_at: string }
export interface Milestone { id: string; cat_id: string; code: string; label: string; reached_at: string; archived_at: string | null }
