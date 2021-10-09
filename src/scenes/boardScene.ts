import * as Phaser from 'phaser'
import log from 'loglevel'

import { EventCentre } from '../eventCentre'
import { DEFAULT_SETTINGS, Settings } from '../settings'
import { ContinuoAppEvents } from '../constants'
import { promisifyTween, promisifyDelayedCall } from '../promisifyThings'
import { tweenAlongCurve } from '../specialTweens'

import {
  CommonAdapter,
  CommonBoard,
  CommonBoardRange,
  CommonCard,
  CommonCell,
  CommonDeck,
  CommonPlacedCard,
  CommonPossibleMove
} from '../types'

import { Player, PlayerType } from '../turnManager'

export const CURRENT_CARD_DEPTH = 1
export const HIGHLIGHT_DEPTH = 2
export const HIGHLIGHT_COLOUR = 0xFF00FF

const DURATION_ROTATE = 300
const DURATION_RESCALE_ZOOM = 1000
const DURATION_PRE_FINAL_PLACEMENT = 2000

export type BoardSceneConfig = {
  eventCentre: EventCentre,
  CARD_WIDTH: number,
  CARD_HEIGHT: number,
  ROTATION_ANGLE: number
}

export abstract class BoardScene extends Phaser.Scene {

  private boardSceneConfig: BoardSceneConfig
  private adapter: CommonAdapter
  private deck: CommonDeck
  private board: CommonBoard
  private settings: Settings
  private possibleMoves: CommonPossibleMove[]
  private currentPossibleMove: CommonPossibleMove
  private currentPlayer: Player
  private cardSpritesMap: Map<CommonCard, Phaser.GameObjects.Sprite>
  private currentCardContainer: Phaser.GameObjects.Container
  private animating: boolean
  private moveTimedOut: boolean
  private visitedPossibleMoves: Set<CommonPossibleMove>

  public constructor(sceneName: string, boardSceneConfig: BoardSceneConfig, adapter: CommonAdapter) {
    super(sceneName)
    this.boardSceneConfig = boardSceneConfig
    this.adapter = adapter
    this.deck = this.adapter.deck
    this.board = this.adapter.emptyBoard
    this.settings = DEFAULT_SETTINGS
    this.cardSpritesMap = new Map<CommonCard, Phaser.GameObjects.Sprite>()
    this.animating = false
    this.moveTimedOut = false
    this.visitedPossibleMoves = new Set()
  }

  protected abstract getInitialPlacedCards(deck: CommonDeck, board: CommonBoard, numPlayers: number): Generator<CommonPlacedCard, void, CommonBoard>
  protected abstract getCardPosition(row: number, col: number): Phaser.Geom.Point
  protected abstract getSnapPosition(x: number, y: number): CommonCell
  protected abstract drawCard(graphics: Phaser.GameObjects.Graphics, card: CommonCard): void
  protected abstract getPlacedCardRotationAngle(placedCard: CommonPlacedCard): number
  protected abstract createCurrentCardHighlight(): Phaser.GameObjects.GameObject
  protected abstract createScoringHighlights(currentPossibleMove: CommonPossibleMove): Phaser.GameObjects.Shape[]
  protected abstract getBoardRange(board: CommonBoard): CommonBoardRange

  private highlightScoring(currentPossibleMove: CommonPossibleMove): void {
    if (this.settings.hintShowScoringHighlights) {
      const scoringHighlights = this.createScoringHighlights(currentPossibleMove)
      scoringHighlights.forEach(highlight => {
        highlight.setData('isScoringHighlight', true)
        this.add.existing(highlight)
      })
    }
  }

  private unhighlightScoring(): void {
    const scoringHighlights = this.children.getChildren().filter(child => child.getData('isScoringHighlight') == true)
    scoringHighlights.forEach(highlight => highlight.destroy())
  }

  private emitCurrentCardChange(event: ContinuoAppEvents): void {
    if (this.possibleMoves) {
      const numCardsLeft = this.deck.numCardsLeft
      const score = this.currentPossibleMove.score
      const bestScore = this.possibleMoves[0].score
      const bestScoreLocationCount = this.possibleMoves.filter(({ score }) => score == bestScore).length
      this.boardSceneConfig.eventCentre.emit(event, {
        player: this.currentPlayer,
        numCardsLeft,
        score,
        bestScore,
        bestScoreLocationCount
      })
    }
  }

  private showCardSpriteDirectly(placedCard: CommonPlacedCard) {

    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = this.getPlacedCardRotationAngle(placedCard)

    cardSprite.setPosition(cardPosition.x, cardPosition.y)
    cardSprite.setAngle(angle)
    cardSprite.setVisible(true)

    this.currentCardContainer.remove(cardSprite)
    this.currentCardContainer.setVisible(false)
  }

