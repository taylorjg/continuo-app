import * as Phaser from 'phaser'
import log from 'loglevel'

import {
  CommonAdapter,
  CommonBoard,
  CommonBoardRange,
  CommonCard,
  CommonCell,
  CommonDeck,
  CommonPlacedCard,
  CommonPossibleMove
} from './types'

import { PlayerType } from './turnManager'

export const CURRENT_CARD_DEPTH = 1
export const HIGHLIGHT_DEPTH = 2

export type BoardSceneConfig = {
  eventEmitter: Phaser.Events.EventEmitter,
  CARD_WIDTH: number,
  CARD_HEIGHT: number,
  ROTATION_ANGLE: number
}

export abstract class BoardScene extends Phaser.Scene {

  private boardSceneConfig: BoardSceneConfig
  private adapter: CommonAdapter
  private deck: CommonDeck
  private board: CommonBoard
  private possibleMoves: CommonPossibleMove[]
  private currentPossibleMove: CommonPossibleMove
  private cardSpritesMap: Map<CommonCard, Phaser.GameObjects.Sprite>
  private currentCardContainer: Phaser.GameObjects.Container
  private scoringComponentHighlights: Phaser.GameObjects.Shape[]

  constructor(sceneName: string, boardSceneConfig: BoardSceneConfig, adapter: CommonAdapter) {
    super(sceneName)
    this.boardSceneConfig = boardSceneConfig
    this.adapter = adapter
    this.deck = this.adapter.createDeck()
    this.board = this.adapter.emptyBoard
    this.cardSpritesMap = new Map<CommonCard, Phaser.GameObjects.Sprite>()
    this.scoringComponentHighlights = []
  }

  protected abstract getInitialPlacedCards(deck: CommonDeck, board: CommonBoard): Generator<CommonPlacedCard, void, CommonBoard>
  protected abstract getCardPosition(row: number, col: number): Phaser.Geom.Point
  protected abstract getSnapPosition(x: number, y: number): CommonCell
  protected abstract drawCard(graphics: Phaser.GameObjects.Graphics, card: CommonCard): void
  protected abstract getPlacedCardRotationAngle(placedCard: CommonPlacedCard): number
  protected abstract createCurrentCardHighlight(): Phaser.GameObjects.GameObject
  protected abstract createScoringComponentHighlights(currentPossibleMove: CommonPossibleMove): Phaser.GameObjects.Shape[]
  protected abstract getBoardRange(board: CommonBoard): CommonBoardRange

  private highlightScoringComponents(currentPossibleMove: CommonPossibleMove): void {
    this.scoringComponentHighlights = this.createScoringComponentHighlights(currentPossibleMove)
    this.scoringComponentHighlights.forEach(highlight => this.add.existing(highlight))
  }

  private unhighlightScoringComponents(): void {
    this.scoringComponentHighlights.forEach(highlight => highlight.destroy())
    this.scoringComponentHighlights = []
  }

  private emitCurrentCardChange(eventName: string): void {
    if (this.possibleMoves) {
      const numCardsLeft = this.deck.numCardsLeft
      const score = this.currentPossibleMove.score
      const bestScore = this.possibleMoves[0].score
      const bestScoreLocationCount = this.possibleMoves.filter(({ score }) => score == bestScore).length
      this.boardSceneConfig.eventEmitter.emit(eventName, { numCardsLeft, score, bestScore, bestScoreLocationCount })
    }
  }

  private placeInitialCard(placedCard: CommonPlacedCard): void {
    this.board = this.board.placeCard(placedCard)
    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = this.getPlacedCardRotationAngle(placedCard)
    cardSprite.setPosition(cardPosition.x, cardPosition.y)
    cardSprite.setAngle(angle)
    cardSprite.setVisible(true)
    this.currentCardContainer.remove(cardSprite)
  }

