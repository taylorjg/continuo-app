import * as Phaser from 'phaser'
import log from 'loglevel'
import { ContinuoBoardScene } from './continuoBoardScene'

export class HUDScene extends Phaser.Scene {

  continuoBoardScene: ContinuoBoardScene
  restartElement: HTMLButtonElement
  nextCardElement: HTMLButtonElement
  placeCardElement: HTMLButtonElement
  rotateCWElement: HTMLButtonElement
  rotateCCWElement: HTMLButtonElement
  toggleFullScreenButton: HTMLButtonElement

  constructor() {
    super({
      active: true,
      visible: true,
      key: 'HUDScene'
    })
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
    this.continuoBoardScene = <ContinuoBoardScene>this.scene.get('ContinuoBoardScene')

    let y = 0

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
  }

  public onRestart(): void {
    log.debug('[HUDScene#onRestart]')
    this.continuoBoardScene.onRestart()
    this.nextCardElement.disabled = false
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
  }

  public onNextCard(): void {
    log.debug('[HUDScene#onRestart]')
    this.continuoBoardScene.onNextCard()
    this.nextCardElement.disabled = true
    this.rotateCWElement.disabled = false
    this.rotateCCWElement.disabled = false
    this.placeCardElement.disabled = false
  }

  public onRotateCW(): void {
    log.debug('[HUDScene#onRestart]')
    this.continuoBoardScene.onRotateCW()
  }

  public onRotateCCW(): void {
    log.debug('[HUDScene#onRestart]')
    this.continuoBoardScene.onRotateCCW()
  }

  public onPlaceCard(): void {
    log.debug('[HUDScene#onRestart]')
    const numCardsLeft = this.continuoBoardScene.onPlaceCard()
    this.nextCardElement.disabled = numCardsLeft == 0
    this.rotateCWElement.disabled = true
    this.rotateCCWElement.disabled = true
    this.placeCardElement.disabled = true
  }
}
