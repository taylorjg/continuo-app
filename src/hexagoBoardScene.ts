import * as Phaser from 'phaser'
import log from 'loglevel'
import { Board } from './hexago-lib/board'
import { Card } from './hexago-lib/card'
import { Cell } from './hexago-lib/cell'
import { Deck } from './hexago-lib/deck'
import { Colour, HexagoNumber, Rotation } from './hexago-lib/enums'
import { evaluateCard } from './hexago-lib/evaluate'
import { PlacedCard } from './hexago-lib/placedCard'
import { PossibleMove } from './hexago-lib/possibleMove'
import { Wedge } from './hexago-lib/wedge'

const TAN_30_DEGREES = Math.tan(30 * Math.PI / 180)
const CARD_HEIGHT = 200
// const CARD_WIDTH = CARD_HEIGHT / 4 / TAN_30_DEGREES * 2
const CARD_WIDTH = CARD_HEIGHT / 2 / TAN_30_DEGREES

const NUM_MARGIN_CARDS = 1

// const CURRENT_CARD_DEPTH = 1
// const CHAIN_HIGHLIGHTS_DEPTH = 2

const COLOUR_MAP = new Map([
  [Colour.Red, 0xFF0000],
  [Colour.Green, 0x00FF00],
  [Colour.Blue, 0x0000FF],
  [Colour.Yellow, 0xFFFF00],
  [Colour.Orange, 0xFF8C00],
  [Colour.Purple, 0x800080]
])

// const CURRENT_CARD_HIGHLIGHT_COLOUR = 0xFF00FF
// const CHAIN_HIGHLIGHT_COLOUR = 0xFF00FF

// https://www.quora.com/How-can-you-find-the-coordinates-in-a-hexagon
const calculateHexagonPoints = (cx: number, cy: number, a: number): Phaser.Geom.Point[] => {
  let b = a / Math.tan(30 * Math.PI / 180)
  return [
    new Phaser.Geom.Point(cx, cy - (2 * a)),
    new Phaser.Geom.Point(cx + b, cy - a),
    new Phaser.Geom.Point(cx + b, cy + a),
    new Phaser.Geom.Point(cx, cy + (2 * a)),
    new Phaser.Geom.Point(cx - b, cy + a),
    new Phaser.Geom.Point(cx - b, cy - a)
  ]
}

const drawCard = (graphics: Phaser.GameObjects.Graphics, card: Card): void => {

  const cx = CARD_WIDTH / 2
  const cy = CARD_HEIGHT / 2

  const outerPoints = calculateHexagonPoints(cx, cy, CARD_HEIGHT / 4)
  graphics.fillStyle(0x000000)
  graphics.fillPoints(outerPoints, true)

  const innerPoints = calculateHexagonPoints(cx, cy, CARD_HEIGHT / 4 - 3)

  for (const wedgeIndex of [0, 1, 2, 3, 4, 5]) {
    const wedge = card.wedgeAt(wedgeIndex, Rotation.Rotation0)
    const colour = COLOUR_MAP.get(wedge.colour)
    graphics.fillStyle(colour)
    graphics.lineStyle(1, 0x000000)
    const wedgePoints = []
    wedgePoints.push(innerPoints[wedgeIndex])
    wedgePoints.push(innerPoints[(wedgeIndex + 1) % 6])
    wedgePoints.push(new Phaser.Geom.Point(cx, cy))
    graphics.fillPoints(wedgePoints, true)
    graphics.lineStyle(2, 0x000000)
    graphics.strokePoints(wedgePoints, true)
  }
}

const allRotations = [
  Rotation.Rotation0,
  Rotation.Rotation60,
  Rotation.Rotation120,
  Rotation.Rotation180,
  Rotation.Rotation240,
  Rotation.Rotation300
]

const findRotation = (
  card: Card,
  predicate: (card: Card, rotation: Rotation) => boolean): Rotation => {
  for (const rotation of allRotations) {
    if (predicate(card, rotation)) {
      return rotation
    }
  }
  throw new Error('[findRotation] predicate returned false for all rotations')
}

