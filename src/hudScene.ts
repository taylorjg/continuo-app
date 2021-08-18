import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { IBoardScene } from './types'
import { TurnManager, PlayerScore, Scoreboard, PlayerType } from './turnManager'
import { createConfirmationDialog } from './confirmationDialog'
import { createSettingsDialog } from './settingsPlayersDialog'
import * as ui from './ui'

export class HUDScene extends Phaser.Scene {

  rexUI: RexUIPlugin
  eventEmitter: Phaser.Events.EventEmitter
  boardScene: IBoardScene
  turnManager: TurnManager
  currentPlayerScore: PlayerScore

  homeElement: HTMLButtonElement
  rotateCWElement: HTMLButtonElement
  rotateCCWElement: HTMLButtonElement
  placeCardElement: HTMLButtonElement
  toggleFullScreenButton: HTMLButtonElement

  settingsButton: RexUIPlugin.Label

  remainingCardsText: Phaser.GameObjects.Text
  currentCardScoreText: Phaser.GameObjects.Text
  scoreboardTexts: Phaser.GameObjects.Text[]

  constructor(eventEmitter: Phaser.Events.EventEmitter) {
    super('HUDScene')
    this.eventEmitter = eventEmitter
    this.turnManager = new TurnManager(this.eventEmitter)
    this.currentPlayerScore = null
  }

  private makeButton(y: number, label: string, handler: Function, initiallyDisabled: boolean): HTMLButtonElement {
    const element = document.createElement('button')
    element.style.margin = '10px'
    element.style.width = '120px'
    element.innerText = label
    element.disabled = initiallyDisabled
    const button = this.add.dom(0, y, element)
    button.setOrigin(0, 0)
    button.addListener('click')
    button.on('click', handler, this)
    return element
  }

  public init() {
    log.debug('[HUDScene#init]')
  }

  public create() {
    log.debug('[HUDScene#create]')

    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    const GAP_Y = 30

    let y = 0

    this.homeElement = this.makeButton(y, 'Home', this.onHomeClick, false)
    y += GAP_Y

    this.rotateCWElement = this.makeButton(y, 'Rotate CW', this.onRotateCWClick, true)
    y += GAP_Y

    this.rotateCCWElement = this.makeButton(y, 'Rotate CCW', this.onRotateCCWClick, true)
    y += GAP_Y

    this.placeCardElement = this.makeButton(y, 'Place Card', this.onPlaceCardClick, true)
    y += GAP_Y

    if (this.sys.game.device.fullscreen.available) {
      const onToggleFullScreenMode = () => {
        if (this.scale.isFullscreen) {
          this.scale.stopFullscreen()
          this.toggleFullScreenButton.innerText = 'Enter Full Screen'
        } else {
          this.scale.startFullscreen()
          this.toggleFullScreenButton.innerText = 'Exit Full Screen'
        }
      }
      this.toggleFullScreenButton = this.makeButton(y, 'Enter Full Screen', onToggleFullScreenMode, false)
      y += GAP_Y
    }

    y += GAP_Y

    this.remainingCardsText = this.add.text(10, y, '')
    this.remainingCardsText.setOrigin(0, 0)
    y += GAP_Y

    this.currentCardScoreText = this.add.text(10, y, '')
    this.currentCardScoreText.setOrigin(0, 0)
    y += GAP_Y

    this.scoreboardTexts = []
    this.turnManager.players.forEach(() => {
      const scoreboardText = this.add.text(10, y, '')
      scoreboardText.setOrigin(0, 0)
      this.scoreboardTexts.push(scoreboardText)
      y += GAP_Y
    })

    this.settingsButton = this.rexUI.add.label({
      name: 'settingsButton',
      background: ui.createLabelBackgroundWithBorder(this),
      icon: this.add.image(0, 0, 'gear'),
      space: { left: 10, right: 10, top: 10, bottom: 10 }
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .layout()

    this.rearrange()

    this.eventEmitter.on('nextTurn', this.onNextTurn, this)
    this.eventEmitter.on('finalScores', this.onFinalScores, this)
    this.eventEmitter.on('nextCard', this.onNextCard, this)
    this.eventEmitter.on('moveCard', this.onMoveCard, this)
    this.eventEmitter.on('placeCard', this.onPlaceCard, this)
    this.eventEmitter.on('startRotateCard', this.onStartRotateCard, this)
    this.eventEmitter.on('endRotateCard', this.onEndRotateCard, this)
    this.eventEmitter.on('startComputerMove', this.onStartComputerMove, this)
    this.eventEmitter.on('endComputerMove', this.onEndComputerMove, this)

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.GameObject,
      _event: Phaser.Types.Input.EventData) => {
      if (gameObject.name == 'settingsButton') {
        this.onSettingsClick()
      }
    })
  }

