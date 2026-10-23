import type { Job, WorkMode } from './types'

const nf = new Intl.NumberFormat('ro-RO')

export const formatSalary = (job: Job) => `${nf.format(job.salaryMin)}–${nf.format(job.salaryMax)}`
export const formatLei = (n: number) => nf.format(n)

export const MODE_LABEL: Record<WorkMode, string> = {
  remote: 'Remote',
  hibrid: 'Hibrid',
  'la sediu': 'La sediu',
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('') || name.slice(0, 2).toUpperCase()