  private async showCardSpriteInContainer(placedCard: CommonPlacedCard, playerType: PlayerType) {

    const boardRange = this.getBoardRange(this.board)

    const fromPosition = new Phaser.Geom.Point(boardRange.width, boardRange.height)
    const toPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const fromAngle = 0
    const toAngle = this.getPlacedCardRotationAngle(placedCard)

    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    cardSprite.setPosition(0, 0)
    cardSprite.setAngle(0)
    cardSprite.setVisible(true)

    this.currentCardContainer.addAt(cardSprite, 0)
    this.currentCardContainer.setPosition(fromPosition.x, fromPosition.y)
    this.currentCardContainer.setAngle(fromAngle)
    this.currentCardContainer.setVisible(true)

    await tweenAlongCurve(this, this.currentCardContainer, fromPosition, toPosition, fromAngle, toAngle)

    if (playerType == PlayerType.Human) {
      this.currentCardContainer.setInteractive({ useHandCursor: true })
    } else {
      this.currentCardContainer.disableInteractive()
    }
  }

  private placeInitialCard(placedCard: CommonPlacedCard): void {
    this.board = this.board.placeCard(placedCard)
    this.showCardSpriteDirectly(placedCard)
  }

  private async placeCurrentCardTentative(possibleMove: CommonPossibleMove) {
    this.currentPossibleMove = possibleMove
    const placedCard = this.currentPossibleMove.placedCard
    await this.rescale(this.board.placeCard(placedCard))
    await this.showCardSpriteInContainer(placedCard, this.currentPlayer.type)
    this.highlightScoring(this.currentPossibleMove)
    this.emitCurrentCardChange(ContinuoAppEvents.StartMove)
  }

  private async placeCurrentCardFinal() {

    this.unhighlightScoring()

    const throbCount = 2
    const throbSpeed = 100

    await promisifyTween(this.tweens.add({
      targets: this.currentCardContainer,
      duration: throbSpeed / 2,
      hold: throbSpeed,
      scale: 1.05,
      repeat: throbCount,
      repeatDelay: throbSpeed,
      yoyo: true,
      completeDelay: throbSpeed * 4
    }))

    const placedCard = this.currentPossibleMove.placedCard
    this.board = this.board.placeCard(placedCard)
    this.showCardSpriteDirectly(placedCard)
    this.emitCurrentCardChange(ContinuoAppEvents.EndMove)
    this.currentPossibleMove = null
    this.currentPlayer = null
    this.visitedPossibleMoves.clear()
  }

  private repositionCurrentCardContainer(possibleMove?: CommonPossibleMove): void {

    if (possibleMove) {
      this.currentPossibleMove = possibleMove
    }

    const placedCard = this.currentPossibleMove.placedCard
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)

    const duration = possibleMove ? 75 : 300

    this.tweens.add({
      targets: this.currentCardContainer,
      duration,
      x: cardPosition.x,
      y: cardPosition.y,
      onStart: () => {
        this.animating = true
      },
      onComplete: () => {
        this.highlightScoring(this.currentPossibleMove)
        this.emitCurrentCardChange(ContinuoAppEvents.CardMoved)
        this.animating = false
      }
    })

    if (possibleMove && this.settings.soundBestScoreEnabled) {
      const score = possibleMove.score
      const bestScore = this.possibleMoves[0].score
      if (score == bestScore) {
        if (!this.visitedPossibleMoves.has(possibleMove)) {
          this.sound.play('best-move')
        }
      }
    }

    if (!possibleMove && this.settings.soundIllegalMoveEnabled) {
      this.sound.play('illegal-move')
    }

