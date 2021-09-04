export const enum ContinuoAppScenes {
  Home = 'HomeScene',
  HUD = 'HUDScene',
  ContinuoBoard = 'ContinuoBoardScene',
  HexagoBoard = 'HexagoBoardScene'
}

export const enum ContinuoAppEvents {
  NextCard = 'nextCard',
  MoveCard = 'moveCard',
  PlaceCard = 'placeCard',
  StartRotateCard = 'startRotateCard',
  EndRotateCard = 'endRotateCard',
  StartComputerMove = 'startComputerMove',
  EndComputerMove = 'endComputerMove',
  NextTurn = 'nextTurn',
  UpdateScoreboard = 'updateScoreboard',
  FinalScores = 'finalScores',
  SettingsChanged = 'settingsChanged'
}
