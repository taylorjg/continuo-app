import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { Settings } from './settings'
import { TurnManager, Player, PlayerType } from './turnManager'
import { MiniScoreboard } from './miniScoreboard'
import { createConfirmationDialog } from './confirmationDialog'
import { createSettingsDialog } from './settingsDialog'
import { createAboutDialog } from './aboutDialog'
import { createScoreboardDialog } from './scoreboardDialog'
import { Fullscreen } from './fullscreen'
import { ContinuoAppScenes, ContinuoAppEvents } from './constants'
import * as ui from './ui'

export class HUDScene extends Phaser.Scene {

  rexUI: RexUIPlugin
  private eventEmitter: Phaser.Events.EventEmitter
  private settings: Settings
  private turnManager: TurnManager
  private currentPlayer: Player
  private players: readonly Player[]

  private lhsButtons: RexUIPlugin.Sizer
  private rhsButtons: RexUIPlugin.Sizer
  private miniScoreboard: MiniScoreboard
  private statusBarLeft: RexUIPlugin.Sizer
  private statusBarRight: RexUIPlugin.Sizer

  private currentCardScoreLabel: RexUIPlugin.Label
  private remainingCardsLabel: RexUIPlugin.Label

  public constructor(eventEmitter: Phaser.Events.EventEmitter, settings: Settings) {
    super(ContinuoAppScenes.HUD)
    this.eventEmitter = eventEmitter
    this.settings = settings
    this.miniScoreboard = null
    this.currentPlayer = null
    this.players = []
    this.turnManager = new TurnManager(eventEmitter)
  }

  public init() {
    log.debug('[HUDScene#init]')
  }

