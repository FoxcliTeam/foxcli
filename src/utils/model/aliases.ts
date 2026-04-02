export const MODEL_ALIASES = [
  'deepseek',
  'moonshot',
  'minimax',
  'best',
] as const
export type ModelAlias = (typeof MODEL_ALIASES)[number]

export function isModelAlias(modelInput: string): modelInput is ModelAlias {
  return MODEL_ALIASES.includes(modelInput as ModelAlias)
}

export const MODEL_FAMILY_ALIASES = ['deepseek', 'moonshot', 'minimax'] as const

export function isModelFamilyAlias(model: string): boolean {
  return (MODEL_FAMILY_ALIASES as readonly string[]).includes(model)
}
