export type Options = {
  readonly hintShowScoringHighlights: boolean
  readonly hintShowBestAvailableScore: boolean,
  readonly turnClock: number
}

export const DEFAULT_OPTIONS: Options = {
  hintShowScoringHighlights: true,
  hintShowBestAvailableScore: true,
  turnClock: 0
}
