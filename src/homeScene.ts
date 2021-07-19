import * as Phaser from 'phaser'
import log from 'loglevel'
import { ContinuoBoardScene } from './continuoBoardScene'
import { HexagoBoardScene } from './hexagoBoardScene'
import { HUDScene } from './hudScene'

export class HomeScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  playContinuoElement: HTMLButtonElement
  playHexagoElement: HTMLButtonElement

  constructor() {
    super({
      active: true,
      visible: true,
      key: 'HomeScene'
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
    this.eventEmitter = new Phaser.Events.EventEmitter()

    let y = 0

    this.playContinuoElement = this.makeButton(y, 'Play Continuo', this.onPlayContinuo, false)
    y += 30

    this.playHexagoElement = this.makeButton(y, 'Play Hexago', this.onPlayHexago, false)
    y += 30
  }

  public onPlayContinuo(): void {
    log.debug('[HomeScene#onPlayContinuo]')
    this.game.scene.add('BoardScene', new ContinuoBoardScene(this.eventEmitter))
    this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter))
  }

  public onPlayHexago(): void {
    log.debug('[HomeScene#onPlayHexago]')
    this.game.scene.add('BoardScene', new HexagoBoardScene(this.eventEmitter))
    this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter))
  }
}
