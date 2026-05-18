import { extractPayPackage } from '../src/lib/ledger/extractor'
import type { SourceType } from '../src/lib/ledger/types'

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: npm run extract -- "<raw text>" [source_type]')
    console.error('  source_type: email | sms | voice | manual (default: manual)')
    process.exit(1)
  }

  const rawContent = args[0]
  const sourceType = (args[1] as SourceType | undefined) ?? 'manual'

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set. Add it to .env.local.')
    process.exit(1)
  }

  const result = await extractPayPackage({
    rawContent,
    sourceType,
    onCall: (log) =>
      console.error(
        `[llm] ${log.status} ${log.model} in=${log.prompt_tokens} out=${log.completion_tokens} cache=${log.cache_read_tokens}/${log.cache_creation_tokens} ${log.latency_ms}ms`,
      ),
  })

  console.log(JSON.stringify(result.payload, null, 2))
  if (result.needsReview) {
    console.error('Note: extraction_confidence below review threshold; needsReview=true')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