  private resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
    this.rearrange()
  }

  private rearrange(): void {
    this.settingsButton.setPosition(window.innerWidth - 10, 10)
  }

  private onWake(_thisScene: Phaser.Scene, boardScene: IBoardScene) {
    log.debug('[HUDScene#onWake]')
    this.boardScene = boardScene
    this.turnManager.reset()
    this.turnManager.step()
  }

  private onHomeClick(): void {
    log.debug('[HUDScene#onHomeClick]')
    createConfirmationDialog(this, () => this.game.scene.wake('HomeScene'))
  }

  private updateRemainingCards(arg: any): void {
    const numCardsLeft: number = <number>arg.numCardsLeft
    this.remainingCardsText.setText(`Remaining cards: ${numCardsLeft}`)
  }

  private updateCurrentCardScore(arg: any): void {
    const score: number = <number>arg.score
    const bestScore: number = <number>arg.bestScore
    const bestScoreLocationCount: number = <number>arg.bestScoreLocationCount
    this.currentCardScoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
  }

  private clearCurrentCardScore(): void {
    this.currentCardScoreText.setText('')
  }

  private updateScoreboardTexts(arg: any): void {
    const scoreboard: Scoreboard = <Scoreboard>arg.scoreboard
    scoreboard.forEach((entry, index) => {
      const value = `${entry.playerName}: ${entry.score} (${entry.bestScore})`
      const scoreboardText = this.scoreboardTexts[index]
      scoreboardText.setText(value)
      scoreboardText.setColor(entry.isCurrentPlayer ? 'red' : 'white')
      scoreboardText.setFontStyle(entry.isCurrentPlayer ? 'bold' : '')
    })
  }

  private updateButtonState(): void {
    const isNoMove = this.currentPlayerScore == null
    const isComputerMove = this.currentPlayerScore?.player.type == PlayerType.Computer
    this.homeElement.disabled = isComputerMove
    this.rotateCWElement.disabled = isComputerMove || isNoMove
    this.rotateCCWElement.disabled = isComputerMove || isNoMove
    this.placeCardElement.disabled = isComputerMove || isNoMove
  }

  private endOfTurn(arg: any): void {
    const score = <number>arg.score
    const bestScore = <number>arg.bestScore
    this.turnManager.addTurnScore(this.currentPlayerScore, score, bestScore)
    this.currentPlayerScore = null
    this.clearCurrentCardScore()
    this.updateButtonState()
    setTimeout(() => {
      const numCardsLeft = <number>arg.numCardsLeft
      if (numCardsLeft == 0) {
        this.turnManager.gameOver()
      } else {
        this.turnManager.step()
      }
    }, 1000)
  }

  private onRotateCWClick(): void {
    log.debug('[HUDScene#onRotateCWClick]')
    this.boardScene.onRotateCW()
  }

  private onRotateCCWClick(): void {
    log.debug('[HUDScene#onRotateCCWClick]')
    this.boardScene.onRotateCCW()
  }

  private onPlaceCardClick(): void {
    log.debug('[HUDScene#onPlaceCardClick]')
    this.boardScene.onPlaceCard()
  }

  private onNextTurn(arg: any): void {
    log.debug('[HUDScene#onNextTurn]', arg)
    this.currentPlayerScore = <PlayerScore>arg.currentPlayerScore
    this.updateScoreboardTexts(arg)
    this.updateButtonState()
    switch (this.currentPlayerScore.player.type) {
      case PlayerType.Human:
        this.boardScene.onNextCard()
        break
      case PlayerType.Computer:
        this.boardScene.onComputerMove()
        break
    }
  }

  private onFinalScores(arg: any): void {
    log.debug('[HUDScene#onFinalScores]', arg)
    this.currentPlayerScore = null
    this.updateScoreboardTexts(arg)
    this.updateButtonState()
  }

  private onNextCard(arg: any): void {
    log.debug('[HUDScene#onNextCard]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
    this.updateButtonState()
  }

  private onMoveCard(arg: any): void {
    log.debug('[HUDScene#onMoveCard]', arg)
    this.updateCurrentCardScore(arg)
  }

  private onPlaceCard(arg: any): void {
    log.debug('[HUDScene#onPlaceCard]', arg)
    this.endOfTurn(arg)
  }

  private onStartRotateCard(arg: any): void {
    log.debug('[HUDScene#onStartRotateCard]', arg)
    this.homeElement.disabled = true
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
  }

  private onEndRotateCard(arg: any): void {
    log.debug('[HUDScene#onEndRotateCard]', arg)
    this.updateCurrentCardScore(arg)
    this.updateButtonState()
  }

  private onStartComputerMove(arg: any): void {
    log.debug('[HUDScene#onStartComputerMove]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
    this.updateButtonState()
  }

  private onEndComputerMove(arg: any): void {
    log.debug('[HUDScene#onEndComputerMove]', arg)
    this.endOfTurn(arg)
  }

  private onSettingsClick(): void {
    log.debug('[HUDScene#onSettingsClick]')
    createSettingsDialog(this)
  }
}
