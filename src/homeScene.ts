import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { HUDScene } from './hudScene'
import { ContinuoBoardScene, createContinuoCardSprite } from './continuoBoardScene'
import { HexagoBoardScene, createHexagoCardSprite } from './hexagoBoardScene'
import { BaseDialog } from './baseDialog'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

const LABEL_WIDTH = 325
const LABEL_HEIGHT = 130
const LABEL_GAP = 25

export class HomeScene extends Phaser.Scene {

  rexUI: RexUIPlugin
  eventEmitter: Phaser.Events.EventEmitter
  playContinuoLabel: RexUIPlugin.Label
  playHexagoLabel: RexUIPlugin.Label
  choosePlayersLabel: RexUIPlugin.Label
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

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)

    this.playContinuoLabel = this.rexUI.add.label({
      width: LABEL_WIDTH,
      height: LABEL_HEIGHT,
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 5, ui.BUTTON_BACKGROUND_COLOUR).setStrokeStyle(2, 0xFFFFFF),
      text: this.add.text(0, 0, 'Play Continuo', { fontSize: '24px' }),
      icon: this.add.existing(createContinuoCardSprite(this)).setScale(.4, .4),
      space: { left: 10, right: 10, top: 10, bottom: 10, icon: 10 },
      align: 'center'
    })

    this.playContinuoLabel
      .setName('playContinuo')
      .setInteractive({ useHandCursor: true })
      .layout()

    this.playHexagoLabel = this.rexUI.add.label({
      width: LABEL_WIDTH,
      height: LABEL_HEIGHT,
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 5, ui.BUTTON_BACKGROUND_COLOUR).setStrokeStyle(2, 0xFFFFFF),
      text: this.add.text(0, 0, 'Play Hexago', { fontSize: '24px' }),
      icon: this.add.existing(createHexagoCardSprite(this)).setScale(.4, .4),
      space: { left: 10, right: 10, top: 10, bottom: 10, icon: 10 },
      align: 'center'
    })

    this.playHexagoLabel
      .setName('playHexago')
      .setInteractive({ useHandCursor: true })
      .layout()

    this.choosePlayersLabel = this.rexUI.add.label({
      width: LABEL_WIDTH,
      height: LABEL_HEIGHT,
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 5, ui.BUTTON_BACKGROUND_COLOUR).setStrokeStyle(2, 0xFFFFFF),
      text: this.add.text(0, 0, 'Choose Players', { fontSize: '24px' }),
      icon: this.add.sprite(0, 0, 'group'),
      space: { left: 10, right: 10, top: 10, bottom: 10, icon: 10 },
      align: 'center'
    })

    this.choosePlayersLabel
      .setName('choosePlayers')
      .setInteractive({ useHandCursor: true })
      .layout()

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onClick, this)

    this.repositionButtons()
  }

  private repositionButtons(): void {
    const centreX = window.innerWidth / 2
    const centreY = window.innerHeight / 2
    this.playContinuoLabel.setPosition(centreX, centreY - LABEL_HEIGHT - LABEL_GAP)
    this.playHexagoLabel.setPosition(centreX, centreY)
    this.choosePlayersLabel.setPosition(centreX, centreY + LABEL_HEIGHT + LABEL_GAP)
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

  private onChoosePlayers(): void {
    log.debug('[HomeScene#onChoosePlayers]')
    new BaseDialog(this, 'ChoosePlayersDialog', (baseDialogScene: SceneWithRexUI) => {
      return baseDialogScene.rexUI.add.dialog({
        background: baseDialogScene.rexUI.add.roundRectangle(0, 0, 0, 0, 5, ui.DIALOG_BACKGROUND_COLOUR),
        content: ui.createLabel(baseDialogScene, 'Placeholder for Choose Players dialog'),
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
