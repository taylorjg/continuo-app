import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { EventCentre } from './eventCentre'
import { DEFAULT_SETTINGS, Settings } from './settings'
import { TurnClock } from './turnClock'
import { Scoreboard, TurnManager, Player, PlayerType, DEFAULT_PLAYERS } from './turnManager'
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
  private eventCentre: EventCentre
  private turnManager: TurnManager
  private turnClock: TurnClock
  private settings: Settings
  private players: readonly Player[]
  private currentPlayer: Player
  private scoreboard: Scoreboard
  private isGameOver: boolean

  private lhsButtons: RexUIPlugin.Sizer
  private rhsButtons: RexUIPlugin.Sizer
  private miniScoreboard: MiniScoreboard
  private statusBarLeft: RexUIPlugin.Sizer
  private statusBarRight: RexUIPlugin.Sizer

  private currentCardScoreLabel: RexUIPlugin.Label
  private remainingCardsLabel: RexUIPlugin.Label

  public constructor(eventCentre: EventCentre) {
    super(ContinuoAppScenes.HUD)
    this.eventCentre = eventCentre
    this.miniScoreboard = null
    this.settings = DEFAULT_SETTINGS
    this.players = DEFAULT_PLAYERS
    this.currentPlayer = null
    this.scoreboard = null
    this.isGameOver = true
    this.turnManager = new TurnManager(eventCentre)
    this.turnClock = null
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
    this.miniScoreboard = new MiniScoreboard(this.eventCentre, this, miniScoreboardY)

    this.turnClock = new TurnClock(this.eventCentre, this)

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

    this.eventCentre.on(ContinuoAppEvents.NextTurn, this.onNextTurn, this)
    this.eventCentre.on(ContinuoAppEvents.CardMoved, this.onCardMovedOrRotated, this)
    this.eventCentre.on(ContinuoAppEvents.CardRotated, this.onCardMovedOrRotated, this)
    this.eventCentre.on(ContinuoAppEvents.StartMove, this.onStartMove, this)
    this.eventCentre.on(ContinuoAppEvents.EndMove, this.onEndMove, this)
    this.eventCentre.on(ContinuoAppEvents.GameOver, this.onGameOver, this)
    this.eventCentre.on(ContinuoAppEvents.ScoreboardUpdated, this.onScoreboardUpdated, this)
    this.eventCentre.on(ContinuoAppEvents.SettingsChanged, this.onSettingsChanged, this)

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

  private onWake(_scene: Phaser.Scene, data: {
    settings: Settings,
    players: readonly Player[]
  }) {
    log.debug('[HUDScene#onWake]', data)
    this.settings = data.settings
    this.players = data.players
    this.scoreboard = null
    this.isGameOver = false
    this.eventCentre.emit(ContinuoAppEvents.NewGame, this.players)
    this.eventCentre.emit(ContinuoAppEvents.ReadyForNextTurn)
  }

  private onHomeClick(): void {
    log.debug('[HUDScene#onHomeClick]')
    if (this.isGameOver) {
      this.game.scene.wake(ContinuoAppScenes.Home)
    } else {
      const onYes = () => {
        this.game.scene.wake(ContinuoAppScenes.Home)
        this.eventCentre.emit(ContinuoAppEvents.GameAborted)
      }
      createConfirmationDialog(this, onYes)
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
    this.ifHumanMove(() => this.eventCentre.emit(ContinuoAppEvents.RotateCW))
  }

  private onRotateCCWClick(): void {
    log.debug('[HUDScene#onRotateCCWClick]')
    this.ifHumanMove(() => this.eventCentre.emit(ContinuoAppEvents.RotateCCW))
  }

  private onPlaceCardClick(): void {
    log.debug('[HUDScene#onPlaceCardClick]')
    this.ifHumanMove(() => this.eventCentre.emit(ContinuoAppEvents.PlaceCard))
  }

  private onNextTurn(player: Player): void {
    log.debug('[HUDScene#onNextTurn]', player)
    this.currentPlayer = player
  }

  private onStartMove(arg: any): void {
    log.debug('[HUDScene#onStartMove]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
  }

  private onEndMove(arg: any): void {
    log.debug('[HUDScene#onEndMove]', arg)
    this.currentPlayer = null
    this.clearCurrentCardScore()
    this.time.delayedCall(1000, () => {
      if (!this.isGameOver) {
        this.eventCentre.emit(ContinuoAppEvents.ReadyForNextTurn)
      }
    })
  }

  private onGameOver(scoreboard: Scoreboard): void {
    log.debug('[HUDScene#onGameOver]', scoreboard)
    this.isGameOver = true
    this.presentScoreboardDialog()
  }

  private onScoreboardUpdated(scoreboard: Scoreboard): void {
    log.debug('[HUDScene#onScoreboardUpdated]', scoreboard)
    this.scoreboard = scoreboard
  }

  private onCardMovedOrRotated(arg: any): void {
    log.debug('[HUDScene#onCardMovedOrRotated]', arg)
    this.updateCurrentCardScore(arg)
  }

  private onSettingsChanged(settings: Settings): void {
    log.debug('[HUDScene#onSettingsChanged]', settings)
    this.settings = settings
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
    this.presentScoreboardDialog()
  }

  private onSettingsClick(): void {
    log.debug('[HUDScene#onSettingsClick]')
    this.presentSettingsDialog()
  }

  private onAboutClick(): void {
    log.debug('[HUDScene#onAboutClick]')
    this.presentAboutDialog()
  }

  private presentScoreboardDialog(): void {

    const onPlayAgain = () => {
      this.eventCentre.emit(ContinuoAppEvents.NewGame, this.players)
      this.eventCentre.emit(ContinuoAppEvents.ReadyForNextTurn)
    }

    const onHome = () => {
      this.onHomeClick()
    }

    createScoreboardDialog(this, this.scoreboard, this.isGameOver, onPlayAgain, onHome)
  }

  private presentSettingsDialog(): void {
    createSettingsDialog(this, this.eventCentre, this.settings)
  }

  private presentAboutDialog(): void {
    createAboutDialog(this)
  }
}
