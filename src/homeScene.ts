import * as Phaser from 'phaser'
import log from 'loglevel'
import { HUDScene } from './hudScene'
import { ContinuoBoardScene } from './continuoBoardScene'
import { HexagoBoardScene } from './hexagoBoardScene'
import { continuoCardImage } from './continuoCardImage'
import { hexagoCardImage } from './hexagoCardImage'
import { BaseDialog } from './baseDialog'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

export class HomeScene extends Phaser.Scene {

  eventEmitter: Phaser.Events.EventEmitter
  playContinuoButton: Phaser.GameObjects.DOMElement
  playHexagoButton: Phaser.GameObjects.DOMElement
  playersButton: Phaser.GameObjects.Sprite
  hudScene: Phaser.Scene
  continuoBoardScene: Phaser.Scene
  hexagoBoardScene: Phaser.Scene

  constructor() {
    super('HomeScene')
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
    this.load.image('house', 'assets/icons/53-house@2x.png')
    this.load.image('group', 'assets/icons/112-group@2x.png')
    this.load.image('circlex', 'assets/icons/298-circlex@2x.png')
  }

  create() {
    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    this.eventEmitter = new Phaser.Events.EventEmitter()

    this.hudScene = this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter))
    this.continuoBoardScene = this.game.scene.add('ContinuoBoardScene', new ContinuoBoardScene(this.eventEmitter))
    this.hexagoBoardScene = this.game.scene.add('HexagoBoardScene', new HexagoBoardScene(this.eventEmitter))

    this.events.on('wake', this.onWake, this)

    this.playContinuoButton = this.makeButton('Play Continuo', continuoCardImage, this.onPlayContinuo, [100, 100])
    this.playHexagoButton = this.makeButton('Play Hexago', hexagoCardImage, this.onPlayHexago, [173 / 2, 100])

    this.playersButton = this.add.sprite(0, 0, 'group')
    this.playersButton.setOrigin(1, 0)
    this.playersButton.setInteractive({ useHandCursor: true })
    this.playersButton.name = 'playersButton'

    this.input.on('gameobjectdown', this.onClick, this)

    this.repositionButtons()
  }

  private repositionButtons(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    const centreX = width / 2
    const centreY = height / 2
    this.playContinuoButton.setPosition(centreX, centreY - 75)
    this.playHexagoButton.setPosition(centreX, centreY + 75)
    this.playersButton.setPosition(width - 10, 10)
  }

  private resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
    this.repositionButtons()
  }

  private onPlayContinuo(): void {
    log.debug('[HomeScene#onPlayContinuo]')
    this.play(this.continuoBoardScene)
  }

  private onPlayHexago(): void {
    log.debug('[HomeScene#onPlayHexago]')
    this.play(this.hexagoBoardScene)
  }

  private onWake(): void {
    log.debug('[HomeScene#onWake]')
    this.sleepIfActive(this.hudScene)
    this.sleepIfActive(this.continuoBoardScene)
    this.sleepIfActive(this.hexagoBoardScene)
  }

  private play(boardScene: Phaser.Scene): void {
    this.scene.sleep()
    this.launchIfNotSleeping(boardScene)
    this.launchIfNotSleeping(this.hudScene)
    this.scene.wake(boardScene)
    this.scene.wake(this.hudScene, boardScene)
  }

  private sleepIfActive(scene: Phaser.Scene): void {
    if (this.scene.isActive(scene)) {
      this.scene.sleep(scene)
    }
  }

  private launchIfNotSleeping(scene: Phaser.Scene): void {
    if (!this.scene.isSleeping(scene)) {
      this.scene.launch(scene)
    }
  }

  private onClick(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    _event: Phaser.Types.Input.EventData
  ): void {
    if (gameObject.name == 'playersButton') {
      new BaseDialog(this, 'PlayersDialog', (baseDialogScene: SceneWithRexUI) => {
        return baseDialogScene.rexUI.add.dialog({
          background: baseDialogScene.rexUI.add.roundRectangle(0, 0, 0, 0, 5, ui.DIALOG_BACKGROUND_COLOUR),
          content: ui.createLabel(baseDialogScene, 'Placeholder for Players dialog'),
          space: {
            left: 20,
            right: 20,
            top: 20,
            bottom: 20,
            content: 25
          },
          align: { title: 'center', actions: 'right' },
          click: { mode: 'release' }
        })
      })
    }
  }
}
