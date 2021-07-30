import * as Phaser from 'phaser'
import log from 'loglevel'
import { IBoardScene } from './types'

export class HUDScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  boardScene: IBoardScene
  homeElement: HTMLButtonElement
  restartElement: HTMLButtonElement
  nextCardElement: HTMLButtonElement
  placeCardElement: HTMLButtonElement
  rotateCWElement: HTMLButtonElement
  rotateCCWElement: HTMLButtonElement
  toggleFullScreenButton: HTMLButtonElement
  scoreText: Phaser.GameObjects.Text

  constructor(eventEmitter: Phaser.Events.EventEmitter) {
    super({
      active: true,
      visible: true,
      key: 'HUDScene'
    })
    this.eventEmitter = eventEmitter
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

    this.nextCardElement = this.makeButton(y, 'Next Card', this.onNextCardClick, false)
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

    this.scoreText = this.add.text(10, y + 10, '')
    this.scoreText.setOrigin(0, 0)

    this.eventEmitter.on('nextCard', this.onNextCard, this)
    this.eventEmitter.on('moveCard', this.onMoveCard, this)
    this.eventEmitter.on('placeCard', this.onPlaceCard, this)
    this.eventEmitter.on('startRotateCard', this.onStartRotateCard, this)
    this.eventEmitter.on('endRotateCard', this.onEndRotateCard, this)

    this.events.on('destroy', () => {
      log.debug('[HUDScene destroy]')
      this.eventEmitter.off('nextCard', this.onNextCard)
      this.eventEmitter.off('moveCard', this.onMoveCard)
      this.eventEmitter.off('placeCard', this.onPlaceCard)
      this.eventEmitter.off('startRotateCard', this.onStartRotateCard)
      this.eventEmitter.off('endRotateCard', this.onEndRotateCard)
      })
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
    this.scoreText.setText('')
    this.nextCardElement.disabled = false
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
  }

  private onNextCardClick(): void {
    log.debug('[HUDScene#onNextCardClick]')
    this.boardScene.onNextCard()
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

  private onNextCard(arg: any): void {
    log.debug('[HUDScene#onNextCard]', arg)
    const { score, bestScore, bestScoreLocationCount } = arg
    this.scoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
    this.nextCardElement.disabled = true
    this.rotateCWElement.disabled = false
    this.rotateCCWElement.disabled = false
    this.placeCardElement.disabled = false
  }

  private onMoveCard(arg: any): void {
    log.debug('[HUDScene#onMoveCard]', arg)
    const { score, bestScore, bestScoreLocationCount } = arg
    this.scoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
  }

  private onPlaceCard(arg: any): void {
    log.debug('[HUDScene#onPlaceCard]', arg)
    this.nextCardElement.disabled = arg.numCardsLeft == 0
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
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
    this.scoreText.setText(`${score} (${bestScore}/${bestScoreLocationCount})`)
    this.rotateCWElement.disabled = false
    this.rotateCCWElement.disabled = false
    this.placeCardElement.disabled = false
  }
}
