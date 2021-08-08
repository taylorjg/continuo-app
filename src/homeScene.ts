import * as Phaser from 'phaser'
import log from 'loglevel'
import { HUDScene } from './hudScene'
import { ContinuoBoardScene } from './continuoBoardScene'
import { HexagoBoardScene } from './hexagoBoardScene'
import { continuoCardImage } from './continuoCardImage'
import { hexagoCardImage } from './hexagoCardImage'

export class HomeScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  playContinuoButton: Phaser.GameObjects.DOMElement
  playHexagoButton: Phaser.GameObjects.DOMElement
  hudScene: Phaser.Scene
  continuoBoardScene: Phaser.Scene
  hexagoBoardScene: Phaser.Scene

  constructor() {
    super({ key: 'HomeScene', active: true, visible: true })
  }

  private makeButton(
    label: string,
    cardImage: string,
    handler: Function,
    dims: [number, number]): Phaser.GameObjects.DOMElement {

    const [width, height] = dims

    const html = `
      <div style="display: flex; align-items: center;">
        <div style="flex: 1;">
          <img src="${cardImage}" width="${width}" height="${height}">
        </div>
        <div style="flex: 1;">
          <text>${label}</text>
        </div>
      </div>
    `

    const style = `
      margin: 10px;
      width: 250px;
      backgroundColor: white;
      padding: .5rem;
      cursor: pointer;
    `

    const button = this.add.dom(0, 0, 'button', style)
    button.setHTML(html)
    button.addListener('click')
    button.on('click', handler, this)

    return button
  }

  preload() {
    this.load.audio('best-move', 'assets/sounds/best-move.wav')
    this.load.audio('illegal-move', 'assets/sounds/illegal-move.wav')
    this.load.audio('rotate-card', 'assets/sounds/rotate-card.wav')
  }

  repositionButtons(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    const centreX = width / 2
    const centreY = height / 2
    this.playContinuoButton.setPosition(centreX, centreY - 75)
    this.playHexagoButton.setPosition(centreX, centreY + 75)
  }

  resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
    this.repositionButtons()
  }

  create() {
    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    this.events.on('destroy', () => {
      log.debug('[HomeScene destroy]')
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientationChange)
    })

    this.eventEmitter = new Phaser.Events.EventEmitter()

    this.playContinuoButton = this.makeButton('Play Continuo', continuoCardImage, this.onPlayContinuo, [100, 100])
    this.playHexagoButton = this.makeButton('Play Hexago', hexagoCardImage, this.onPlayHexago, [173 / 2, 100])
    this.repositionButtons()

    this.hudScene = this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter))
    this.hudScene.scene.sleep()

    this.continuoBoardScene = this.game.scene.add('ContinuoBoardScene', new ContinuoBoardScene(this.eventEmitter))
    this.continuoBoardScene.scene.sleep()

    this.hexagoBoardScene = this.game.scene.add('HexagoBoardScene', new HexagoBoardScene(this.eventEmitter))
    this.hexagoBoardScene.scene.sleep()

    this.events.on('wake', this.onWake, this)
  }

  private onWake() {
    log.debug('[HomeScene#onWake]')
    this.hudScene.scene.sleep()
    this.continuoBoardScene.scene.sleep()
    this.hexagoBoardScene.scene.sleep()
  }

  public onPlayContinuo(): void {
    log.debug('[HomeScene#onPlayContinuo]')
    this.scene.sleep()
    this.continuoBoardScene.scene.wake()
    this.hudScene.scene.wake(undefined, this.continuoBoardScene)
  }

  public onPlayHexago(): void {
    log.debug('[HomeScene#onPlayHexago]')
    this.scene.sleep()
    this.hexagoBoardScene.scene.wake()
    this.hudScene.scene.wake(undefined, this.hexagoBoardScene)
  }
}
