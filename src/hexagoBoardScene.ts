import * as Phaser from 'phaser'

import { Settings } from './settings'
import { ContinuoAppScenes } from './constants'

import { BoardScene, BoardSceneConfig, HIGHLIGHT_DEPTH, HIGHLIGHT_COLOUR } from './boardScene'
import { CommonAdapter, CommonBoardRange } from './types'

import { Board } from './hexago-lib/board'
import { Card } from './hexago-lib/card'
import { Cell } from './hexago-lib/cell'
import { Deck } from './hexago-lib/deck'
import { Colour, HexagoNumber, Rotation, allRotations, rotationRotateCW, rotationRotateCCW } from './hexago-lib/enums'
import { evaluateCard } from './hexago-lib/evaluate'
import { PlacedCard } from './hexago-lib/placedCard'
import { PossibleMove } from './hexago-lib/possibleMove'
import { Match } from './hexago-lib/match'

const TAN_30 = Math.tan(Phaser.Math.DegToRad(30))

const CARD_HEIGHT = 200
const CARD_WIDTH = CARD_HEIGHT / 2 / TAN_30

const ROW_HEIGHT = CARD_HEIGHT * 0.75
const COL_WIDTH = CARD_WIDTH * 0.5

const DIE_OFFSET = CARD_HEIGHT / 3.65
const DIE_RADIUS = CARD_HEIGHT / 9.25
const DOT_RADIUS = DIE_RADIUS / 6

const WEDGE_INDICES = [0, 1, 2, 3, 4, 5]

const COLOUR_MAP = new Map([
  [Colour.Red, 0xFF0000],
  [Colour.Green, 0x00FF00],
  [Colour.Blue, 0x0000FF],
  [Colour.Yellow, 0xFFFF00],
  [Colour.Orange, 0xFF8C00],
  [Colour.Purple, 0x800080]
])

// https://www.quora.com/How-can-you-find-the-coordinates-in-a-hexagon
const calculateHexagonPoints = (cx: number, cy: number, r: number): Phaser.Geom.Point[] => {
  const triangleHeight = r / 2 / TAN_30
  return [
    new Phaser.Geom.Point(cx, cy - r),
    new Phaser.Geom.Point(cx + triangleHeight, cy - r / 2),
    new Phaser.Geom.Point(cx + triangleHeight, cy + r / 2),
    new Phaser.Geom.Point(cx, cy + r),
    new Phaser.Geom.Point(cx - triangleHeight, cy + r / 2),
    new Phaser.Geom.Point(cx - triangleHeight, cy - r / 2)
  ]
}

const calculateWedgePoints = (cx: number, cy: number, wedgeIndex: number): Phaser.Geom.Point[] => {
  const innerPoints = calculateHexagonPoints(cx, cy, CARD_HEIGHT / 2 - 6)
  const wedgePoints = [
    innerPoints[wedgeIndex],
    innerPoints[(wedgeIndex + 1) % innerPoints.length],
    new Phaser.Geom.Point(cx, cy)
  ]
  return wedgePoints
}

// 0   2
// 3 4 5
// 6   8
const NUMBERS_TO_DOTS = new Map([
  [HexagoNumber.Number1, [4]],
  [HexagoNumber.Number2, [2, 6]],
  [HexagoNumber.Number3, [0, 4, 8]],
  [HexagoNumber.Number4, [0, 2, 6, 8]],
  [HexagoNumber.Number5, [0, 2, 4, 6, 8]],
  [HexagoNumber.Number6, [0, 2, 3, 5, 6, 8]]
])

const calculateDiePoints = (
  cxDie: number,
  cyDie: number,
  wedgeIndex: number): Map<number, Phaser.Geom.Point> => {

  const angleDegrees = rotationToAngle(allRotations[wedgeIndex]) - 60
  const distanceBetweenDots = DOT_RADIUS * 3 * Math.sqrt(2)

  const calculateDieCorner = (additionalAngleDegrees: number) => {
    const totalAngleDegrees = angleDegrees + additionalAngleDegrees
    const totalAngleRadians = Phaser.Math.DegToRad(totalAngleDegrees)
    return new Phaser.Geom.Point(
      cxDie + distanceBetweenDots * Math.cos(totalAngleRadians),
      cyDie + distanceBetweenDots * Math.sin(totalAngleRadians)
    )
  }

  // centre dot
  const p4 = new Phaser.Geom.Point(cxDie, cyDie)

  // corner dots
  const p0 = calculateDieCorner(1 * 45)
  const p2 = calculateDieCorner(7 * 45)
  const p6 = calculateDieCorner(3 * 45)
  const p8 = calculateDieCorner(5 * 45)

  // midpoint dots
  const p3 = Phaser.Geom.Point.Interpolate(p0, p6, 0.5)
  const p5 = Phaser.Geom.Point.Interpolate(p2, p8, 0.5)

  const dotsToPoints = new Map([
    [0, p0],
    [2, p2],
    [3, p3],
    [4, p4],
    [5, p5],
    [6, p6],
    [8, p8]
  ])

  return dotsToPoints
}

