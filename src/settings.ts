export type Settings = {
  readonly soundBestScoreEnabled: boolean
  readonly soundIllegalMoveEnabled: boolean
  readonly soundRotationEnabled: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  soundBestScoreEnabled: true,
  soundIllegalMoveEnabled: false,
  soundRotationEnabled: false
}
