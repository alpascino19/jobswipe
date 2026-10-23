export type WorkMode = 'remote' | 'hibrid' | 'la sediu'
export type Level = 'Junior' | 'Mid' | 'Senior'
export type Decision = 'apply' | 'pass' | 'save'

export interface Job {
  id: string
  title: string
  company: string
  /** OKLCH hue (0–360) for the card's colour field. */
  hue: number
  city: string
  mode: WorkMode
  level: Level
  salaryMin: number
  salaryMax: number
  posted: string
  tags: string[]
  summary: string
  perks: string[]
}

export interface Filters {
  mode: 'toate' | WorkMode
  city: string
  minSalary: number
}
