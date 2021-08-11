import * as Phaser from 'phaser'
import log from 'loglevel'
import { Board } from './hexago-lib/board'
import { Card } from './hexago-lib/card'
import { Cell } from './hexago-lib/cell'
import { Deck } from './hexago-lib/deck'
import { Colour, HexagoNumber, Rotation, allRotations, rotationRotateCW, rotationRotateCCW } from './hexago-lib/enums'
import { evaluateCard } from './hexago-lib/evaluate'
import { PlacedCard } from './hexago-lib/placedCard'
import { PossibleMove } from './hexago-lib/possibleMove'
import { Match } from './hexago-lib/match'
import { PlayerType } from './turnManager'

const TAN_30 = Math.tan(Phaser.Math.DegToRad(30))

const CARD_HEIGHT = 200
const CARD_WIDTH = CARD_HEIGHT / 2 / TAN_30

const ROW_HEIGHT = CARD_HEIGHT * 0.75
const COL_WIDTH = CARD_WIDTH * 0.5

const DIE_OFFSET = CARD_HEIGHT / 3.65
const DIE_RADIUS = CARD_HEIGHT / 9.25
const DOT_RADIUS = DIE_RADIUS / 6

const WEDGE_INDICES = [0, 1, 2, 3, 4, 5]

const CURRENT_CARD_DEPTH = 1
const MATCH_HIGHLIGHTS_DEPTH = 2

const COLOUR_MAP = new Map([
  [Colour.Red, 0xFF0000],
  [Colour.Green, 0x00FF00],
  [Colour.Blue, 0x0000FF],
  [Colour.Yellow, 0xFFFF00],
  [Colour.Orange, 0xFF8C00],
  [Colour.Purple, 0x800080]
])

const HIGHLIGHT_COLOUR = 0xFF00FF

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