const findWedgeIndex = (
  card: Card,
  rotation: Rotation,
  predicate: (card: Card, wedge: Wedge) => boolean): number => {
  for (const wedgeIndex of [0, 1, 2, 3, 4, 5]) {
    const wedge = card.wedgeAt(wedgeIndex, rotation)
    if (predicate(card, wedge)) {
      return wedgeIndex
    }
  }
  throw new Error('[findWedgeIndex] predicate returned false for all wedges')
}

const findRotationWhereSixIsAtWedgeIndex = (card: Card, wedgeIndex: number): Rotation =>
  findRotation(card, (_: Card, rotation: Rotation) =>
    findWedgeIndex(card, rotation, (_: Card, wedge: Wedge) =>
      wedge.number == HexagoNumber.Number6) == wedgeIndex)

const rotationRotateCW = (rotation: Rotation): Rotation => {
  switch (rotation) {
    case Rotation.Rotation0: return Rotation.Rotation60
    case Rotation.Rotation60: return Rotation.Rotation120
    case Rotation.Rotation120: return Rotation.Rotation180
    case Rotation.Rotation180: return Rotation.Rotation240
    case Rotation.Rotation240: return Rotation.Rotation300
    case Rotation.Rotation300: return Rotation.Rotation0
  }
}

const rotationRotateCCW = (rotation: Rotation): Rotation => {
  switch (rotation) {
    case Rotation.Rotation0: return Rotation.Rotation300
    case Rotation.Rotation60: return Rotation.Rotation0
    case Rotation.Rotation120: return Rotation.Rotation60
    case Rotation.Rotation180: return Rotation.Rotation120
    case Rotation.Rotation240: return Rotation.Rotation180
    case Rotation.Rotation300: return Rotation.Rotation240
  }
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

  deck: Deck
  board: Board
  cardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>
  currentCard: PlacedCard
  possibleMoves: PossibleMove[]
  currentPossibleMove: PossibleMove
  currentCardContainer: Phaser.GameObjects.Container
  // chainHighlights: Phaser.GameObjects.Polygon[]

  constructor() {
    super({
      active: false,
      visible: false,
      key: 'HexagoBoardScene'
    })
    this.deck = new Deck()
    this.board = Board.empty
    this.cardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()
    // this.chainHighlights = []
  }

  private getCardPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * CARD_WIDTH + CARD_WIDTH / 2
    const y = row * CARD_HEIGHT + CARD_HEIGHT / 2
    return new Phaser.Geom.Point(x, y)
  }

  // private getCellPosition(row: number, col: number): Phaser.Geom.Point {
  //   const x = col * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
  //   const y = row * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
  //   return new Phaser.Geom.Point(x, y)
  // }

  // private highlightChains(): void {
  //   this.currentPossibleMove.chains.forEach(chain => {
  //     const points = chain.cells.map(cell => this.getCellPosition(cell.row, cell.col))
  //     const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, points)
  //     polygon.isFilled = false
  //     polygon.setClosePath(chain.isCycle)
  //     polygon.setOrigin(0, 0)
  //     polygon.setStrokeStyle(CHAIN_HIGHLIGHTS_LINE_WIDTH, CHAIN_HIGHLIGHT_COLOUR)
  //     polygon.setDepth(CHAIN_HIGHLIGHTS_DEPTH)
  //     this.add.existing(polygon)
  //     this.chainHighlights.push(polygon)
  //   })
  // }

  // private unhighlightChains(): void {
  //   this.chainHighlights.forEach(chainHighlight => chainHighlight.destroy())
  //   this.chainHighlights = []
  // }

  private resize(noAnimation: boolean = false): void {

    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)

    const boundaries = this.board.getBoundaries()
    const [leftMost, rightMost, topMost, bottomMost] = boundaries
    const numCellsWide = rightMost - leftMost + 1 + (2 * NUM_MARGIN_CARDS)
    const numCellsHigh = bottomMost - topMost + 1 + (2 * NUM_MARGIN_CARDS)
    const totalWidth = numCellsWide * CARD_WIDTH
    const totalHeight = numCellsHigh * CARD_HEIGHT
    const scaleX = width / totalWidth
    const scaleY = height / totalHeight
    const scale = Math.min(scaleX, scaleY)

    log.debug('[HexagoBoardScene#resize]', {
      width,
      height,
      numCellsWide,
      numCellsHigh,
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

    const centreX = (leftMost - NUM_MARGIN_CARDS) * CARD_WIDTH + (totalWidth / 2)
    const centreY = (topMost - NUM_MARGIN_CARDS) * CARD_HEIGHT + (totalHeight / 2)
    this.cameras.main.centerOn(centreX, centreY)
  }

  private placeCard(possibleMove: PossibleMove, addToBoard: boolean, noAnimation: boolean, noResize: boolean): void {

    const placedCard = possibleMove.placedCard

    if (addToBoard) {
      this.board = this.board.placeCard(placedCard)
      if (!noResize) {
        this.resize(noAnimation)
      }
    } else {
      if (!noResize) {
        const savedBoard = this.board
        this.board = this.board.placeCard(placedCard)
        this.resize(noAnimation)
        this.board = savedBoard
      }
    }

    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = rotationToAngle(placedCard.rotation)

    if (addToBoard) {
      this.currentCardContainer.remove(cardSprite)
      this.currentCardContainer.setVisible(false)
      cardSprite.setPosition(cardPosition.x, cardPosition.y)
      cardSprite.setAngle(angle)
      cardSprite.setVisible(true)
      // this.unhighlightChains()
    } else {
      cardSprite.setPosition(0, 0)
      cardSprite.setAngle(0)
      cardSprite.setVisible(true)
      this.currentCardContainer.add(cardSprite)
      this.currentCardContainer.moveTo(cardSprite, 0)
      this.currentCardContainer.setPosition(cardPosition.x, cardPosition.y)
      this.currentCardContainer.setAngle(angle)
      this.currentCardContainer.setVisible(true)
      // this.highlightChains()
    }
  }

  public create() {

    window.addEventListener('resize', () => {
      this.resize()
    })

    this.scale.on('orientationchange', () => {
      this.resize()
    })

    Deck.originalCards.forEach((card, index) => {
      const graphics = new Phaser.GameObjects.Graphics(this)
      drawCard(graphics, card)
      const key = `card-${index}`
      graphics.generateTexture(key, CARD_WIDTH, CARD_HEIGHT)
      const sprite = new Phaser.GameObjects.Sprite(this, 0, 0, key)
      sprite.visible = false
      sprite.scaleX = 0.99
      sprite.scaleY = 0.99
      this.cardSpritesMap.set(card, sprite)
      this.add.existing(sprite)
    })

    // const currentCardHighlight = new Phaser.GameObjects.Rectangle(this, 0, 0, CARD_SIZE, CARD_SIZE)
    // currentCardHighlight.setStrokeStyle(CURRENT_CARD_HIGHLIGHT_LINE_WIDTH, CURRENT_CARD_HIGHLIGHT_COLOUR)
    // this.currentCardContainer = new Phaser.GameObjects.Container(this, 0, 0, [currentCardHighlight])
    this.currentCardContainer = new Phaser.GameObjects.Container(this, 0, 0)
    this.currentCardContainer.setVisible(false)
    // this.currentCardContainer.setDepth(CURRENT_CARD_DEPTH)
    this.currentCardContainer.setSize(CARD_WIDTH, CARD_HEIGHT)
    this.currentCardContainer.setInteractive()
    this.add.existing(this.currentCardContainer)

    this.input.setDraggable(this.currentCardContainer)

    this.input.on('dragstart', (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject) => {
      // this.unhighlightChains()
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
        this.currentPossibleMove = possibleMove
        this.placeCard(possibleMove, false, false, true)
      } else {
        this.placeCard(this.currentPossibleMove, false, false, true)
      }
    })

    this.startNewGame()
  }

  private getSnapPosition(x: number, y: number): Cell {
    const row = Math.round(y / CARD_HEIGHT)
    const col = Math.round(x / CARD_WIDTH)
    return new Cell(row, col)
  }

  private findPossibleMove(row: number, col: number, rotation: Rotation): PossibleMove {
    log.debug('[findPossibleMove]', { row, col, rotation })
    log.debug('[findPossibleMove] this.possibleMoves:')
    this.possibleMoves.forEach(pm => {
      const pc = pm.placedCard
      log.debug('  ', { row: pc.row, col: pc.col, rotation: pc.rotation, score: pm.score })
    })
    for (const possibleMove of this.possibleMoves) {
      const placedCard = possibleMove.placedCard
      if (placedCard.row == row && placedCard.col == col && placedCard.rotation == rotation) {
        return possibleMove
      }
    }
    return null
  }

  // private chooseRandomRotation(): Rotation {
  //   return Phaser.Utils.Array.GetRandom(allRotations)
  // }

  // private chooseRandomBestScoreMove(possibleMoves: PossibleMove[]): PossibleMove {
  //   const bestScore = possibleMoves[0].score
  //   const bestScoreMoves = possibleMoves.filter(possibleMove => possibleMove.score == bestScore)
  //   return Phaser.Utils.Array.GetRandom(bestScoreMoves)
  // }

  private chooseRandomWorstScoreMove(possibleMoves: PossibleMove[]): PossibleMove {
    const worstScore = possibleMoves.slice(-1)[0].score
    const worstScoreMoves = possibleMoves.filter(possibleMove => possibleMove.score == worstScore)
    return Phaser.Utils.Array.GetRandom(worstScoreMoves)
  }

  private startNewGame(): void {

    this.cardSpritesMap.forEach(cardSprite => cardSprite.setVisible(false))
    this.currentCardContainer.setVisible(false)
    // this.unhighlightChains()
    this.deck.reset()
    this.board = Board.empty

    const card1 = this.deck.nextCard()
    const rotation1 = findRotationWhereSixIsAtWedgeIndex(card1, 1)
    const placedCard1 = new PlacedCard(card1, 0, 0, rotation1)
    const move1 = new PossibleMove(placedCard1, [])
    this.placeCard(move1, true /* addToBoard */, true /* noAnimation */, false /* noResize */)

    const card2 = this.deck.nextCard()
    const rotation2 = findRotationWhereSixIsAtWedgeIndex(card2, 4)
    const placedCard2 = new PlacedCard(card2, 0, 1, rotation2)
    const move2 = new PossibleMove(placedCard2, [])
    this.placeCard(move2, true /* addToBoard */, true /* noAnimation */, false /* noResize */)
  }

  private rotateCommon(angleDelta: number): void {
    const placedCard = this.currentPossibleMove.placedCard
    const newOrientation = angleDelta > 0
      ? rotationRotateCW(placedCard.rotation)
      : rotationRotateCCW(placedCard.rotation)
    const possibleMove = this.findPossibleMove(placedCard.row, placedCard.col, newOrientation)
    if (possibleMove) {
      // this.unhighlightChains()
      const toAngle = (this.currentCardContainer.angle + angleDelta) % 360
      this.tweens.add({
        targets: this.currentCardContainer,
        angle: toAngle,
        duration: 500,
        ease: 'Sine.InOut',
        onComplete: () => {
          this.currentPossibleMove = possibleMove
          // this.highlightChains()
        }
      })
    }
  }

  public onRestart(): void {
    log.debug('[HexagoBoardScene#onRestart]')
    this.startNewGame()
  }

  public onNextCard(): void {
    log.debug('[HexagoBoardScene#onNextCard]')
    const card = this.deck.nextCard()
    this.possibleMoves = evaluateCard(this.board, card)
    this.currentPossibleMove = this.chooseRandomWorstScoreMove(this.possibleMoves)
    this.placeCard(this.currentPossibleMove, false /* addToBoard */, false /* noAnimation */, false /* noResize */)
  }

  public onRotateCW(): void {
    log.debug('[HexagoBoardScene#onRotateCW]')
    this.rotateCommon(+60)
  }

  public onRotateCCW(): void {
    log.debug('[HexagoBoardScene#onRotateCCW]')
    this.rotateCommon(-60)
  }

  public onPlaceCard(): number {
    log.debug('[HexagoBoardScene#onPlaceCard]')
    this.placeCard(this.currentPossibleMove, true /* addToBoard */, false /* noAnimation */, true /* noResize */)
    return this.deck.numCardsLeft
  }
}
