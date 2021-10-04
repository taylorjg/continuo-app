export type Settings = {
  readonly soundBestScoreEnabled: boolean
  readonly soundIllegalMoveEnabled: boolean
  readonly soundRotationEnabled: boolean
  readonly hintShowScoringHighlights: boolean
  readonly hintShowBestAvailableScore: boolean,
  readonly turnClock: number
}

export const DEFAULT_SETTINGS = {
  soundBestScoreEnabled: true,
  soundIllegalMoveEnabled: false,
  soundRotationEnabled: false,
  hintShowScoringHighlights: true,
  hintShowBestAvailableScore: true,
  turnClock: 0
}
