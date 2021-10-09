import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { EventCentre } from '../eventCentre'
import { Options, DEFAULT_OPTIONS } from '../options'
import { Settings, DEFAULT_SETTINGS } from '../settings'
import { BoardBackgroundScene } from './boardBackgroundScene'
import { HUDScene } from './hudScene'
import { ContinuoBoardScene, createContinuoCardSprite } from './continuoBoardScene'
import { HexagoBoardScene, createHexagoCardSprite } from './hexagoBoardScene'
import { Player, DEFAULT_PLAYERS } from '../turnManager'
import { createAboutDialog } from '../dialogs/aboutDialog'
import { createPlayersDialog } from '../dialogs/playersDialog'
import { createOptionsDialog } from '../dialogs/optionsDialog'
import { createSettingsDialog } from '../dialogs/settingsDialog'
import { Fullscreen } from '../components/fullscreen'
import { ContinuoAppScenes, ContinuoAppEvents } from '../constants'
import * as ui from '../ui'

export class HomeScene extends Phaser.Scene {

  public rexUI: RexUIPlugin
  private eventCentre: EventCentre
  private options: Options
  private settings: Settings
  private players: readonly Player[]
  private background: Phaser.GameObjects.TileSprite
  private boardBackgroundScene: Phaser.Scene
  private hudScene: Phaser.Scene
  private continuoBoardScene: Phaser.Scene
  private hexagoBoardScene: Phaser.Scene

  constructor() {
    super(ContinuoAppScenes.Home)
  }

  preload() {
    this.load.audio('best-move', 'assets/sounds/best-move.wav')
    this.load.audio('illegal-move', 'assets/sounds/illegal-move.wav')
    this.load.audio('rotate-card', 'assets/sounds/rotate-card.wav')

    this.load.image('linen', 'assets/images/linen.png')
    this.load.image('melamine-wood', 'assets/images/Melamine-wood-005-rotated.png')
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

    this.eventCentre = new EventCentre()
    this.options = DEFAULT_OPTIONS
    this.settings = DEFAULT_SETTINGS
    this.players = DEFAULT_PLAYERS

    this.background = this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'linen').setOrigin(0, 0)

    const continuoCardSprite = createContinuoCardSprite(this).setScale(.4, .4)
    const hexagoCardSprite = createHexagoCardSprite(this).setScale(.5, .5)
    const groupSprite = new Phaser.GameObjects.Sprite(this, 0, 0, 'group')
    const group2Sprite = new Phaser.GameObjects.Sprite(this, 0, 0, 'group')

    const playContinuoButton = ui.createHomeSceneButton(this, 'playContinuoButton', 'Play Continuo', continuoCardSprite)
    const playHexagoButton = ui.createHomeSceneButton(this, 'playHexagoButton', 'Play Hexago', hexagoCardSprite)
    const playersButton = ui.createHomeSceneButton(this, 'playersButton', 'Players', groupSprite)
    const optionsButton = ui.createHomeSceneButton(this, 'optionsButton', 'Game Options', group2Sprite)

    this.rexUI.add.sizer({
      orientation: 'vertical',
      anchor: { centerX: 'center', centerY: 'center' },
      space: { item: 20 }
    })
      .add(playContinuoButton)
      .add(playHexagoButton)
      .add(playersButton)
      .add(optionsButton)
      .layout()

    const settingsButton = ui.createHUDSceneButton(this, 'settingsButton', 'gear', .4)
    const aboutButton = ui.createHUDSceneButton(this, 'aboutButton', 'info', .4)

