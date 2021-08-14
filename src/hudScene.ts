import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { IBoardScene } from './types'
import { TurnManager, PlayerScore, Scoreboard, PlayerType } from './turnManager'

type SceneWithRexUI = Phaser.Scene & { rexUI: RexUIPlugin }

const createLabel = (scene: Phaser.Scene, text: string) => {
  const rexUI = (<SceneWithRexUI>scene).rexUI
  return rexUI.add.label({
    width: 40,
    height: 40,
    background: rexUI.add.roundRectangle(0, 0, 0, 0, 5, 0x5e92f3),
    text: scene.add.text(0, 0, text, { fontSize: '24px' }),
    space: { left: 10, right: 10, top: 10, bottom: 10 }
  })
}

const createConfirmationDialog = (scene: Phaser.Scene): RexUIPlugin.Dialog => {
  const rexUI = (<SceneWithRexUI>scene).rexUI
  return rexUI.add.dialog({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    width: 500,
    background: rexUI.add.roundRectangle(0, 0, 100, 100, 5, 0x1565c0),
    content: createLabel(scene, 'Are you sure you want to quit ?'),
    actions: [createLabel(scene, 'Yes'), createLabel(scene, 'No')],
    space: {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20,
      content: 25,
      action: 25
    },
    align: { title: 'center', actions: 'right' },
    click: { mode: 'release' }
  })
}

export class HUDScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  boardScene: IBoardScene
  turnManager: TurnManager
  currentPlayerScore: PlayerScore

  homeElement: HTMLButtonElement
  restartElement: HTMLButtonElement
  rotateCWElement: HTMLButtonElement
  rotateCCWElement: HTMLButtonElement
  placeCardElement: HTMLButtonElement
  toggleFullScreenButton: HTMLButtonElement

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

    const GAP_Y = 30

    let y = 0

    this.homeElement = this.makeButton(y, 'Home', this.onHomeClick, false)
    y += GAP_Y

    this.restartElement = this.makeButton(y, 'Restart', this.onRestartClick, false)
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

    this.eventEmitter.on('nextTurn', this.onNextTurn, this)
    this.eventEmitter.on('finalScores', this.onFinalScores, this)
    this.eventEmitter.on('nextCard', this.onNextCard, this)
    this.eventEmitter.on('moveCard', this.onMoveCard, this)
    this.eventEmitter.on('placeCard', this.onPlaceCard, this)
    this.eventEmitter.on('startRotateCard', this.onStartRotateCard, this)
    this.eventEmitter.on('endRotateCard', this.onEndRotateCard, this)
    this.eventEmitter.on('startComputerMove', this.onStartComputerMove, this)
    this.eventEmitter.on('endComputerMove', this.onEndComputerMove, this)

    this.events.on('wake', this.onWake, this)
  }

  private onWake(_thisScene: Phaser.Scene, boardScene: IBoardScene) {
    log.debug('[HUDScene#onWake]')
    this.boardScene = boardScene
    this.turnManager.reset()
    this.turnManager.step()
  }

  private onHomeClick(): void {
    log.debug('[HUDScene#onHomeClick]')
    const confirmationDialogScene = this.scene.add(undefined, new Phaser.Scene('ConfirmationDialog'), true)
    const confirmationDialog = createConfirmationDialog(confirmationDialogScene).layout().popUp(100)
    confirmationDialog.on('button.click', function (
      _button: Phaser.GameObjects.GameObject,
      _groupName: string,
      index: number,
      _pointer: Phaser.Input.Pointer,
      _event: any) {
      confirmationDialogScene.scene.remove()
      switch (index) {
        case 0: // yes
          this.game.scene.wake('HomeScene')
          break
        case 1: // no
          break
      }
    }, this)
  }

  private onRestartClick(): void {
    log.debug('[HUDScene#onRestartClick]')
    const confirmationDialogScene = this.scene.add(undefined, new Phaser.Scene('ConfirmationDialog'), true)
    const confirmationDialog = createConfirmationDialog(confirmationDialogScene).layout().popUp(100)
    confirmationDialog.on('button.click', function (
      _button: Phaser.GameObjects.GameObject,
      _groupName: string,
      index: number,
      _pointer: Phaser.Input.Pointer,
      _event: any) {
      confirmationDialogScene.scene.remove()
      switch (index) {
        case 0: // yes
          this.boardScene.onRestart()
          this.turnManager.reset()
          this.turnManager.step()
          break
        case 1: // no
          break
      }
    }, this)
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
    this.restartElement.disabled = isComputerMove
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
    this.restartElement.disabled = true
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
}
