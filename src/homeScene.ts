import * as Phaser from 'phaser'
import log from 'loglevel'
import { ContinuoBoardScene } from './continuoBoardScene'
import { HexagoBoardScene } from './hexagoBoardScene'
import { HUDScene } from './hudScene'
import { continuoCardImage } from './continuoCardImage'
import { hexagoCardImage } from './hexagoCardImage'

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

  private makeButton(y: number, label: string, cardImage: string, handler: Function, dims: [number, number]): HTMLButtonElement {

    const buttonElement = document.createElement('button')
    buttonElement.style.margin = '10px'
    buttonElement.style.width = '120px'
    buttonElement.style.backgroundColor = 'white'
    buttonElement.style.padding = '.5rem'
    buttonElement.style.cursor = 'pointer'

    const textElement = document.createElement('text')
    textElement.innerText = label

    const imgElement = document.createElement('img')
    imgElement.src = cardImage
    const [width, height] = dims
    imgElement.width = width
    imgElement.height = height

    buttonElement.appendChild(imgElement)
    buttonElement.appendChild(textElement)

    const button = this.add.dom(0, y, buttonElement)
    button.setOrigin(0, 0)
    button.addListener('click')
    button.on('click', handler, this)

    return buttonElement
  }

  preload() {
    this.load.audio('best-move', 'assets/sounds/best-move.wav')
    this.load.audio('illegal-move', 'assets/sounds/illegal-move.wav')
    this.load.audio('rotate-card', 'assets/sounds/rotate-card.wav')
  }

  resize() {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
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

    let y = 0

    this.playContinuoElement = this.makeButton(y, 'Play Continuo', continuoCardImage, this.onPlayContinuo, [100, 100])
    y += 150

    this.playHexagoElement = this.makeButton(y, 'Play Hexago', hexagoCardImage, this.onPlayHexago, [173 / 2, 100])
    y += 150

    // this.events.on('wake', function () {
    //   console.log('HomeScene#onWake')
    //   console.dir(arguments)
    // })
  }

  public onPlayContinuo(): void {
    log.debug('[HomeScene#onPlayContinuo]')
    this.scene.sleep()
    this.game.scene.add('BoardScene', new ContinuoBoardScene(this.eventEmitter))
    this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter))
  }

  public onPlayHexago(): void {
    log.debug('[HomeScene#onPlayHexago]')
    this.scene.sleep()
    this.game.scene.add('BoardScene', new HexagoBoardScene(this.eventEmitter))
    this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter))
  }
}