export class HexagoBoardScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  deck: Deck
  board: Board
  possibleMoves: PossibleMove[]
  currentPossibleMove: PossibleMove
  cardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>
  currentCardContainer: Phaser.GameObjects.Container
  matchingColourHighlights: Phaser.GameObjects.Shape[]
  matchingNumberHighlights: Phaser.GameObjects.Shape[]

  constructor(eventEmitter: Phaser.Events.EventEmitter) {
    super('HexagoBoardScene')
    this.eventEmitter = eventEmitter
    this.deck = new Deck()
    this.board = Board.empty
    this.cardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()
    this.matchingColourHighlights = []
    this.matchingNumberHighlights = []
  }

  private getCardPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * COL_WIDTH
    const y = row * ROW_HEIGHT
    return new Phaser.Geom.Point(x, y)
  }

  private highlightMatchingColours(match: Match): void {

    const helper = (placedCard: PlacedCard, wedgeIndex: number): void => {
      const { x: cx, y: cy } = this.getCardPosition(placedCard.row, placedCard.col)
      const wedgePoints = calculateWedgePoints(cx, cy, wedgeIndex)
      const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, wedgePoints)
      polygon.isFilled = false
      polygon.setClosePath(true)
      polygon.setOrigin(0, 0)
      polygon.setStrokeStyle(4, HIGHLIGHT_COLOUR)
      polygon.setDepth(MATCH_HIGHLIGHTS_DEPTH)
      this.add.existing(polygon)
      this.matchingColourHighlights.push(polygon)
    }

    helper(match.placedCard, match.wedgeIndex)
    helper(match.otherPlacedCard, match.otherWedgeIndex)
  }

  private highlightMatchingNumbers(match: Match): void {

    const helper = (placedCard: PlacedCard, wedgeIndex: number, number: number): void => {
      const { x: cx, y: cy } = this.getCardPosition(placedCard.row, placedCard.col)
      const angleDegrees = rotationToAngle(allRotations[wedgeIndex]) - 60
      const angleRadians = Phaser.Math.DegToRad(angleDegrees)
      const cxDie = cx + DIE_OFFSET * Math.cos(angleRadians)
      const cyDie = cy + DIE_OFFSET * Math.sin(angleRadians)

      const arc = new Phaser.GameObjects.Arc(this, cxDie, cyDie, DIE_RADIUS)
      arc.setFillStyle(HIGHLIGHT_COLOUR)
      arc.setDepth(MATCH_HIGHLIGHTS_DEPTH)
      this.add.existing(arc)
      this.matchingNumberHighlights.push(arc)

      const dots = NUMBERS_TO_DOTS.get(number)
      const dotsToPoints = calculateDiePoints(cxDie, cyDie, wedgeIndex)

      for (const dot of dots) {
        const point = dotsToPoints.get(dot)
        const arc = new Phaser.GameObjects.Arc(this, point.x, point.y, DOT_RADIUS)
        arc.setFillStyle(0x000000)
        arc.setDepth(MATCH_HIGHLIGHTS_DEPTH)
        this.add.existing(arc)
        this.matchingNumberHighlights.push(arc)
      }
    }

    helper(match.placedCard, match.wedgeIndex, match.wedge.number)
    helper(match.otherPlacedCard, match.otherWedgeIndex, match.otherWedge.number)
  }

  private highlightMatches(): void {
    this.currentPossibleMove.matches.forEach((match: Match) => {
      match.coloursMatch && this.highlightMatchingColours(match)
      match.numbersMatch && this.highlightMatchingNumbers(match)
    })
  }

  private unhighlightMatchingColours(): void {
    this.matchingColourHighlights.forEach(colourHighlight => colourHighlight.destroy())
    this.matchingColourHighlights = []
  }

  private unhighlightMatchingNumbers(): void {
    this.matchingNumberHighlights.forEach(numberHighlight => numberHighlight.destroy())
    this.matchingNumberHighlights = []
  }

  private unhighlightMatches(): void {
    this.unhighlightMatchingColours()
    this.unhighlightMatchingNumbers()
  }

  private resize(noAnimation: boolean = false): void {

    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)

    const boundaries = this.board.getBoundaries()
    const [leftMost, rightMost, topMost, bottomMost] = boundaries

    const numColsWide = (rightMost - leftMost + 2) + 6
    const numRowsHigh = (bottomMost - topMost + 1) + 3

    const totalWidth = numColsWide * COL_WIDTH
    const totalHeight = numRowsHigh * ROW_HEIGHT
    const scaleX = width / totalWidth
    const scaleY = height / totalHeight
    const scale = Math.min(scaleX, scaleY)

    log.debug('[HexagoBoardScene#resize]', {
      width,
      height,
      numCellsWide: numColsWide,
      numCellsHigh: numRowsHigh,
      totalWidth,
      totalHeight,
      scaleX,
      scaleY,
      scale,
      boundaries
    })

    if (noAnimation) {
      this.cameras.main.zoom = scale
    } else {
      this.tweens.add({
        targets: this.cameras.main,
        zoom: scale,
        duration: 1000,
        ease: 'Expo.Out'
      })
    }

    const centreX = (leftMost - 4) * COL_WIDTH + (totalWidth / 2)
    const centreY = (topMost - 2) * ROW_HEIGHT + (totalHeight / 2)

    this.cameras.main.centerOn(centreX, centreY)
  }

  private emitCurrentCardChange(eventName: string): void {
    if (this.possibleMoves) {
      const numCardsLeft = this.deck.numCardsLeft
      const score = this.currentPossibleMove.score
      const bestScore = this.possibleMoves[0].score
      const bestScoreLocationCount = this.possibleMoves.filter(({ score }) => score == bestScore).length
      this.eventEmitter.emit(eventName, { numCardsLeft, score, bestScore, bestScoreLocationCount })
    }
  }

  private placeInitialCard(placedCard: PlacedCard): void {
    this.board = this.board.placeCard(placedCard)
    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = rotationToAngle(placedCard.rotation)
    cardSprite.setPosition(cardPosition.x, cardPosition.y)
    cardSprite.setAngle(angle)
    cardSprite.setVisible(true)
    this.currentCardContainer.remove(cardSprite)
  }

  private placeCurrentCardTentative(possibleMove: PossibleMove, playerType: PlayerType): void {
    this.currentPossibleMove = possibleMove
    const placedCard = this.currentPossibleMove.placedCard
    const savedBoard = this.board
    this.board = this.board.placeCard(placedCard)
    this.resize()
    this.board = savedBoard
    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = rotationToAngle(placedCard.rotation)
    cardSprite.setPosition(0, 0)
    cardSprite.setAngle(0)
    cardSprite.setVisible(true)
    this.currentCardContainer.addAt(cardSprite, 0)
    this.currentCardContainer.setPosition(cardPosition.x, cardPosition.y)
    this.currentCardContainer.setAngle(angle)
    this.currentCardContainer.setVisible(true)
    if (playerType == PlayerType.Human) {
      this.currentCardContainer.setInteractive()
    } else {
      this.currentCardContainer.disableInteractive()
    }
    this.highlightMatches()
    this.emitCurrentCardChange(playerType == PlayerType.Computer ? 'startComputerMove' : 'nextCard')
  }

  private placeCurrentCardFinal(playerType: PlayerType): void {
    const placedCard = this.currentPossibleMove.placedCard
    this.board = this.board.placeCard(placedCard)
    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = rotationToAngle(placedCard.rotation)
    this.currentCardContainer.remove(cardSprite)
    this.currentCardContainer.setVisible(false)
    cardSprite.setPosition(cardPosition.x, cardPosition.y)
    cardSprite.setAngle(angle)
    cardSprite.setVisible(true)
    this.unhighlightMatches()
    this.emitCurrentCardChange(playerType == PlayerType.Computer ? 'endComputerMove' : 'placeCard')
    this.currentPossibleMove = null
  }

  private moveCurrentCard(possibleMove: PossibleMove): void {
    this.currentPossibleMove = possibleMove
    const placedCard = this.currentPossibleMove.placedCard
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    this.currentCardContainer.setPosition(cardPosition.x, cardPosition.y)
    this.highlightMatches()
    this.emitCurrentCardChange('moveCard')
  }

  private rotateCurrentCard(angleDelta: number): void {
    const placedCard = this.currentPossibleMove.placedCard
    const newOrientation = angleDelta > 0
      ? rotationRotateCW(placedCard.rotation)
      : rotationRotateCCW(placedCard.rotation)
    const possibleMove = this.findPossibleMove(placedCard.row, placedCard.col, newOrientation)
    if (possibleMove) {
      this.eventEmitter.emit('startRotateCard')
      this.unhighlightMatches()
      const toAngle = (this.currentCardContainer.angle + angleDelta) % 360
      this.tweens.add({
        targets: this.currentCardContainer,
        angle: toAngle,
        duration: 300,
        ease: 'Sine.InOut',
        onComplete: () => {
          this.currentPossibleMove = possibleMove
          this.highlightMatches()
          this.emitCurrentCardChange('endRotateCard')
        }
      })
    }
  }

  private snapBackCurrentCard(): void {
    const placedCard = this.currentPossibleMove.placedCard
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    // TODO: animate the position change ?
    this.currentCardContainer.setPosition(cardPosition.x, cardPosition.y)
    this.highlightMatches()
  }

  public init() {
    log.debug('[HexagoBoardScene#init]')
  }

  public create() {
    log.debug('[HexagoBoardScene#create]')

    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    Deck.originalCards.forEach((card, index) => {
      const graphics = new Phaser.GameObjects.Graphics(this)
      drawCard(graphics, card)
      const key = `hexago-card-${index}`
      graphics.generateTexture(key, CARD_WIDTH, CARD_HEIGHT)
      const sprite = new Phaser.GameObjects.Sprite(this, 0, 0, key)
      sprite.visible = false
      sprite.scaleX = 0.99
      sprite.scaleY = 0.99
      this.cardSpritesMap.set(card, sprite)
      this.add.existing(sprite)
    })

    const cx = CARD_WIDTH / 2
    const cy = CARD_HEIGHT / 2
    const points = calculateHexagonPoints(cx, cy, CARD_HEIGHT / 2)
    const currentCardHighlight = new Phaser.GameObjects.Polygon(this, 0, 0, points)
    currentCardHighlight.setStrokeStyle(4, HIGHLIGHT_COLOUR)
    this.currentCardContainer = new Phaser.GameObjects.Container(this, 0, 0, [currentCardHighlight])
    this.currentCardContainer.setVisible(false)
    this.currentCardContainer.setDepth(CURRENT_CARD_DEPTH)
    this.currentCardContainer.setSize(CARD_WIDTH, CARD_HEIGHT)
    this.currentCardContainer.setInteractive()
    this.add.existing(this.currentCardContainer)

    this.input.setDraggable(this.currentCardContainer)

    this.input.on('dragstart', (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject) => {
      this.unhighlightMatches()
    })

    this.input.on('drag', (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject,
      dragX: number,
      dragY: number) => {
      this.currentCardContainer.x = dragX
      this.currentCardContainer.y = dragY
    })

    this.input.on('dragend', (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject) => {
      const { row, col } = this.getSnapPosition(this.currentCardContainer.x, this.currentCardContainer.y)
      const placedCard = this.currentPossibleMove
      const possibleMove = this.findPossibleMove(row, col, placedCard.placedCard.rotation)
      if (possibleMove) {
        this.moveCurrentCard(possibleMove)
      } else {
        this.snapBackCurrentCard()
      }
    })

    this.events.on('wake', this.onWake, this)
  }

  private getSnapPosition(x: number, y: number): Cell {
    const row = Math.round(y / ROW_HEIGHT)
    const col = Math.round(x / COL_WIDTH)
    return new Cell(row, col)
  }

  private findPossibleMove(row: number, col: number, rotation: Rotation): PossibleMove {
    log.debug('[HexagoBoardScene#findPossibleMove]', { row, col, rotation })
    const possibleMovesForLogging = this.possibleMoves.map(possibleMove => {
      const placedCard = possibleMove.placedCard
      return {
        row: placedCard.row,
        col: placedCard.col,
        rotation: placedCard.rotation,
        score: possibleMove.score
      }
    })
    log.debug('[HexagoBoardScene#findPossibleMove] possibleMoves:', possibleMovesForLogging)
    for (const possibleMove of this.possibleMoves) {
      const placedCard = possibleMove.placedCard
      if (placedCard.row == row && placedCard.col == col && placedCard.rotation == rotation) {
        return possibleMove
      }
    }
    return null
  }

  private chooseRandomBestScoreMove(possibleMoves: PossibleMove[]): PossibleMove {
    const bestScore = possibleMoves[0].score
    const bestScoreMoves = possibleMoves.filter(possibleMove => possibleMove.score == bestScore)
    return Phaser.Utils.Array.GetRandom(bestScoreMoves)
  }

  private chooseRandomWorstScoreMove(possibleMoves: PossibleMove[]): PossibleMove {
    const worstScore = possibleMoves.slice(-1)[0].score
    const worstScoreMoves = possibleMoves.filter(possibleMove => possibleMove.score == worstScore)
    return Phaser.Utils.Array.GetRandom(worstScoreMoves)
  }

  private startNewGame(): void {

    this.cardSpritesMap.forEach(cardSprite => cardSprite.setVisible(false))
    this.currentCardContainer.setVisible(false)
    this.unhighlightMatches()
    this.deck.reset()
    this.board = Board.empty
    this.possibleMoves = []
    this.currentPossibleMove = null

    const card1 = this.deck.nextCard()
    const rotation1 = findRotationWhereSixIsAtWedgeIndex(card1, 1)
    const placedCard1 = new PlacedCard(card1, 0, 0, rotation1)
    this.placeInitialCard(placedCard1)

    const card2 = this.deck.nextCard()
    const rotation2 = findRotationWhereSixIsAtWedgeIndex(card2, 4)
    const placedCard2 = new PlacedCard(card2, 0, 2, rotation2)
    this.placeInitialCard(placedCard2)

    this.resize()
  }

  private onWake() {
    log.debug('[HexagoBoardScene#onWake]')
    this.startNewGame()
  }

  public onRestart(): void {
    log.debug('[HexagoBoardScene#onRestart]')
    this.startNewGame()
  }

  public onNextCard(): void {
    log.debug('[HexagoBoardScene#onNextCard]')
    const card = this.deck.nextCard()
    this.possibleMoves = evaluateCard(this.board, card)
    const possibleMove = this.chooseRandomWorstScoreMove(this.possibleMoves)
    this.placeCurrentCardTentative(possibleMove, PlayerType.Human)
  }

  public async onComputerMove(): Promise<void> {
    log.debug('[HexagoBoardScene#onComputerMove]')
    const card = this.deck.nextCard()
    this.possibleMoves = evaluateCard(this.board, card)
    const possibleMove = this.chooseRandomBestScoreMove(this.possibleMoves)
    this.placeCurrentCardTentative(possibleMove, PlayerType.Computer)
    await new Promise(resolve => setTimeout(resolve, 2000))
    this.placeCurrentCardFinal(PlayerType.Computer)
  }

  public onRotateCW(): void {
    log.debug('[HexagoBoardScene#onRotateCW]')
    this.rotateCurrentCard(+60)
  }

  public onRotateCCW(): void {
    log.debug('[HexagoBoardScene#onRotateCCW]')
    this.rotateCurrentCard(-60)
  }

  public onPlaceCard(): void {
    log.debug('[HexagoBoardScene#onPlaceCard]')
    this.placeCurrentCardFinal(PlayerType.Human)
  }
}
