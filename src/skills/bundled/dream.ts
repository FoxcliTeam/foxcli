// Manual /dream skill — runs the memory consolidation prompt interactively.
// Extracted from the KAIROS feature gate so it's available unconditionally
// whenever auto-memory is enabled.

import { getAutoMemPath, isAutoMemoryEnabled } from '../../memdir/paths.js'
import { buildConsolidationPrompt } from '../../services/autoDream/consolidationPrompt.js'
import { recordConsolidation } from '../../services/autoDream/consolidationLock.js'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { getProjectDir } from '../../utils/sessionStorage.js'
import { registerBundledSkill } from '../bundledSkills.js'

const DREAM_PROMPT_PREFIX = `# Dream: Memory Consolidation (manual run)

You are performing a manual dream — a reflective pass over your memory files. Unlike the automatic background dream, this run has full tool permissions and the user is watching. Synthesize what you've learned recently into durable, well-organized memories so that future sessions can orient quickly.

`

export function registerDreamSkill(): void {
  registerBundledSkill({
    name: 'dream',
    description:
      'Manually trigger memory consolidation — review, organize, and prune your auto-memory files.',
    whenToUse:
      'Use when the user says /dream or wants to manually consolidate memories, organize memory files, or clean up stale entries.',
    userInvocable: true,
    isEnabled: () => isAutoMemoryEnabled(),
    async getPromptForCommand(args) {
      const memoryRoot = getAutoMemPath()
      const transcriptDir = getProjectDir(getOriginalCwd())

      // Stamp the consolidation lock optimistically (same as the KAIROS path).
      await recordConsolidation()

      const basePrompt = buildConsolidationPrompt(memoryRoot, transcriptDir, '')
      let prompt = DREAM_PROMPT_PREFIX + basePrompt

      if (args) {
        prompt += `\n\n## Additional context from user\n\n${args}`
      }

      return [{ type: 'text', text: prompt }]
    },
  })
}
