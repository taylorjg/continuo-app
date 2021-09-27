export const enum ContinuoAppScenes {
  Home = 'HomeScene',
  BoardBackground = 'BoardBackgroundScene',
  HUD = 'HUDScene',
  ContinuoBoard = 'ContinuoBoardScene',
  HexagoBoard = 'HexagoBoardScene'
}

export const enum ContinuoAppEvents {
  RotateCW = 'RotateCW',
  RotateCCW = 'RotateCCW',
  PlaceCard = 'PlaceCard',
  NewGame = 'NewGame',
  ReadyForNextTurn = 'ReadyForNextTurn',
  NextTurn = 'NextTurn',
  StartMove = 'StartMove',
  EndMove = 'EndMove',
  CardMoved = 'CardMoved',
  CardRotated = 'CardRotated',
  GameOver = 'GameOver',
  ScoreboardUpdated = 'ScoreboardUpdated',
  SettingsChanged = 'SettingsChanged',
  PlayersChanged = 'PlayersChanged'
}
