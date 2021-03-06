import * as Phaser from 'phaser'

import { EventCentre } from '../eventCentre'
import { ContinuoAppScenes } from '../constants'

import { BoardScene, BoardSceneConfig, HIGHLIGHT_DEPTH, HIGHLIGHT_COLOUR } from './boardScene'
import { CommonAdapter, CommonBoardRange } from '../types'

import {
  Board,
  Card,
  Cell,
  Colour,
  Deck,
  Orientation,
  PlacedCard,
  PossibleMove,
  evaluateCard,
  switchOrientation
} from '../continuo-lib'

const CELL_SIZE = 28 * 2
const GAP_SIZE = 2
const CARD_SIZE = 4 * CELL_SIZE + 3 * GAP_SIZE
const QUARTER_CARD_SIZE = CARD_SIZE / 4
const EIGHTH_CARD_SIZE = CARD_SIZE / 8
const NUM_MARGIN_CELLS = 5

const HIGHLIGHT_LINE_WIDTH = CELL_SIZE / 5

const COLOUR_MAP = new Map([
  [Colour.Red, 0xFF0000],
  [Colour.Green, 0x00FF00],
  [Colour.Blue, 0x0000FF],
  [Colour.Yellow, 0xFFFF00]
])

const drawCard = (graphics: Phaser.GameObjects.Graphics, card: Card): void => {
  graphics.fillStyle(0x000000)
  graphics.fillRect(0, 0, CARD_SIZE, CARD_SIZE)
  for (const rowWithinCard of [0, 1, 2, 3]) {
    for (const colWithinCard of [0, 1, 2, 3]) {
      const cellColour = card.colourAt(rowWithinCard, colWithinCard, Orientation.NorthSouth)
      const colour = COLOUR_MAP.get(cellColour)
      graphics.fillStyle(colour)
      const x = rowWithinCard * (CELL_SIZE + GAP_SIZE)
      const y = colWithinCard * (CELL_SIZE + GAP_SIZE)
      graphics.fillRect(x, y, CELL_SIZE, CELL_SIZE)
    }
  }
}

export const createContinuoCardSprite = (scene: Phaser.Scene): Phaser.GameObjects.Sprite => {
  const graphics = new Phaser.GameObjects.Graphics(scene)
  drawCard(graphics, Deck.originalCards[0])
  const key = 'ContinuoCardSprite'
  graphics.generateTexture(key, CARD_SIZE, CARD_SIZE)
  return new Phaser.GameObjects.Sprite(scene, 0, 0, key)
}

const adapter: CommonAdapter = {
  deck: new Deck(),
  originalCards: Deck.originalCards,
  emptyBoard: Board.empty,
  evaluateCard(board: Board, card: Card): PossibleMove[] {
    return evaluateCard(board, card)
  },
  placedCardRotateCW(placedCard: PlacedCard): PlacedCard {
    const newOrientation = switchOrientation(placedCard.orientation)
    return new PlacedCard(placedCard.card, placedCard.row, placedCard.col, newOrientation)
  },
  placedCardRotateCCW(placedCard: PlacedCard): PlacedCard {
    const newOrientation = switchOrientation(placedCard.orientation)
    return new PlacedCard(placedCard.card, placedCard.row, placedCard.col, newOrientation)
  },
  placedCardMoveTo(placedCard: PlacedCard, row: number, col: number): PlacedCard {
    return new PlacedCard(placedCard.card, row, col, placedCard.orientation)
  },
  placedCardsHaveSamePlacement(placedCard1: PlacedCard, placedCard2: PlacedCard): boolean {
    return (
      placedCard1.row == placedCard2.row &&
      placedCard1.col == placedCard2.col &&
      placedCard1.orientation == placedCard2.orientation
    )
  }
}

export class ContinuoBoardScene extends BoardScene {