    if (possibleMove) {
      this.visitedPossibleMoves.add(possibleMove)
    }
  }

  private rotateCurrentCardContainer(rotationAngle: number): void {
    const isHumanMove = this.currentPlayer?.type == PlayerType.Human
    if (this.animating || this.moveTimedOut || !isHumanMove) {
      return
    }
    const newPlacedCard = rotationAngle > 0
      ? this.adapter.placedCardRotateCW(this.currentPossibleMove.placedCard)
      : this.adapter.placedCardRotateCCW(this.currentPossibleMove.placedCard)
    const possibleMove = this.findPossibleMove(newPlacedCard)
    if (possibleMove) {
      if (this.settings.soundRotationEnabled) {
        this.sound.play('rotate-card')
      }
      this.tweens.add({
        targets: this.currentCardContainer,
        angle: this.currentCardContainer.angle + rotationAngle,
        duration: DURATION_ROTATE,
        ease: 'Sine.InOut',
        onStart: () => {
          this.unhighlightScoring()
          this.animating = true
        },
        onComplete: () => {
          if (!this.moveTimedOut) {
            this.currentPossibleMove = possibleMove
            this.highlightScoring(this.currentPossibleMove)
            this.emitCurrentCardChange(ContinuoAppEvents.CardRotated)
            if (this.settings.soundBestScoreEnabled) {
              const score = possibleMove.score
              const bestScore = this.possibleMoves[0].score
              if (score == bestScore) {
                if (!this.visitedPossibleMoves.has(possibleMove)) {
                  this.sound.play('best-move')
                }
              }
            }
          }
          this.visitedPossibleMoves.add(possibleMove)
          this.animating = false
        }
      })
    }
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
    this.currentCardContainer.setInteractive({ useHandCursor: true })
    this.add.existing(this.currentCardContainer)

    this.input.setDraggable(this.currentCardContainer)
    this.input.dragDistanceThreshold = 2

    this.input.on(Phaser.Input.Events.DRAG_START, (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject
    ) => {
      this.unhighlightScoring()
      this.animating = true
    })

    this.input.on(Phaser.Input.Events.DRAG, (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject,
      dragX: number,
      dragY: number
    ) => {
      this.currentCardContainer.x = dragX
      this.currentCardContainer.y = dragY
    })

    this.input.on(Phaser.Input.Events.DRAG_END, (
      _pointer: Phaser.Input.Pointer,
      _gameObject: Phaser.GameObjects.GameObject
    ) => {
      if (this.currentPossibleMove && !this.moveTimedOut) {
        const { row, col } = this.getSnapPosition(this.currentCardContainer.x, this.currentCardContainer.y)
        const newPlacedCard = this.adapter.placedCardMoveTo(this.currentPossibleMove.placedCard, row, col)
        const possibleMove = this.findPossibleMove(newPlacedCard)
        this.repositionCurrentCardContainer(possibleMove)
      }
    })

    this.input.keyboard.on('keydown-LEFT', () => {
      this.onRotateCCW()
    })

    this.input.keyboard.on('keydown-RIGHT', () => {
      this.onRotateCW()
    })

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)
    this.events.on(Phaser.Scenes.Events.SLEEP, this.onSleep, this)
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

  private resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
    this.rescale(this.board)
  }

  private async rescale(board: CommonBoard) {

    const boardRange = this.getBoardRange(board)

    this.cameras.main.centerOn(boardRange.centreX, boardRange.centreY)

    const scaleX = window.innerWidth / boardRange.width
    const scaleY = window.innerHeight / boardRange.height
    const scale = Math.min(scaleX, scaleY)

    return promisifyTween(this.tweens.add({
      targets: this.cameras.main,
      zoom: scale,
      duration: DURATION_RESCALE_ZOOM,
      ease: 'Expo.Out'
    }))
  }

  private onWake(_scene: Phaser.Scene, data: {
    settings: Settings,
    players: readonly Player[]
  }) {
    log.debug('[BoardScene#onWake]', data)
    this.settings = data.settings
    this.boardSceneConfig.eventCentre.on(ContinuoAppEvents.NewGame, this.onNewGame, this)
    this.boardSceneConfig.eventCentre.on(ContinuoAppEvents.NextTurn, this.onNextTurn, this)
    this.boardSceneConfig.eventCentre.on(ContinuoAppEvents.RotateCW, this.onRotateCW, this)
    this.boardSceneConfig.eventCentre.on(ContinuoAppEvents.RotateCCW, this.onRotateCCW, this)
    this.boardSceneConfig.eventCentre.on(ContinuoAppEvents.PlaceCard, this.onPlaceCard, this)
    this.boardSceneConfig.eventCentre.on(ContinuoAppEvents.MoveTimedOut, this.onMoveTimedOut, this)
    this.boardSceneConfig.eventCentre.on(ContinuoAppEvents.SettingsChanged, this.onSettingsChanged, this)
  }

  private onSleep(_scene: Phaser.Scene) {
    log.debug('[BoardScene#onSleep]')
    this.boardSceneConfig.eventCentre.off(ContinuoAppEvents.NewGame, this.onNewGame, this)
    this.boardSceneConfig.eventCentre.off(ContinuoAppEvents.NextTurn, this.onNextTurn, this)
    this.boardSceneConfig.eventCentre.off(ContinuoAppEvents.RotateCW, this.onRotateCW, this)
    this.boardSceneConfig.eventCentre.off(ContinuoAppEvents.RotateCCW, this.onRotateCCW, this)
    this.boardSceneConfig.eventCentre.off(ContinuoAppEvents.PlaceCard, this.onPlaceCard, this)
    this.boardSceneConfig.eventCentre.off(ContinuoAppEvents.MoveTimedOut, this.onMoveTimedOut, this)
    this.boardSceneConfig.eventCentre.off(ContinuoAppEvents.SettingsChanged, this.onSettingsChanged, this)
  }

  private onNewGame(players: readonly Player[]) {
    log.debug('[BoardScene#onNewGame]', players)
    this.cardSpritesMap.forEach(cardSprite => cardSprite.setVisible(false))
    this.currentCardContainer.setVisible(false)
    this.unhighlightScoring()
    this.deck.reset()
    this.board = this.adapter.emptyBoard
    this.possibleMoves = []
    this.currentPossibleMove = null
    this.currentPlayer = null
    const iter = this.getInitialPlacedCards(this.deck, this.board, players.length)
    for (let curr = iter.next(); curr.value; curr = iter.next(this.board)) {
      this.placeInitialCard(curr.value)
    }
    this.resize()
  }

  private async onNextTurn(player: Player) {
    log.debug('[BoardScene#onNextTurn]', player)
    this.currentPlayer = player
    this.moveTimedOut = false
    const card = this.deck.nextCard()
    this.possibleMoves = this.adapter.evaluateCard(this.board, card)
    switch (this.currentPlayer.type) {
      case PlayerType.Human:
        {
          const possibleMove = this.chooseRandomWorstScoreMove(this.possibleMoves)
          this.placeCurrentCardTentative(possibleMove)
          break
        }
      case PlayerType.Computer:
        {
          const possibleMove = this.chooseRandomBestScoreMove(this.possibleMoves)
          await this.placeCurrentCardTentative(possibleMove)
          await promisifyDelayedCall(this, DURATION_PRE_FINAL_PLACEMENT)
          this.placeCurrentCardFinal()
          break
        }
    }
  }

  private onRotateCW(): void {
    log.debug('[BoardScene#onRotateCW]')
    if (!this.moveTimedOut) {
      this.rotateCurrentCardContainer(+this.boardSceneConfig.ROTATION_ANGLE)
    }
  }

  private onRotateCCW(): void {
    log.debug('[BoardScene#onRotateCCW]')
    if (!this.moveTimedOut) {
      this.rotateCurrentCardContainer(-this.boardSceneConfig.ROTATION_ANGLE)
    }
  }

  private onPlaceCard(): void {
    log.debug('[BoardScene#onPlaceCard]')
    if (!this.moveTimedOut) {
      this.placeCurrentCardFinal()
    }
  }

  private async onMoveTimedOut() {
    log.debug('[BoardScene#onMoveTimedOut]')
    this.moveTimedOut = true
    this.tweens.killTweensOf(this.currentCardContainer)
    this.input.setDragState(this.input.activePointer, 0)
    this.currentCardContainer.disableInteractive()

    const bestVisitedPossibleMove = Array.from(this.visitedPossibleMoves.values()).reduce(
      (pmBestSoFar, pm) => pm.score > pmBestSoFar.score ? pm : pmBestSoFar,
      this.currentPossibleMove
    )
    const fromPlacedCard = this.currentPossibleMove.placedCard
    const toPlacedCard = bestVisitedPossibleMove.placedCard
    const fromPosition = this.getCardPosition(fromPlacedCard.row, fromPlacedCard.col)
    const toPosition = this.getCardPosition(toPlacedCard.row, toPlacedCard.col)
    const fromAngle = this.getPlacedCardRotationAngle(fromPlacedCard)
    const toAngle = this.getPlacedCardRotationAngle(toPlacedCard)

    const differentPosition = !Phaser.Geom.Point.Equals(fromPosition, toPosition)
    const differentAngle = fromAngle != toAngle

    if (differentPosition || differentAngle) {
      this.unhighlightScoring()
      await tweenAlongCurve(this, this.currentCardContainer, fromPosition, toPosition, fromAngle, toAngle)
      this.highlightScoring(bestVisitedPossibleMove)
      this.currentPossibleMove = bestVisitedPossibleMove
      this.emitCurrentCardChange(ContinuoAppEvents.CardMoved)
      await promisifyDelayedCall(this, DURATION_PRE_FINAL_PLACEMENT)
    }

    await this.placeCurrentCardFinal()
  }

  private onSettingsChanged(settings: Settings) {
    log.debug('[BoardScene#onSettingsChanged]', settings)
    this.settings = settings
    if (this.currentPossibleMove) {
      this.unhighlightScoring()
      if (this.settings.hintShowScoringHighlights) {
        this.highlightScoring(this.currentPossibleMove)
      } else {
        this.unhighlightScoring()
      }
    }
  }
}
