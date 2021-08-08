import * as Phaser from 'phaser'
import log from 'loglevel'
import { Board } from './continuo-lib/board'
import { Card } from './continuo-lib/card'
import { Cell } from './continuo-lib/cell'
import { Deck } from './continuo-lib/deck'
import { Colour, Orientation, isRotated, switchOrientation } from './continuo-lib/enums'
import { evaluateCard } from './continuo-lib/evaluate'
import { PlacedCard } from './continuo-lib/placedCard'
import { PossibleMove } from './continuo-lib/possibleMove'
import { PlayerType } from './turnManager'

const CELL_SIZE = 28 * 2
const GAP_SIZE = 2
const CARD_SIZE = 4 * CELL_SIZE + 3 * GAP_SIZE
const QUARTER_CARD_SIZE = CARD_SIZE / 4
const EIGHTH_CARD_SIZE = CARD_SIZE / 8
const NUM_MARGIN_CELLS = 5

const CURRENT_CARD_DEPTH = 1
const CHAIN_HIGHLIGHTS_DEPTH = 2

const HIGHLIGHT_LINE_WIDTH = CELL_SIZE / 5
const HIGHLIGHT_COLOUR = 0xFF00FF

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

const orientationToAngle = (orientation: Orientation): number => {
  switch (orientation) {
    case Orientation.NorthSouth: return 0
    case Orientation.EastWest: return 90
  }
}