  constructor(eventCentre: EventCentre) {
    const boardSceneConfig: BoardSceneConfig = {
      eventCentre,
      CARD_WIDTH: CARD_SIZE,
      CARD_HEIGHT: CARD_SIZE,
      ROTATION_ANGLE: 90
    }
    super(ContinuoAppScenes.ContinuoBoard, boardSceneConfig, adapter)
  }

  protected *getInitialPlacedCards(deck: Deck, board: Board, numPlayers: number) {

    const card1 = deck.nextCard()
    const orientation1 = this.chooseRandomOrientation()
    const placedCard1 = new PlacedCard(card1, 0, 0, orientation1)
    board = yield placedCard1

    const card2 = deck.nextCard()
    const placedCard2 = this.chooseRandomBestScoreMove(evaluateCard(board, card2)).placedCard
    board = yield placedCard2

    if (numPlayers == 3) {
      const card3 = deck.nextCard()
      const placedCard3 = this.chooseRandomBestScoreMove(evaluateCard(board, card3)).placedCard
      board = yield placedCard3
    }
  }

  protected getCardPosition(row: number, col: number): Phaser.Geom.Point {
    const x = (col + 2) * QUARTER_CARD_SIZE
    const y = (row + 2) * QUARTER_CARD_SIZE
    return new Phaser.Geom.Point(x, y)
  }

  protected getSnapPosition(x: number, y: number): Cell {
    const row = Math.round(y / QUARTER_CARD_SIZE)
    const col = Math.round(x / QUARTER_CARD_SIZE)
    return new Cell(row - 2, col - 2)
  }

  protected drawCard(graphics: Phaser.GameObjects.Graphics, card: Card): void {
    drawCard(graphics, card)
  }

  protected getPlacedCardRotationAngle(placedCard: PlacedCard): number {
    switch (placedCard.orientation) {
      case Orientation.NorthSouth: return 0
      case Orientation.EastWest: return 90
    }
  }

  protected createCurrentCardHighlight(): Phaser.GameObjects.GameObject {
    const currentCardHighlight = new Phaser.GameObjects.Rectangle(this, 0, 0, CARD_SIZE, CARD_SIZE)
    currentCardHighlight.setStrokeStyle(HIGHLIGHT_LINE_WIDTH, HIGHLIGHT_COLOUR)
    return currentCardHighlight
  }

  protected createScoringHighlights(currentPossibleMove: PossibleMove): Phaser.GameObjects.Shape[] {
    return currentPossibleMove.chains.map(chain => {
      const points = chain.cells.map(cell => this.getCellPosition(cell.row, cell.col))
      const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, points)
      polygon.isFilled = false
      polygon.setClosePath(chain.isCycle)
      polygon.setOrigin(0, 0)
      polygon.setStrokeStyle(HIGHLIGHT_LINE_WIDTH, HIGHLIGHT_COLOUR)
      polygon.setDepth(HIGHLIGHT_DEPTH)
      return polygon
    })
  }

  protected getBoardRange(board: Board): CommonBoardRange {
    const { left, right, top, bottom } = board.getBounds()
    const numCellsWide = right - left + 1 + (2 * NUM_MARGIN_CELLS)
    const numCellsHigh = bottom - top + 1 + (2 * NUM_MARGIN_CELLS)
    const width = numCellsWide * QUARTER_CARD_SIZE
    const height = numCellsHigh * QUARTER_CARD_SIZE
    const centreX = (left - NUM_MARGIN_CELLS) * QUARTER_CARD_SIZE + (width / 2)
    const centreY = (top - NUM_MARGIN_CELLS) * QUARTER_CARD_SIZE + (height / 2)
    return { width, height, centreX, centreY }
  }

  private getCellPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
    const y = row * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
    return new Phaser.Geom.Point(x, y)
  }

  private chooseRandomOrientation(): Orientation {
    return Phaser.Utils.Array.GetRandom([
      Orientation.NorthSouth,
      Orientation.EastWest
    ])
  }
}
