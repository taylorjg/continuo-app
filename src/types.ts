import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { Player } from './turnManager'

export interface IBoardScene {
  onRestart(players: readonly Player[]): void
  onRotateCW(): void
  onRotateCCW(): void
  onPlaceCard(): void
}

export type SceneWithRexUI = Phaser.Scene & { rexUI: RexUIPlugin }

export type CommonAdapter = {
  deck: CommonDeck
  originalCards: readonly CommonCard[]
  emptyBoard: CommonBoard
  evaluateCard: (board: CommonBoard, card: CommonCard) => CommonPossibleMove[]
  placedCardRotateCW(placedCard: CommonPlacedCard): CommonPlacedCard
  placedCardRotateCCW(placedCard: CommonPlacedCard): CommonPlacedCard
  placedCardMoveTo(placedCard: CommonPlacedCard, row: number, col: number): CommonPlacedCard
  placedCardsHaveSamePlacement(placedCard1: CommonPlacedCard, placedCard2: CommonPlacedCard): boolean
}

export type CommonBoardBounds = {
  left: number,
  right: number,
  top: number,
  bottom: number
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
  getBounds(): CommonBoardBounds
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
