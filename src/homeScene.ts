import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { Settings } from './settings'
import { HUDScene } from './hudScene'
import { ContinuoBoardScene, createContinuoCardSprite } from './continuoBoardScene'
import { HexagoBoardScene, createHexagoCardSprite } from './hexagoBoardScene'
import { createChoosePlayersDialog } from './choosePlayersDialog'
import { createSettingsDialog } from './settingsDialog'
import * as ui from './ui'

const LABEL_WIDTH = 375
const LABEL_HEIGHT = 130
const LABEL_GAP = 20

export class HomeScene extends Phaser.Scene {

  rexUI: RexUIPlugin
  eventEmitter: Phaser.Events.EventEmitter
  settings: Settings
  background: Phaser.GameObjects.TileSprite
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

    this.load.image('arrows-in', 'assets/icons/10-arrows-in@2x.png')
    this.load.image('arrows-out', 'assets/icons/11-arrows-out@2x.png')
    this.load.image('bar-chart', 'assets/icons/17-bar-chart@2x.png')
    this.load.image('gear', 'assets/icons/19-gear@2x.png')
    this.load.image('info', 'assets/icons/42-info@2x.png')
    this.load.image('play', 'assets/icons/49-play@2x.png')
    this.load.image('house', 'assets/icons/53-house@2x.png')
    this.load.image('group', 'assets/icons/112-group@2x.png')
    this.load.image('checkmark', 'assets/icons/258-checkmark@2x.png')
    this.load.image('circlex', 'assets/icons/298-circlex@2x.png')
    this.load.image('cw-arrow', 'assets/icons/cw-arrow.png')
    this.load.image('ccw-arrow', 'assets/icons/ccw-arrow.png')
  }

  create() {
    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    this.eventEmitter = new Phaser.Events.EventEmitter()
    this.settings = new Settings(true, false, false, true, true)

    this.background = this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'linen').setOrigin(0, 0)

    const continuoCardSprite = createContinuoCardSprite(this).setScale(.4, .4)
    const hexagoCardSprite = createHexagoCardSprite(this).setScale(.5, .5)
    const groupSprite = new Phaser.GameObjects.Sprite(this, 0, 0, 'group')
    const gearSprite = new Phaser.GameObjects.Sprite(this, 0, 0, 'gear')

    const playContinuoButton = this.createHomeSceneButton('playContinuoButton', 'Play Continuo', continuoCardSprite)
    const playHexagoButton = this.createHomeSceneButton('playHexagoButton', 'Play Hexago', hexagoCardSprite)
    const choosePlayersButton = this.createHomeSceneButton('choosePlayersButton', 'Choose Players', groupSprite)
    const settingsButton = this.createHomeSceneButton('settingsButton', 'Settings', gearSprite)

    this.rexUI.add.sizer({
      orientation: 'vertical',
      anchor: { centerX: 'center', centerY: 'center' },
      space: { item: LABEL_GAP }
    })
      .add(playContinuoButton)
      .add(playHexagoButton)
      .add(choosePlayersButton)
      .add(settingsButton)
      .layout()

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onClick, this)

    this.hudScene = this.game.scene.add('HUDScene', new HUDScene(this.eventEmitter, this.settings))
    this.continuoBoardScene = this.game.scene.add('ContinuoBoardScene', new ContinuoBoardScene(this.eventEmitter, this.settings))
    this.hexagoBoardScene = this.game.scene.add('HexagoBoardScene', new HexagoBoardScene(this.eventEmitter, this.settings))

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)
  }

  private createHomeSceneButton(name: string, text: string, sprite: Phaser.GameObjects.Sprite) {
    const iconContainer = new Phaser.GameObjects.Container(this, 0, 0, [sprite]).setSize(125, 75)
    return this.rexUI.add.label({
      width: LABEL_WIDTH,
      height: LABEL_HEIGHT,
      background: ui.createLabelBackgroundWithBorder(this),
      text: this.add.text(0, 0, text, ui.TEXT_STYLE),
      icon: this.add.existing(iconContainer),
      space: { left: 10, right: 10, top: 10, bottom: 10, icon: 10 }
    })
      .setName(name)
      .setInteractive({ useHandCursor: true })
      .layout()
  }

  private resize(): void {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.scale.resize(windowWidth, windowHeight)
    this.background.setSize(windowWidth, windowHeight)
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
    createChoosePlayersDialog(this)
  }

  private onSettings(): void {
    log.debug('[HomeScene#onSettings]')
    createSettingsDialog(this, this.settings)
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
      case 'playContinuoButton': return this.onPlayContinuo()
      case 'playHexagoButton': return this.onPlayHexago()
      case 'choosePlayersButton': return this.onChoosePlayers()
      case 'settingsButton': return this.onSettings()
    }
  }
}
