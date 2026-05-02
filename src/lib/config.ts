export type Task = {
  label: string
  deadline: string // HH:MM, heure Europe/Paris
}

export type RewardQuantity = {
  key: string
  label: string
  mode: 'quantity'
  costPerUnit: number
  unitValue: number
  unit: string
  emoji?: string
}

export type RewardUnique = {
  key: string
  label: string
  mode: 'unique'
  cost: number
  emoji?: string
}

export type Reward = RewardQuantity | RewardUnique
