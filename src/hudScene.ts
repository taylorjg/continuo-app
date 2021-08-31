import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { Settings } from './settings'
import { IBoardScene } from './types'
import { TurnManager, Player, PlayerScore, PlayerType } from './turnManager'
import { MiniScoreboard } from './miniScoreboard'
import { createConfirmationDialog } from './confirmationDialog'
import { createSettingsDialog } from './settingsDialog'
import { createAboutDialog } from './aboutDialog'
import { createScoreboardDialog } from './scoreboardDialog'
import { Fullscreen } from './fullscreen'
import * as ui from './ui'

export class HUDScene extends Phaser.Scene {

  rexUI: RexUIPlugin
  eventEmitter: Phaser.Events.EventEmitter
  settings: Settings
  boardScene: IBoardScene
  turnManager: TurnManager
  currentPlayerScore: PlayerScore

  lhsButtons: RexUIPlugin.Sizer
  rhsButtons: RexUIPlugin.Sizer
  statusBarLeft: RexUIPlugin.Sizer
  statusBarRight: RexUIPlugin.Sizer

  miniScoreboard: MiniScoreboard
  fullscreen: Fullscreen

  currentCardScoreLabel: RexUIPlugin.Label
  remainingCardsLabel: RexUIPlugin.Label

  constructor(eventEmitter: Phaser.Events.EventEmitter, settings: Settings) {
    super('HUDScene')
    this.eventEmitter = eventEmitter
    this.settings = settings
    this.miniScoreboard = null
    this.currentPlayerScore = null
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

    this.fullscreen = new Fullscreen(this, this.rhsButtons)

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

    this.eventEmitter.on('nextTurn', this.onNextTurn, this)
    this.eventEmitter.on('finalScores', this.onFinalScores, this)
    this.eventEmitter.on('nextCard', this.onNextCard, this)
    this.eventEmitter.on('moveCard', this.onMoveCard, this)
    this.eventEmitter.on('placeCard', this.onPlaceCard, this)
    this.eventEmitter.on('endRotateCard', this.onEndRotateCard, this)
    this.eventEmitter.on('startComputerMove', this.onStartComputerMove, this)
    this.eventEmitter.on('endComputerMove', this.onEndComputerMove, this)
    this.eventEmitter.on('settingsChanged', this.onSettingsChanged, this)

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

  private onWake(
    _scene: Phaser.Scene,
    data: {
      boardScene: IBoardScene,
      players: Player[]
    }
  ) {
    log.debug('[HUDScene#onWake]')
    this.boardScene = data.boardScene
    this.turnManager = new TurnManager(this.eventEmitter, data.players)
    if (this.miniScoreboard) {
      this.miniScoreboard.destroy()
      this.miniScoreboard = null
    }
    const miniScoreboardY = this.lhsButtons.getBounds().bottom + 10
    this.miniScoreboard = new MiniScoreboard(this, this.eventEmitter, this.turnManager.scoreboard, miniScoreboardY)
    this.turnManager.reset()
    this.turnManager.step()
  }

  private onHomeClick(): void {
    log.debug('[HUDScene#onHomeClick]')
    if (this.turnManager.isGameOver) {
      this.game.scene.wake('HomeScene')
    } else {
      createConfirmationDialog(this, () => this.game.scene.wake('HomeScene'))
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

  private endOfTurn(arg: any): void {
    const score = <number>arg.score
    const bestScore = <number>arg.bestScore
    this.turnManager.addTurnScore(this.currentPlayerScore, score, bestScore)
    this.currentPlayerScore = null
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

  private ifHumanMove(action: () => void) {
    if (this.currentPlayerScore?.player?.type == PlayerType.Human) {
      action()
    }
  }

  private onRotateCWClick(): void {
    log.debug('[HUDScene#onRotateCWClick]')
    this.ifHumanMove(() => this.boardScene.onRotateCW())
  }

  private onRotateCCWClick(): void {
    log.debug('[HUDScene#onRotateCCWClick]')
    this.ifHumanMove(() => this.boardScene.onRotateCCW())
  }

  private onPlaceCardClick(): void {
    log.debug('[HUDScene#onPlaceCardClick]')
    this.ifHumanMove(() => this.boardScene.onPlaceCard())
  }

  private onNextTurn(arg: any): void {
    log.debug('[HUDScene#onNextTurn]', arg)
    this.currentPlayerScore = <PlayerScore>arg.currentPlayerScore
    switch (this.currentPlayerScore.player.type) {
      case PlayerType.Human:
        this.boardScene.onNextCard()
        break
      case PlayerType.Computer:
        this.boardScene.onComputerMove()
        break
    }
  }

  private onFinalScores(arg: any): void {
    log.debug('[HUDScene#onFinalScores]', arg)
    this.currentPlayerScore = null
  }

  private onNextCard(arg: any): void {
    log.debug('[HUDScene#onNextCard]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
  }

  private onMoveCard(arg: any): void {
    log.debug('[HUDScene#onMoveCard]', arg)
    this.updateCurrentCardScore(arg)
  }

  private onPlaceCard(arg: any): void {
    log.debug('[HUDScene#onPlaceCard]', arg)
    this.endOfTurn(arg)
  }

  private onEndRotateCard(arg: any): void {
    log.debug('[HUDScene#onEndRotateCard]', arg)
    this.updateCurrentCardScore(arg)
  }

  private onStartComputerMove(arg: any): void {
    log.debug('[HUDScene#onStartComputerMove]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
  }

  private onEndComputerMove(arg: any): void {
    log.debug('[HUDScene#onEndComputerMove]', arg)
    this.endOfTurn(arg)
  }

  private onSettingsChanged(arg: any): void {
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
      () => {
        this.boardScene.onRestart(this.turnManager.players)
        this.turnManager.reset()
        this.turnManager.step()
      },
      () => { this.onHomeClick() }
    )
  }

  private onSettingsClick(): void {
    log.debug('[HUDScene#onSettingsClick]')
    createSettingsDialog(this, this.settings, () => {
      this.eventEmitter.emit('settingsChanged')
    })
  }

  private onAboutClick(): void {
    log.debug('[HUDScene#onAboutClick]')
    createAboutDialog(this)
  }
}
