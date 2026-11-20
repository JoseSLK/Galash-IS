// Screenshots and reports go to test-results/ by default, so routine runs never overwrite recorded evidence.
// To record a run: GALASH_EVIDENCE_RUN=R2026111610 npx playwright test ... -> docs/testing/evidence/R2026111610/<name>/
export const evidenceRoot = process.env['GALASH_EVIDENCE_RUN'] ? `docs/testing/evidence/${process.env['GALASH_EVIDENCE_RUN']}` : 'test-results/evidence';
