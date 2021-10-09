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
  MoveTimedOut = 'MoveTimedOut',
  CardMoved = 'CardMoved',
  CardRotated = 'CardRotated',
  GameOver = 'GameOver',
  GameAborted = 'GameAborted',
  ScoreboardUpdated = 'ScoreboardUpdated',
  OptionsChanged = 'OptionsChanged',
  SettingsChanged = 'SettingsChanged',
  PlayersChanged = 'PlayersChanged',
  ModalDialogOpened = 'ModalDialogOpened',
  ModalDialogClosed = 'ModalDialogClosed'
}
