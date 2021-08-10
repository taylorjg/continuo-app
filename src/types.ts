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
}

export interface CommonBoard {
  placeCard(placedCard: CommonPlacedCard): CommonBoard
  findAvailableCardPositions(): CommonCell[]
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
  rotateCW(): CommonPlacedCard
  rotateCCW(): CommonPlacedCard
  moveTo(row: number, col: number): CommonPlacedCard
  equals(other: CommonPlacedCard): boolean
}

export interface CommonPossibleMove {
  placedCard: CommonPlacedCard
  score: number
}
