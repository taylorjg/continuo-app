import * as Phaser from 'phaser'
import log from 'loglevel'
import { IBoardScene } from './types'
import { TurnManager, PlayerScore, Scoreboard, PlayerType, ScoreboardEntry } from './turnManager'

export class HUDScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  boardScene: IBoardScene
  homeElement: HTMLButtonElement
  restartElement: HTMLButtonElement
  placeCardElement: HTMLButtonElement
  rotateCWElement: HTMLButtonElement
  rotateCCWElement: HTMLButtonElement
  toggleFullScreenButton: HTMLButtonElement
  currentCardScoreText: Phaser.GameObjects.Text
  totalScoreText: Phaser.GameObjects.Text
  remainingCardsText: Phaser.GameObjects.Text
  currentPlayerNameText: Phaser.GameObjects.Text
  turnManager: TurnManager
  currentPlayerScore: PlayerScore

  constructor(eventEmitter: Phaser.Events.EventEmitter) {
    super({
      active: true,
      visible: true,
      key: 'HUDScene'
    })
    this.eventEmitter = eventEmitter
    this.turnManager = new TurnManager(this.eventEmitter)
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

  create() {
    this.boardScene = <IBoardScene><unknown>this.scene.get('BoardScene')

    let y = 0

    this.homeElement = this.makeButton(y, 'Home', this.onHomeClick, false)
    y += 30

    this.restartElement = this.makeButton(y, 'Restart', this.onRestartClick, false)
    y += 30

    this.rotateCWElement = this.makeButton(y, 'Rotate CW', this.onRotateCWClick, true)
    y += 30

    this.rotateCCWElement = this.makeButton(y, 'Rotate CCW', this.onRotateCCWClick, true)
    y += 30

    this.placeCardElement = this.makeButton(y, 'Place Card', this.onPlaceCardClick, true)
    y += 30

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
      y += 30
    }

    y += 10

    this.remainingCardsText = this.add.text(10, y, '')
    this.remainingCardsText.setOrigin(0, 0)
    y += 30

    this.totalScoreText = this.add.text(10, y, '')
    this.totalScoreText.setOrigin(0, 0)
    y += 30

    this.currentCardScoreText = this.add.text(10, y, '')
    this.currentCardScoreText.setOrigin(0, 0)
    y += 30

    this.currentPlayerNameText = this.add.text(10, y, '')
    this.currentPlayerNameText.setOrigin(0, 0)
    y += 30

    this.eventEmitter.on('nextTurn', this.onNextTurn, this)
    this.eventEmitter.on('nextCard', this.onNextCard, this)
    this.eventEmitter.on('moveCard', this.onMoveCard, this)
    this.eventEmitter.on('placeCard', this.onPlaceCard, this)
    this.eventEmitter.on('startRotateCard', this.onStartRotateCard, this)
    this.eventEmitter.on('endRotateCard', this.onEndRotateCard, this)
    this.eventEmitter.on('startComputerMove', this.onStartComputerMove, this)
    this.eventEmitter.on('endComputerMove', this.onEndComputerMove, this)

    this.events.on('destroy', () => {
      log.debug('[HUDScene destroy]')
      this.eventEmitter.off('nextTurn', this.onNextTurn)
      this.eventEmitter.off('nextCard', this.onNextCard)
      this.eventEmitter.off('moveCard', this.onMoveCard)
      this.eventEmitter.off('placeCard', this.onPlaceCard)
      this.eventEmitter.off('startRotateCard', this.onStartRotateCard)
      this.eventEmitter.off('endRotateCard', this.onEndRotateCard)
      this.eventEmitter.off('startComputerMove', this.onStartComputerMove)
      this.eventEmitter.off('endComputerMove', this.onEndComputerMove)
    })

    this.turnManager.reset()
    this.turnManager.step()
  }

  private onHomeClick(): void {
    log.debug('[HUDScene#onHomeClick]')
    this.scene.remove('BoardScene')
    this.scene.remove('HUDScene')
    this.game.scene.wake('HomeScene', { name: 'Jon' })
  }

  private onRestartClick(): void {
    log.debug('[HUDScene#onRestartClick]')
    this.boardScene.onRestart()
    this.currentCardScoreText.setText('')
    this.totalScoreText.setText('')
    this.remainingCardsText.setText('')
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
    this.turnManager.reset()
    this.turnManager.step()
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

  private makeScoresText(scoreboard: Scoreboard): string {
    return 'scores: ' + scoreboard.map(entry => `${entry.score} (${entry.bestScore})`).join(' / ')
  }

  private onNextTurn(arg: any): void {
    log.debug('[HUDScene#onNextTurn]', arg)
    this.currentPlayerScore = <PlayerScore>arg.currentPlayerScore
    const scoreboard: Scoreboard = <Scoreboard>arg.scoreboard
    this.currentPlayerNameText.setText(`Turn: ${this.currentPlayerScore.player.name}`)
    this.totalScoreText.setText(this.makeScoresText(scoreboard))
    switch (this.currentPlayerScore.player.type) {
      case PlayerType.Human:
        this.boardScene.onNextCard()
        break
      case PlayerType.Computer:
        this.boardScene.onComputerMove()
        break
    }
  }

  private onNextCard(arg: any): void {
    log.debug('[HUDScene#onNextCard]', arg)
    const { score, bestScore, bestScoreLocationCount } = arg
    this.currentCardScoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
    this.remainingCardsText.setText(`Remaining cards: ${arg.numCardsLeft}`)
    this.rotateCWElement.disabled = false
    this.rotateCCWElement.disabled = false
    this.placeCardElement.disabled = false
  }

  private onMoveCard(arg: any): void {
    log.debug('[HUDScene#onMoveCard]', arg)
    const { score, bestScore, bestScoreLocationCount } = arg
    this.currentCardScoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
  }

  private onPlaceCard(arg: any): void {
    log.debug('[HUDScene#onPlaceCard]', arg)
    const score = <number>arg.score
    const bestScore = <number>arg.bestScore
    this.turnManager.addTurnScore(this.currentPlayerScore, score, bestScore)
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
    setTimeout(() => { this.turnManager.step() }, 1000)
  }

  private onStartRotateCard(arg: any): void {
    log.debug('[HUDScene#onStartRotateCard]', arg)
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
  }

  private onEndRotateCard(arg: any): void {
    log.debug('[HUDScene#onEndRotateCard]', arg)
    const { score, bestScore, bestScoreLocationCount } = arg
    this.currentCardScoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
    this.rotateCWElement.disabled = false
    this.rotateCCWElement.disabled = false
    this.placeCardElement.disabled = false
  }

  private onStartComputerMove(arg: any): void {
    log.debug('[HUDScene#onStartComputerMove]', arg)
    const { score, bestScore, bestScoreLocationCount } = arg
    this.currentCardScoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
    this.remainingCardsText.setText(`Remaining cards: ${arg.numCardsLeft}`)
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
  }

  private onEndComputerMove(arg: any): void {
    log.debug('[HUDScene#onEndComputerMove]', arg)
    const score = <number>arg.score
    const bestScore = <number>arg.bestScore
    this.turnManager.addTurnScore(this.currentPlayerScore, score, bestScore)
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
    setTimeout(() => { this.turnManager.step() }, 1000)
  }
}