const drawWedgeNumber = (graphics: Phaser.GameObjects.Graphics, wedgeIndex: number, number: HexagoNumber): void => {

  const angleDegrees = rotationToAngle(allRotations[wedgeIndex]) - 60
  const angleRadians = Phaser.Math.DegToRad(angleDegrees)

  const cx = CARD_WIDTH / 2
  const cy = CARD_HEIGHT / 2
  const cxDie = cx + DIE_OFFSET * Math.cos(angleRadians)
  const cyDie = cy + DIE_OFFSET * Math.sin(angleRadians)

  graphics.fillStyle(0xFFFFFF)
  graphics.fillCircle(cxDie, cyDie, DIE_RADIUS)

  const dots = NUMBERS_TO_DOTS.get(number)
  const dotsToPoints = calculateDiePoints(cxDie, cyDie, wedgeIndex)

  for (const dot of dots) {
    const point = dotsToPoints.get(dot)
    graphics.fillStyle(0x000000)
    graphics.fillCircle(point.x, point.y, DOT_RADIUS)
  }
}

const drawCard = (graphics: Phaser.GameObjects.Graphics, card: Card): void => {

  const cx = CARD_WIDTH / 2
  const cy = CARD_HEIGHT / 2

  const outerPoints = calculateHexagonPoints(cx, cy, CARD_HEIGHT / 2)
  graphics.fillStyle(0x000000)
  graphics.fillPoints(outerPoints, true)

  for (const wedgeIndex of WEDGE_INDICES) {
    const wedge = card.wedgeAt(wedgeIndex, Rotation.Rotation0)
    const colour = COLOUR_MAP.get(wedge.colour)
    const wedgePoints = calculateWedgePoints(cx, cy, wedgeIndex)
    graphics.fillStyle(colour)
    graphics.fillPoints(wedgePoints, true)
    graphics.lineStyle(2, 0x000000)
    graphics.strokePoints(wedgePoints, true)
    drawWedgeNumber(graphics, wedgeIndex, wedge.number)
  }
}

const findRotationWhereSixIsAtWedgeIndex = (card: Card, wedgeIndex: number): Rotation => {
  for (const rotation of allRotations) {
    const wedge = card.wedgeAt(wedgeIndex, rotation)
    if (wedge.number == HexagoNumber.Number6) {
      return rotation
    }
  }
  throw new Error(`[findRotationWhereSixIsAtWedgeIndex] failed to find a 6 at wedgeIndex ${wedgeIndex}`)
}

const rotationToAngle = (rotation: Rotation): number => {
  switch (rotation) {
    case Rotation.Rotation0: return 0
    case Rotation.Rotation60: return 60
    case Rotation.Rotation120: return 120
    case Rotation.Rotation180: return 180
    case Rotation.Rotation240: return 240
    case Rotation.Rotation300: return 300
  }
}

export const createHexagoCardSprite = (scene: Phaser.Scene): Phaser.GameObjects.Sprite => {
  const graphics = new Phaser.GameObjects.Graphics(scene)
  drawCard(graphics, Deck.originalCards[0])
  const key = 'HexagoCardSprite'
  graphics.generateTexture(key, CARD_WIDTH, CARD_HEIGHT)
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
    const newRotation = rotationRotateCW(placedCard.rotation)
    return new PlacedCard(placedCard.card, placedCard.row, placedCard.col, newRotation)
  },
  placedCardRotateCCW(placedCard: PlacedCard): PlacedCard {
    const newRotation = rotationRotateCCW(placedCard.rotation)
    return new PlacedCard(placedCard.card, placedCard.row, placedCard.col, newRotation)
  },
  placedCardMoveTo(placedCard: PlacedCard, row: number, col: number): PlacedCard {
    return new PlacedCard(placedCard.card, row, col, placedCard.rotation)
  },
  placedCardsHaveSamePlacement(placedCard1: PlacedCard, placedCard2: PlacedCard): boolean {
    return (
      placedCard1.row == placedCard2.row &&
      placedCard1.col == placedCard2.col &&
      placedCard1.rotation == placedCard2.rotation
    )
  }
}

export class HexagoBoardScene extends BoardScene {

  constructor(eventEmitter: Phaser.Events.EventEmitter, settings: Settings) {
    const boardSceneConfig: BoardSceneConfig = {
      eventEmitter,
      settings,
      CARD_WIDTH,
      CARD_HEIGHT,
      ROTATION_ANGLE: 60
    }
    super(ContinuoAppScenes.HexagoBoard, boardSceneConfig, adapter)
  }

