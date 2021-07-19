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

    this.homeElement = this.makeButton(y, 'Home', this.onHome, false)
    y += 30

    this.restartElement = this.makeButton(y, 'Restart', this.onRestart, false)
    y += 30

    this.nextCardElement = this.makeButton(y, 'Next Card', this.onNextCard, false)
    y += 30

    this.rotateCWElement = this.makeButton(y, 'Rotate CW', this.onRotateCW, true)
    y += 30

    this.rotateCCWElement = this.makeButton(y, 'Rotate CCW', this.onRotateCCW, true)
    y += 30

    this.placeCardElement = this.makeButton(y, 'Place Card', this.onPlaceCard, true)
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

    this.eventEmitter.on('currentCardChange', this.onCurrentCardChange, this)
  }

  private onCurrentCardChange(arg: any): void {
    log.debug('[HUDScene#onCurrentCardChange]', arg)
  }

  private onHome(): void {
  log.debug('[HUDScene#onHome]')
    this.scene.remove('BoardScene')
    this.scene.remove('HUDScene')
}

  private onRestart(): void {
  log.debug('[HUDScene#onRestart]')
    this.boardScene.onRestart()
    this.nextCardElement.disabled = false
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
}

  private onNextCard(): void {
  log.debug('[HUDScene#onRestart]')
    this.boardScene.onNextCard()
    this.nextCardElement.disabled = true
    this.rotateCWElement.disabled = false
    this.rotateCCWElement.disabled = false
    this.placeCardElement.disabled = false
}

  private onRotateCW(): void {
  log.debug('[HUDScene#onRestart]')
    this.boardScene.onRotateCW()
}

  private onRotateCCW(): void {
  log.debug('[HUDScene#onRestart]')
    this.boardScene.onRotateCCW()
}

  private onPlaceCard(): void {
  log.debug('[HUDScene#onRestart]')
    const numCardsLeft = this.boardScene.onPlaceCard()
    this.nextCardElement.disabled = numCardsLeft == 0
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
}
}