export class ContinuoBoardScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  deck: Deck
  board: Board
  possibleMoves: PossibleMove[]
  currentPossibleMove: PossibleMove
  cardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>
  currentCardContainer: Phaser.GameObjects.Container
  chainHighlights: Phaser.GameObjects.Polygon[]

  constructor(eventEmitter: Phaser.Events.EventEmitter) {
    super({ key: 'ContinuoBoardScene', active: true, visible: true })
    this.eventEmitter = eventEmitter
    this.deck = new Deck()
    this.board = Board.empty
    this.cardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()
    this.chainHighlights = []
  }

  private getCardPosition(row: number, col: number): Phaser.Geom.Point {
    const x = (col + 2) * QUARTER_CARD_SIZE
    const y = (row + 2) * QUARTER_CARD_SIZE
    return new Phaser.Geom.Point(x, y)
  }

  private getCellPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
    const y = row * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
    return new Phaser.Geom.Point(x, y)
  }

  private highlightChains(): void {
    this.currentPossibleMove.chains.forEach(chain => {
      const points = chain.cells.map(cell => this.getCellPosition(cell.row, cell.col))
      const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, points)
      polygon.isFilled = false
      polygon.setClosePath(chain.isCycle)
      polygon.setOrigin(0, 0)
      polygon.setStrokeStyle(HIGHLIGHT_LINE_WIDTH, HIGHLIGHT_COLOUR)
      polygon.setDepth(CHAIN_HIGHLIGHTS_DEPTH)
      this.add.existing(polygon)
      this.chainHighlights.push(polygon)
    })
  }

  private unhighlightChains(): void {
    this.chainHighlights.forEach(chainHighlight => chainHighlight.destroy())
    this.chainHighlights = []
  }

  private resize(): void {

    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)

    const boundaries = this.board.getBoundaries()
    const [leftMost, rightMost, topMost, bottomMost] = boundaries
    const numCellsWide = rightMost - leftMost + 1 + (2 * NUM_MARGIN_CELLS)
    const numCellsHigh = bottomMost - topMost + 1 + (2 * NUM_MARGIN_CELLS)
    const totalWidth = numCellsWide * QUARTER_CARD_SIZE
    const totalHeight = numCellsHigh * QUARTER_CARD_SIZE
    const scaleX = width / totalWidth
    const scaleY = height / totalHeight
    const scale = Math.min(scaleX, scaleY)

    log.debug('[ContinuoBoardScene#resize]', {
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

    this.tweens.add({
      targets: this.cameras.main,
      zoom: scale,
      duration: 1000,
      ease: 'Expo.Out'
    })

    const centreX = (leftMost - NUM_MARGIN_CELLS) * QUARTER_CARD_SIZE + (totalWidth / 2)
    const centreY = (topMost - NUM_MARGIN_CELLS) * QUARTER_CARD_SIZE + (totalHeight / 2)
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
    const angle = orientationToAngle(placedCard.orientation)
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
    const angle = orientationToAngle(placedCard.orientation)
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
    this.highlightChains()
    this.emitCurrentCardChange(playerType == PlayerType.Computer ? 'startComputerMove' : 'nextCard')
  }

  private placeCurrentCardFinal(playerType: PlayerType): void {
    const placedCard = this.currentPossibleMove.placedCard
    this.board = this.board.placeCard(placedCard)
    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = orientationToAngle(placedCard.orientation)
    this.currentCardContainer.remove(cardSprite)
    this.currentCardContainer.setVisible(false)
    cardSprite.setPosition(cardPosition.x, cardPosition.y)
    cardSprite.setAngle(angle)
    cardSprite.setVisible(true)
    this.unhighlightChains()
    this.emitCurrentCardChange(playerType == PlayerType.Computer ? 'endComputerMove' : 'placeCard')
    this.currentPossibleMove = null
  }

  private moveCurrentCard(possibleMove: PossibleMove): void {
    this.currentPossibleMove = possibleMove
    const placedCard = this.currentPossibleMove.placedCard
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    this.currentCardContainer.setPosition(cardPosition.x, cardPosition.y)
    this.highlightChains()
    this.emitCurrentCardChange('moveCard')
  }

  private rotateCurrentCard(angleDelta: number): void {
    const placedCard = this.currentPossibleMove.placedCard
    const newOrientation = switchOrientation(placedCard.orientation)
    const possibleMove = this.findPossibleMove(placedCard.row, placedCard.col, newOrientation)
    if (possibleMove) {
      this.eventEmitter.emit('startRotateCard')
      this.unhighlightChains()
      const toAngle = (this.currentCardContainer.angle + angleDelta) % 360
      this.tweens.add({
        targets: this.currentCardContainer,
        angle: toAngle,
        duration: 300,
        ease: 'Sine.InOut',
        onComplete: () => {
          this.currentPossibleMove = possibleMove
          this.highlightChains()
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
    this.highlightChains()
  }

  public create() {

    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    Deck.originalCards.forEach((card, index) => {
      const graphics = new Phaser.GameObjects.Graphics(this)
      drawCard(graphics, card)
      const key = `continuo-card-${index}`
      graphics.generateTexture(key, CARD_SIZE, CARD_SIZE)
      const sprite = new Phaser.GameObjects.Sprite(this, 0, 0, key)
      sprite.visible = false
      sprite.scaleX = 0.99
      sprite.scaleY = 0.99
      this.cardSpritesMap.set(card, sprite)
      this.add.existing(sprite)
    })

    const currentCardHighlight = new Phaser.GameObjects.Rectangle(this, 0, 0, CARD_SIZE, CARD_SIZE)
    currentCardHighlight.setStrokeStyle(HIGHLIGHT_LINE_WIDTH, HIGHLIGHT_COLOUR)
    this.currentCardContainer = new Phaser.GameObjects.Container(this, 0, 0, [currentCardHighlight])
    this.currentCardContainer.setVisible(false)
    this.currentCardContainer.setDepth(CURRENT_CARD_DEPTH)
    this.currentCardContainer.setSize(CARD_SIZE, CARD_SIZE)
    this.currentCardContainer.setInteractive()
    this.add.existing(this.currentCardContainer)

    this.input.setDraggable(this.currentCardContainer)

    this.input.on('dragstart', (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject) => {
      this.unhighlightChains()
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
      const orientation = this.currentPossibleMove.placedCard.orientation
      const possibleMove = this.findPossibleMove(row, col, orientation)
      if (possibleMove) {
        this.moveCurrentCard(possibleMove)
      } else {
        this.snapBackCurrentCard()
      }
    })

    this.startNewGame()
  }

  private getSnapPosition(x: number, y: number): Cell {
    const row = Math.round(y / QUARTER_CARD_SIZE)
    const col = Math.round(x / QUARTER_CARD_SIZE)
    return new Cell(row - 2, col - 2)
  }

  private findPossibleMove(row: number, col: number, orientation: Orientation): PossibleMove {
    log.debug('[ContinuoBoardScene#findPossibleMove]', { row, col, orientation })
    const possibleMovesForLogging = this.possibleMoves.map(possibleMove => {
      const placedCard = possibleMove.placedCard
      return {
        row: placedCard.row,
        col: placedCard.col,
        orientation: placedCard.orientation,
        score: possibleMove.score
      }
    })
    log.debug('[ContinuoBoardScene#findPossibleMove] possibleMoves:', possibleMovesForLogging)
    const isRotated1 = isRotated(orientation)
    for (const possibleMove of this.possibleMoves) {
      const placedCard = possibleMove.placedCard
      const isRotated2 = isRotated(placedCard.orientation)
      if (placedCard.row == row && placedCard.col == col && isRotated1 == isRotated2) {
        return possibleMove
      }
    }
    return null
  }

  private chooseRandomOrientation(): Orientation {
    return Phaser.Utils.Array.GetRandom([
      Orientation.NorthSouth,
      Orientation.EastWest
    ])
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
    this.unhighlightChains()
    this.deck.reset()
    this.board = Board.empty
    this.possibleMoves = null

    const card1 = this.deck.nextCard()
    const orientation1 = this.chooseRandomOrientation()
    const placedCard1 = new PlacedCard(card1, 0, 0, orientation1)
    this.placeInitialCard(placedCard1)

    const card2 = this.deck.nextCard()
    const move2 = this.chooseRandomBestScoreMove(evaluateCard(this.board, card2))
    this.placeInitialCard(move2.placedCard)

    this.resize()
  }

  public onRestart(): void {
    log.debug('[ContinuoBoardScene#onRestart]')
    this.startNewGame()
  }

  public onNextCard(): void {
    log.debug('[ContinuoBoardScene#onNextCard]')
    const card = this.deck.nextCard()
    this.possibleMoves = evaluateCard(this.board, card)
    const possibleMove = this.chooseRandomWorstScoreMove(this.possibleMoves)
    this.placeCurrentCardTentative(possibleMove, PlayerType.Human)
  }

  public async onComputerMove(): Promise<void> {
    log.debug('[ContinuoBoardScene#onComputerMove]')
    const card = this.deck.nextCard()
    this.possibleMoves = evaluateCard(this.board, card)
    const possibleMove = this.chooseRandomBestScoreMove(this.possibleMoves)
    this.placeCurrentCardTentative(possibleMove, PlayerType.Computer)
    await new Promise(resolve => setTimeout(resolve, 2000))
    this.placeCurrentCardFinal(PlayerType.Computer)
  }

  public onRotateCW(): void {
    log.debug('[ContinuoBoardScene#onRotateCW]')
    this.rotateCurrentCard(+90)
  }

  public onRotateCCW(): void {
    log.debug('[ContinuoBoardScene#onRotateCCW]')
    this.rotateCurrentCard(-90)
  }

  public onPlaceCard(): void {
    log.debug('[ContinuoBoardScene#onPlaceCard]')
    this.placeCurrentCardFinal(PlayerType.Human)
  }
}
