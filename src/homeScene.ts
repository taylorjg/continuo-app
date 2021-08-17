import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { HUDScene } from './hudScene'
import { ContinuoBoardScene, createContinuoCardSprite } from './continuoBoardScene'
import { HexagoBoardScene, createHexagoCardSprite } from './hexagoBoardScene'
import { ModalDialogBase } from './modalDialogBase'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

const LABEL_WIDTH = 375
const LABEL_HEIGHT = 130
const LABEL_GAP = 20

export class HomeScene extends Phaser.Scene {

  rexUI: RexUIPlugin
  eventEmitter: Phaser.Events.EventEmitter
  background: Phaser.GameObjects.TileSprite
  playContinuoButton: RexUIPlugin.Label
  playHexagoButton: RexUIPlugin.Label
  choosePlayersButton: RexUIPlugin.Label
  hudScene: Phaser.Scene
  continuoBoardScene: Phaser.Scene
  hexagoBoardScene: Phaser.Scene

  constructor() {
    super('HomeScene')
  }

  preload() {
    this.load.audio('best-move', 'assets/sounds/best-move.wav')
    this.load.audio('illegal-move', 'assets/sounds/illegal-move.wav')
    this.load.audio('rotate-card', 'assets/sounds/rotate-card.wav')

    this.load.image('linen', 'assets/images/linen.png')

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

    this.background = this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'linen').setOrigin(0, 0)

    const continuoCardSprite = createContinuoCardSprite(this).setScale(.4, .4)
    const hexagoCardSprite = createHexagoCardSprite(this).setScale(.5, .5)
    const groupSprite = new Phaser.GameObjects.Sprite(this, 0, 0, 'group')

    this.playContinuoButton = this.createButton('playContinuo', 'Play Continuo', continuoCardSprite)
    this.playHexagoButton = this.createButton('playHexago', 'Play Hexago', hexagoCardSprite)
    this.choosePlayersButton = this.createButton('choosePlayers', 'Choose Players', groupSprite)

    this.rearrange()

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onClick, this)

    this.hudScene = this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter))
    this.continuoBoardScene = this.game.scene.add('ContinuoBoardScene', new ContinuoBoardScene(this.eventEmitter))
    this.hexagoBoardScene = this.game.scene.add('HexagoBoardScene', new HexagoBoardScene(this.eventEmitter))

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)
  }

  private createButton(name: string, text: string, sprite: Phaser.GameObjects.Sprite) {
    const iconContainer = new Phaser.GameObjects.Container(this, 0, 0, [sprite]).setSize(125, 75)
    return this.rexUI.add.label({
      width: LABEL_WIDTH,
      height: LABEL_HEIGHT,
      background: ui.createLabelBackgroundWithBorder(this),
      text: this.add.text(0, 0, text, { fontSize: '24px' }),
      icon: this.add.existing(iconContainer),
      space: { left: 10, right: 10, top: 10, bottom: 10, icon: 10 }
    })
      .setName(name)
      .setInteractive({ useHandCursor: true })
      .layout()
  }

  private resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
    this.rearrange()
  }

  private rearrange(): void {
    const centreX = window.innerWidth / 2
    const centreY = window.innerHeight / 2
    this.playContinuoButton.setPosition(centreX, centreY - LABEL_HEIGHT - LABEL_GAP)
    this.playHexagoButton.setPosition(centreX, centreY)
    this.choosePlayersButton.setPosition(centreX, centreY + LABEL_HEIGHT + LABEL_GAP)
    this.background.setSize(window.innerWidth, window.innerHeight)
  }

  private onPlayContinuo(): void {
    log.debug('[HomeScene#onPlayContinuo]')
    this.play(this.continuoBoardScene)
  }

  private onPlayHexago(): void {
    log.debug('[HomeScene#onPlayHexago]')
    this.play(this.hexagoBoardScene)
  }

  private onChoosePlayers(): void {
    log.debug('[HomeScene#onChoosePlayers]')
    new ModalDialogBase(this, 'ChoosePlayersDialog', (scene: SceneWithRexUI) => {
      return scene.rexUI.add.dialog({
        background: ui.createDialogBackground(scene),
        content: ui.createLabel(scene, 'Placeholder for Choose Players dialog'),
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
    switch (gameObject.name) {
      case 'playContinuo': return this.onPlayContinuo()
      case 'playHexago': return this.onPlayHexago()
      case 'choosePlayers': return this.onChoosePlayers()
    }
  }
}