  protected *getInitialPlacedCards(deck: Deck, board: Board, numPlayers: number) {

    const card1 = deck.nextCard()
    const rotation1 = findRotationWhereSixIsAtWedgeIndex(card1, 1)
    const placedCard1 = new PlacedCard(card1, 0, 0, rotation1)
    board = yield placedCard1

    const card2 = deck.nextCard()
    const rotation2 = findRotationWhereSixIsAtWedgeIndex(card2, 4)
    const placedCard2 = new PlacedCard(card2, 0, 2, rotation2)
    board = yield placedCard2
  }

  protected getCardPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * COL_WIDTH
    const y = row * ROW_HEIGHT
    return new Phaser.Geom.Point(x, y)
  }

  protected getSnapPosition(x: number, y: number): Cell {
    const row = Math.round(y / ROW_HEIGHT)
    const col = Math.round(x / COL_WIDTH)
    return new Cell(row, col)
  }

  protected drawCard(graphics: Phaser.GameObjects.Graphics, card: Card): void {
    drawCard(graphics, card)
  }

  protected getPlacedCardRotationAngle(placedCard: PlacedCard): number {
    return rotationToAngle(placedCard.rotation)
  }

  protected createCurrentCardHighlight(): Phaser.GameObjects.GameObject {
    const cx = CARD_WIDTH / 2
    const cy = CARD_HEIGHT / 2
    const points = calculateHexagonPoints(cx, cy, CARD_HEIGHT / 2)
    const currentCardHighlight = new Phaser.GameObjects.Polygon(this, 0, 0, points)
    currentCardHighlight.setStrokeStyle(4, HIGHLIGHT_COLOUR)
    return currentCardHighlight
  }

  protected createScoringHighlights(currentPossibleMove: PossibleMove): Phaser.GameObjects.Shape[] {
    const shapes: Phaser.GameObjects.Shape[] = []
    currentPossibleMove.matches.forEach((match: Match) => {
      match.coloursMatch && this.highlightMatchingColours(match, shapes)
      match.numbersMatch && this.highlightMatchingNumbers(match, shapes)
    })
    return shapes
  }

  protected getBoardRange(board: Board): CommonBoardRange {
    const { left, right, top, bottom } = board.getBounds()
    const numColsWide = (right - left + 2) + 6
    const numRowsHigh = (bottom - top + 1) + 3
    const width = numColsWide * COL_WIDTH
    const height = numRowsHigh * ROW_HEIGHT
    const centreX = (left - 4) * COL_WIDTH + (width / 2)
    const centreY = (top - 2) * ROW_HEIGHT + (height / 2)
    return { width, height, centreX, centreY }
  }

  private highlightMatchingColours(match: Match, shapes: Phaser.GameObjects.Shape[]): void {

    const helper = (placedCard: PlacedCard, wedgeIndex: number): void => {
      const { x: cx, y: cy } = this.getCardPosition(placedCard.row, placedCard.col)
      const wedgePoints = calculateWedgePoints(cx, cy, wedgeIndex)
      const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, wedgePoints)
      polygon.isFilled = false
      polygon.setClosePath(true)
      polygon.setOrigin(0, 0)
      polygon.setStrokeStyle(4, HIGHLIGHT_COLOUR)
      polygon.setDepth(HIGHLIGHT_DEPTH)
      this.add.existing(polygon)
      shapes.push(polygon)
    }

    helper(match.placedCard, match.wedgeIndex)
    helper(match.otherPlacedCard, match.otherWedgeIndex)
  }

  private highlightMatchingNumbers(match: Match, shapes: Phaser.GameObjects.Shape[]): void {

    const helper = (placedCard: PlacedCard, wedgeIndex: number, number: number): void => {
      const { x: cx, y: cy } = this.getCardPosition(placedCard.row, placedCard.col)
      const angleDegrees = rotationToAngle(allRotations[wedgeIndex]) - 60
      const angleRadians = Phaser.Math.DegToRad(angleDegrees)
      const cxDie = cx + DIE_OFFSET * Math.cos(angleRadians)
      const cyDie = cy + DIE_OFFSET * Math.sin(angleRadians)

      const arc = new Phaser.GameObjects.Arc(this, cxDie, cyDie, DIE_RADIUS)
      arc.setFillStyle(HIGHLIGHT_COLOUR)
      arc.setDepth(HIGHLIGHT_DEPTH)
      this.add.existing(arc)
      shapes.push(arc)

      const dots = NUMBERS_TO_DOTS.get(number)
      const dotsToPoints = calculateDiePoints(cxDie, cyDie, wedgeIndex)

      for (const dot of dots) {
        const point = dotsToPoints.get(dot)
        const arc = new Phaser.GameObjects.Arc(this, point.x, point.y, DOT_RADIUS)
        arc.setFillStyle(0x000000)
        arc.setDepth(HIGHLIGHT_DEPTH)
        this.add.existing(arc)
        shapes.push(arc)
      }
    }

    helper(match.placedCard, match.wedgeIndex, match.wedge.number)
    helper(match.otherPlacedCard, match.otherWedgeIndex, match.otherWedge.number)
  }
}