  private placeCurrentCardTentative(possibleMove: CommonPossibleMove, playerType: PlayerType): void {
    this.currentPossibleMove = possibleMove
    const placedCard = this.currentPossibleMove.placedCard
    const savedBoard = this.board
    this.board = this.board.placeCard(placedCard)
    this.resize()
    this.board = savedBoard
    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = this.getPlacedCardRotationAngle(placedCard)
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
    this.highlightScoringComponents(this.currentPossibleMove)
    this.emitCurrentCardChange(playerType == PlayerType.Computer ? 'startComputerMove' : 'nextCard')
  }

  private placeCurrentCardFinal(playerType: PlayerType): void {
    const placedCard = this.currentPossibleMove.placedCard
    this.board = this.board.placeCard(placedCard)
    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = this.getPlacedCardRotationAngle(placedCard)
    this.currentCardContainer.remove(cardSprite)
    this.currentCardContainer.setVisible(false)
    cardSprite.setPosition(cardPosition.x, cardPosition.y)
    cardSprite.setAngle(angle)
    cardSprite.setVisible(true)
    this.unhighlightScoringComponents()
    this.emitCurrentCardChange(playerType == PlayerType.Computer ? 'endComputerMove' : 'placeCard')
    this.currentPossibleMove = null
  }

  private moveCurrentCard(possibleMove: CommonPossibleMove): void {
    this.currentPossibleMove = possibleMove
    const placedCard = this.currentPossibleMove.placedCard
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    this.currentCardContainer.setPosition(cardPosition.x, cardPosition.y)
    this.highlightScoringComponents(this.currentPossibleMove)
    this.emitCurrentCardChange('moveCard')
  }