    const rhsButtons = this.rexUI.add.sizer({
      anchor: { right: 'right-10', top: 'top+10' },
      orientation: 'vertical',
      space: { item: 10 }
    })
      .add(settingsButton)
      .add(aboutButton)
    new Fullscreen(this, rhsButtons)
    rhsButtons.layout()

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onClick, this)

    this.boardBackgroundScene = this.scene.add(undefined, new BoardBackgroundScene())
    this.hudScene = this.scene.add(undefined, new HUDScene(this.eventCentre))
    this.continuoBoardScene = this.scene.add(undefined, new ContinuoBoardScene(this.eventCentre))
    this.hexagoBoardScene = this.scene.add(undefined, new HexagoBoardScene(this.eventCentre))

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)

    this.eventCentre.on(ContinuoAppEvents.OptionsChanged, this.onOptionsChanged, this)
    this.eventCentre.on(ContinuoAppEvents.SettingsChanged, this.onSettingsChanged, this)
    this.eventCentre.on(ContinuoAppEvents.PlayersChanged, this.onPlayersChanged, this)
  }

  private resize(): void {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.scale.resize(windowWidth, windowHeight)
    this.background.setSize(windowWidth, windowHeight)
  }

  private onPlayContinuoClick(): void {
    log.debug('[HomeScene#onPlayContinuoClick]')
    this.play(this.continuoBoardScene)
  }

  private onPlayHexagoClick(): void {
    log.debug('[HomeScene#onPlayHexagoClick]')
    this.play(this.hexagoBoardScene)
  }

  private onPlayersClick(): void {
    log.debug('[HomeScene#onPlayersClick]')
    this.presentPlayersDialog()
  }

  private onPlayersChanged(players: readonly Player[]): void {
    log.debug('[HomeScene#onPlayersChanged]', players)
    this.players = players
  }

  private onOptionsClick(): void {
    log.debug('[HomeScene#onOptionsClick]')
    this.presentOptionsDialog()
  }

  private onOptionsChanged(options: Options): void {
    log.debug('[HomeScene#onOptionsChanged]', options)
    this.options = options
  }

  private onSettingsClick(): void {
    log.debug('[HomeScene#onSettingsClick]')
    this.presentSettingsDialog()
  }

  private onSettingsChanged(settings: Settings): void {
    log.debug('[HomeScene#onSettingsChanged]', settings)
    this.settings = settings
  }

  private onWake(): void {
    log.debug('[HomeScene#onWake]')
    this.sleepIfActive(this.boardBackgroundScene)
    this.sleepIfActive(this.hudScene)
    this.sleepIfActive(this.continuoBoardScene)
    this.sleepIfActive(this.hexagoBoardScene)
  }

  private play(boardScene: Phaser.Scene): void {
    this.scene.sleep()
    const data = {
      options: this.options,
      settings: this.settings,
      players: this.players
    }
    this.runIfNotRunBefore(this.boardBackgroundScene)
    this.runIfNotRunBefore(this.hudScene)
    this.runIfNotRunBefore(boardScene)
    this.scene.wake(this.boardBackgroundScene)
    this.scene.wake(boardScene, data)
    this.scene.wake(this.hudScene, data)
  }

  private sleepIfActive(scene: Phaser.Scene): void {
    if (this.scene.isActive(scene)) {
      this.scene.sleep(scene)
    }
  }

  private runIfNotRunBefore(scene: Phaser.Scene): void {
    if (!this.scene.isSleeping(scene)) {
      this.scene.run(scene)
    }
  }

  private onClick(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    _event: Phaser.Types.Input.EventData
  ): void {
    switch (gameObject.name) {
      case 'playContinuoButton': return this.onPlayContinuoClick()
      case 'playHexagoButton': return this.onPlayHexagoClick()
      case 'playersButton': return this.onPlayersClick()
      case 'optionsButton': return this.onOptionsClick()
      case 'settingsButton': return this.onSettingsClick()
      case 'aboutButton': return this.onAboutClick()
    }
  }

  private onAboutClick(): void {
    this.presentAboutDialog()
  }

  private presentPlayersDialog(): void {
    createPlayersDialog(this, this.eventCentre, this.players)
  }

  private presentOptionsDialog(): void {
    createOptionsDialog(this, this.eventCentre, this.options)
  }

  private presentSettingsDialog(): void {
    createSettingsDialog(this, this.eventCentre, this.settings)
  }

  private presentAboutDialog(): void {
    createAboutDialog(this)
  }
}
