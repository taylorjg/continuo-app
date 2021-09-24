export const enum ContinuoAppScenes {
  Home = 'HomeScene',
  BoardBackground = 'BoardBackgroundScene',
  HUD = 'HUDScene',
  ContinuoBoard = 'ContinuoBoardScene',
  HexagoBoard = 'HexagoBoardScene'
}

export const enum ContinuoAppEvents {
  RotateCW = 'rotateCW',
  RotateCCW = 'rotateCCW',
  PlaceCard = 'placeCard',
  NewGame = 'newGame',
  NextTurn = 'nextTurn',
  StartMove = 'startMove',
  CardMoved = 'cardMoved',
  CardRotated = 'cardRotated',
  EndMove = 'endMove',
  GameOver = 'gameOver',
  ScoreboardUpdated = 'scoreboardUpdated',
  SettingsChanged = 'settingsChanged'
}