  private rotateCurrentCard(rotationAngle: number): void {
    const newPlacedCard = rotationAngle > 0
      ? this.adapter.placedCardRotateCW(this.currentPossibleMove.placedCard)
      : this.adapter.placedCardRotateCCW(this.currentPossibleMove.placedCard)
    const possibleMove = this.findPossibleMove(newPlacedCard)
    if (possibleMove) {
      this.boardSceneConfig.eventEmitter.emit('startRotateCard')
      this.unhighlightScoringComponents()
      this.tweens.add({
        targets: this.currentCardContainer,
        angle: this.currentCardContainer.angle + rotationAngle,
        duration: 300,
        ease: 'Sine.InOut',
        onComplete: () => {
          this.currentPossibleMove = possibleMove
          this.highlightScoringComponents(this.currentPossibleMove)
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
    this.highlightScoringComponents(this.currentPossibleMove)
  }

  public init() {
    log.debug('[BoardScene#init]')
  }

  public create() {
    log.debug('[BoardScene#create]')

    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    const { CARD_WIDTH, CARD_HEIGHT } = this.boardSceneConfig

    this.adapter.originalCards.forEach((card, index) => {
      const graphics = new Phaser.GameObjects.Graphics(this)
      this.drawCard(graphics, card)
      const key = `${this.scene.key}-card-${index}`
      graphics.generateTexture(key, CARD_WIDTH, CARD_HEIGHT)
      const sprite = new Phaser.GameObjects.Sprite(this, 0, 0, key)
      sprite.visible = false
      sprite.scaleX = 0.99
      sprite.scaleY = 0.99
      this.cardSpritesMap.set(card, sprite)
      this.add.existing(sprite)
    })

    const currentCardHighlight = this.createCurrentCardHighlight()

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
      this.unhighlightScoringComponents()
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
      const newPlacedCard = this.adapter.placedCardMoveTo(this.currentPossibleMove.placedCard, row, col)
      const possibleMove = this.findPossibleMove(newPlacedCard)
      if (possibleMove) {
        this.moveCurrentCard(possibleMove)
      } else {
        this.snapBackCurrentCard()
      }
    })

    this.events.on('wake', this.onWake, this)
  }

  private findPossibleMove(placedCard: CommonPlacedCard): CommonPossibleMove {
    log.debug('[BoardScene#findPossibleMove] placedCard:', placedCard)
    log.debug('[BoardScene#findPossibleMove] possibleMoves:', this.possibleMoves)
    for (const possibleMove of this.possibleMoves) {
      if (this.adapter.placedCardsHaveSamePlacement(possibleMove.placedCard, placedCard)) {
        return possibleMove
      }
    }
    return null
  }

  protected chooseRandomBestScoreMove(possibleMoves: CommonPossibleMove[]): CommonPossibleMove {
    const bestScore = possibleMoves[0].score
    const bestScoreMoves = possibleMoves.filter(possibleMove => possibleMove.score == bestScore)
    return Phaser.Utils.Array.GetRandom(bestScoreMoves)
  }

  protected chooseRandomWorstScoreMove(possibleMoves: CommonPossibleMove[]): CommonPossibleMove {
    const worstScore = possibleMoves.slice(-1)[0].score
    const worstScoreMoves = possibleMoves.filter(possibleMove => possibleMove.score == worstScore)
    return Phaser.Utils.Array.GetRandom(worstScoreMoves)
  }

  private startNewGame(): void {

    this.cardSpritesMap.forEach(cardSprite => cardSprite.setVisible(false))
    this.currentCardContainer.setVisible(false)
    this.unhighlightScoringComponents()
    this.deck.reset()
    this.board = this.adapter.emptyBoard
    this.possibleMoves = []
    this.currentPossibleMove = null

    const iter = this.getInitialPlacedCards(this.deck, this.board)

    for (let curr = iter.next(); curr.value; curr = iter.next(this.board)) {
      this.placeInitialCard(curr.value)
    }

    this.resize()
  }

  protected resize(): void {

    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)

    const boardRange = this.getBoardRange(this.board)

    const scaleX = width / boardRange.width
    const scaleY = height / boardRange.height
    const scale = Math.min(scaleX, scaleY)

    this.tweens.add({
      targets: this.cameras.main,
      zoom: scale,
      duration: 1000,
      ease: 'Expo.Out'
    })

    // TODO: do this when the tween is complete ?
    this.cameras.main.centerOn(boardRange.centreX, boardRange.centreY)
  }

  private onWake() {
    log.debug('[BoardScene#onWake]')
    this.startNewGame()
  }

  public onRestart(): void {
    log.debug('[BoardScene#onRestart]')
    this.startNewGame()
  }

  public onNextCard(): void {
    log.debug('[BoardScene#onNextCard]')
    const card = this.deck.nextCard()
    this.possibleMoves = this.adapter.evaluateCard(this.board, card)
    const possibleMove = this.chooseRandomWorstScoreMove(this.possibleMoves)
    this.placeCurrentCardTentative(possibleMove, PlayerType.Human)
  }

  public async onComputerMove(): Promise<void> {
    log.debug('[BoardScene#onComputerMove]')
    const card = this.deck.nextCard()
    this.possibleMoves = this.adapter.evaluateCard(this.board, card)
    const possibleMove = this.chooseRandomBestScoreMove(this.possibleMoves)
    this.placeCurrentCardTentative(possibleMove, PlayerType.Computer)
    await new Promise(resolve => setTimeout(resolve, 2000))
    this.placeCurrentCardFinal(PlayerType.Computer)
  }

  public onRotateCW(): void {
    log.debug('[BoardScene#onRotateCW]')
    this.rotateCurrentCard(+this.boardSceneConfig.ROTATION_ANGLE)
  }

  public onRotateCCW(): void {
    log.debug('[BoardScene#onRotateCCW]')
    this.rotateCurrentCard(-this.boardSceneConfig.ROTATION_ANGLE)
  }

  public onPlaceCard(): void {
    log.debug('[BoardScene#onPlaceCard]')
    this.placeCurrentCardFinal(PlayerType.Human)
  }
}