  public create() {
    log.debug('[HUDScene#create]')

    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    const rotateCWButton = ui.createHUDSceneButton(this, 'rotateCWButton', 'cw-arrow', .75)
    const rotateCCWButton = ui.createHUDSceneButton(this, 'rotateCCWButton', 'ccw-arrow', .75)
    const placeCardButton = ui.createHUDSceneButton(this, 'placeCardButton', 'checkmark', .5)

    this.lhsButtons = this.rexUI.add.sizer({
      anchor: { left: 'left+10', top: 'top+10' },
      orientation: 'vertical',
      space: { item: 10 }
    })
      .add(rotateCWButton)
      .add(rotateCCWButton)
      .add(placeCardButton)
      .layout()

    const miniScoreboardY = this.lhsButtons.getBounds().bottom + 10
    this.miniScoreboard = new MiniScoreboard(this.eventEmitter, this, miniScoreboardY)

    const homeButton = ui.createHUDSceneButton(this, 'homeButton', 'house', .4)
    const scoreboardButton = ui.createHUDSceneButton(this, 'scoreboardButton', 'bar-chart', .4)
    const settingsButton = ui.createHUDSceneButton(this, 'settingsButton', 'gear', .4)
    const aboutButton = ui.createHUDSceneButton(this, 'aboutButton', 'info', .4)

    this.rhsButtons = this.rexUI.add.sizer({
      anchor: { right: 'right-10', top: 'top+10' },
      orientation: 'vertical',
      space: { item: 10 }
    })
      .add(homeButton)
      .add(scoreboardButton)
      .add(settingsButton)
      .add(aboutButton)

    new Fullscreen(this, this.rhsButtons)

    this.rhsButtons.layout()

    this.currentCardScoreLabel = ui.createLabel(this, '')
    this.remainingCardsLabel = ui.createLabel(this, '')

    this.statusBarLeft = this.rexUI.add.sizer({
      anchor: { left: 'left', bottom: 'bottom' },
      orientation: 'horizontal',
      space: { left: 10, right: 10, top: 10, bottom: 10 }
    })
      .add(this.currentCardScoreLabel)
      .layout()

    this.statusBarRight = this.rexUI.add.sizer({
      anchor: { right: 'right', bottom: 'bottom' },
      orientation: 'horizontal',
      space: { left: 10, right: 10, top: 10, bottom: 10 }
    })
      .add(this.remainingCardsLabel)
      .layout()

    this.eventEmitter.on(ContinuoAppEvents.NextTurn, this.onNextTurn, this)
    this.eventEmitter.on(ContinuoAppEvents.CardMoved, this.onCardMovedOrRotated, this)
    this.eventEmitter.on(ContinuoAppEvents.CardRotated, this.onCardMovedOrRotated, this)
    this.eventEmitter.on(ContinuoAppEvents.StartMove, this.onStartMove, this)
    this.eventEmitter.on(ContinuoAppEvents.EndMove, this.onEndMove, this)
    this.eventEmitter.on(ContinuoAppEvents.SettingsChanged, this.onSettingsChanged, this)

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.GameObject,
      _event: Phaser.Types.Input.EventData) => {
      switch (gameObject.name) {
        case 'rotateCWButton': return this.onRotateCWClick()
        case 'rotateCCWButton': return this.onRotateCCWClick()
        case 'placeCardButton': return this.onPlaceCardClick()
        case 'homeButton': return this.onHomeClick()
        case 'scoreboardButton': return this.onScoreboardClick()
        case 'settingsButton': return this.onSettingsClick()
        case 'aboutButton': return this.onAboutClick()
      }
    })
  }

  private resize(): void {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.scale.resize(windowWidth, windowHeight)
  }

  private onWake(_scene: Phaser.Scene, players: readonly Player[]) {
    log.debug('[HUDScene#onWake]', players)
    this.players = players
    this.miniScoreboard.updatePlayers(this.players)
    this.eventEmitter.emit(ContinuoAppEvents.NewGame, this.players)
  }

  private onHomeClick(): void {
    log.debug('[HUDScene#onHomeClick]')
    if (this.turnManager.isGameOver) {
      this.game.scene.wake(ContinuoAppScenes.Home)
    } else {
      createConfirmationDialog(this, () => this.game.scene.wake(ContinuoAppScenes.Home))
    }
  }

  private updateRemainingCards(arg: any): void {
    const numCardsLeft: number = <number>arg.numCardsLeft
    this.remainingCardsLabel.text = `Remaining cards: ${numCardsLeft}`
    this.statusBarRight.layout()
  }

  private updateCurrentCardScore(arg: any): void {

    const score: number = <number>arg.score
    const bestScore: number = <number>arg.bestScore
    const bestScoreLocationCount: number = <number>arg.bestScoreLocationCount

    const textWithHint = `${score} (${bestScore}/${bestScoreLocationCount})`
    const textWithoutHint = `${score}`

    this.currentCardScoreLabel.setData('textWithHint', textWithHint)
    this.currentCardScoreLabel.setData('textWithoutHint', textWithoutHint)

    if (this.settings.hintShowBestAvailableScore) {
      this.currentCardScoreLabel.text = textWithHint
    } else {
      this.currentCardScoreLabel.text = textWithoutHint
    }
    this.statusBarLeft.setVisible(true)
    this.statusBarLeft.layout()
  }

  private clearCurrentCardScore(): void {
    this.statusBarLeft.setVisible(false)
  }

  private ifHumanMove(action: () => void) {
    if (this.currentPlayer?.type == PlayerType.Human) {
      action()
    }
  }

  private onRotateCWClick(): void {
    log.debug('[HUDScene#onRotateCWClick]')
    this.ifHumanMove(() => this.eventEmitter.emit(ContinuoAppEvents.RotateCW))
  }

  private onRotateCCWClick(): void {
    log.debug('[HUDScene#onRotateCCWClick]')
    this.ifHumanMove(() => this.eventEmitter.emit(ContinuoAppEvents.RotateCCW))
  }

  private onPlaceCardClick(): void {
    log.debug('[HUDScene#onPlaceCardClick]')
    this.ifHumanMove(() => this.eventEmitter.emit(ContinuoAppEvents.PlaceCard))
  }

  private onNextTurn(currentPlayer: Player): void {
    log.debug('[HUDScene#onNextTurn]', currentPlayer)
    this.currentPlayer = currentPlayer
  }

  private onStartMove(arg: any): void {
    log.debug('[HUDScene#onStartMove]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
  }

  private onEndMove(arg: any): void {
    log.debug('[HUDScene#onEndMove]', arg)
    const score = <number>arg.score
    const bestScore = <number>arg.bestScore
    this.turnManager.addTurnScore(this.currentPlayer, score, bestScore)
    this.currentPlayer = null
    this.clearCurrentCardScore()
    setTimeout(() => {
      const numCardsLeft = <number>arg.numCardsLeft
      if (numCardsLeft == 0) {
        this.turnManager.gameOver()
        this.onScoreboardClick()
      } else {
        this.turnManager.step()
      }
    }, 1000)
  }

  private onCardMovedOrRotated(arg: any): void {
    log.debug('[HUDScene#onCardMovedOrRotated]', arg)
    this.updateCurrentCardScore(arg)
  }

  private onSettingsChanged(): void {
    log.debug('[HUDScene#onSettingsChanged]')
    const textWithHint = this.currentCardScoreLabel.getData('textWithHint') || ''
    const textWithoutHint = this.currentCardScoreLabel.getData('textWithoutHint') || ''
    if (this.settings.hintShowBestAvailableScore) {
      this.currentCardScoreLabel.text = textWithHint
    } else {
      this.currentCardScoreLabel.text = textWithoutHint
    }
    this.statusBarLeft.layout()
  }

  private onScoreboardClick(): void {
    log.debug('[HUDScene#onScoreboardClick]')
    createScoreboardDialog(
      this,
      this.turnManager.scoreboard,
      this.turnManager.isGameOver,
      () => { this.eventEmitter.emit(ContinuoAppEvents.NewGame, this.players) },
      () => { this.onHomeClick() }
    )
  }

  private onSettingsClick(): void {
    log.debug('[HUDScene#onSettingsClick]')
    createSettingsDialog(this, this.settings, () => {
      this.eventEmitter.emit(ContinuoAppEvents.SettingsChanged)
    })
  }

  private onAboutClick(): void {
    log.debug('[HUDScene#onAboutClick]')
    createAboutDialog(this)
  }
}
