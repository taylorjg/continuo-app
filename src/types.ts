export interface IBoardScene {
  onRestart(): void
  onNextCard(): void
  onComputerMove(): Promise<void>
  onRotateCW(): void
  onRotateCCW(): void
  onPlaceCard(): void
}

export type CommonAdapter = {
  originalCards: readonly CommonCard[]
  emptyBoard: CommonBoard
  createDeck(): CommonDeck
  evaluateCard: (board: CommonBoard, card: CommonCard) => CommonPossibleMove[]
  placedCardRotateCW(placedCard: CommonPlacedCard): CommonPlacedCard
  placedCardRotateCCW(placedCard: CommonPlacedCard): CommonPlacedCard
  placedCardMoveTo(placedCard: CommonPlacedCard, row: number, col: number): CommonPlacedCard
  placedCardsHaveSamePlacement(placedCard1: CommonPlacedCard, placedCard2: CommonPlacedCard): boolean
}

export type CommonBoardRange = {
  width: number,
  height: number,
  centreX: number,
  centreY: number
}

export interface CommonBoard {
  placeCard(placedCard: CommonPlacedCard): CommonBoard
  findAvailableCardPositions(): CommonCell[]
  getBoundaries(): [number, number, number, number]
}

export interface CommonCard {
}

export interface CommonCell {
  row: number
  col: number
}

export interface CommonDeck {
  reset(): void
  nextCard(): CommonCard
  numCardsLeft: number
}

export interface CommonPlacedCard {
  card: CommonCard
  row: number
  col: number
}

export interface CommonPossibleMove {
  placedCard: CommonPlacedCard
  score: number
}
