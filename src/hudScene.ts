import * as Phaser from 'phaser'
import GridSizer from 'phaser3-rex-plugins/templates/ui/gridsizer/GridSizer'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { Settings } from './settings'
import { IBoardScene, SceneWithRexUI } from './types'
import { TurnManager, PlayerScore, Scoreboard, ScoreboardEntry, PlayerType } from './turnManager'
import { createConfirmationDialog } from './confirmationDialog'
import { createSettingsDialog } from './settingsDialog'
import { createAboutDialog } from './aboutDialog'
import { createScoreboardDialog } from './scoreboardDialog'
import * as ui from './ui'

const addColumnValues = (
  scene: SceneWithRexUI,
  gridSizer: GridSizer,
  column: number,
  scoreboard: Scoreboard,
  makeText: (entry: ScoreboardEntry) => string) => {
  scoreboard.forEach((entry, index) => {
    const text = makeText(entry)
    const child = scene.rexUI.add.label({
      text: scene.add.text(0, 0, text, ui.TEXT_STYLE_SMALL)
    })
    child.setData('column', column)
    child.setData('index', index)
    gridSizer.add(child, { column, align: column == 0 ? 'left' : 'center' })
  })
}

class MiniScoreboard {

  gridSizer: GridSizer

  public constructor(scene: SceneWithRexUI, scoreboard: Scoreboard, y: number) {
    this.gridSizer = scene.rexUI.add.gridSizer({
      x: 0,
      y,
      column: 2,
      row: scoreboard.length,
      space: { row: 10, column: 10, left: 10, right: 10, top: 10, bottom: 10 },
      anchor: { left: 'left+10' }
    })

    this.gridSizer.addBackground(ui.createLabelBackgroundWithBorder(scene))

    addColumnValues(scene, this.gridSizer, 0, scoreboard, entry => entry.playerName)
    addColumnValues(scene, this.gridSizer, 1, scoreboard, _entry => '')

    this.gridSizer
      .setInteractive({ useHandCursor: true })
      .setOrigin(.5, 0)
      .layout()
  }

  public update(scoreboard: Scoreboard) {
    scoreboard.forEach((entry, index) => {
      const childGameObject = this.gridSizer.getAllChildren().find(c => c.getData('column') == 1 && c.getData('index') == index)
      if (childGameObject) {
        const label = <RexUIPlugin.Label>childGameObject
        label.text = `${entry.score} (${entry.bestScore})`
      }
    })
    this.gridSizer.layout()
  }
}

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

  enterFullscreenButton: RexUIPlugin.Label
  leaveFullscreenButton: RexUIPlugin.Label

  currentCardScoreLabel: RexUIPlugin.Label
  remainingCardsLabel: RexUIPlugin.Label

  constructor(eventEmitter: Phaser.Events.EventEmitter, settings: Settings) {
    super('HUDScene')
    this.eventEmitter = eventEmitter
    this.settings = settings
    this.turnManager = new TurnManager(this.eventEmitter)
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

    const rotateCWButton = this.createHUDSceneButton('rotateCWButton', 'cw-arrow', .75)
    const rotateCCWButton = this.createHUDSceneButton('rotateCCWButton', 'ccw-arrow', .75)
    const placeCardButton = this.createHUDSceneButton('placeCardButton', 'checkmark', .5)

    this.lhsButtons = this.rexUI.add.sizer({
      anchor: { left: 'left+10', top: 'top+10' },
      orientation: 'vertical',
      space: { item: 10 }
    })
      .add(rotateCWButton)
      .add(rotateCCWButton)
      .add(placeCardButton)
      .layout()

    this.miniScoreboard = new MiniScoreboard(this, this.turnManager.scoreboard, this.lhsButtons.y + this.lhsButtons.height / 2 + 10)

    const homeButton = this.createHUDSceneButton('homeButton', 'house', .4)
    const scoreboardButton = this.createHUDSceneButton('scoreboardButton', 'bar-chart', .4)
    const settingsButton = this.createHUDSceneButton('settingsButton', 'gear', .4)
    const aboutButton = this.createHUDSceneButton('aboutButton', 'info', .4)

    this.rhsButtons = this.rexUI.add.sizer({
      anchor: { right: 'right-10', top: 'top+10' },
      orientation: 'vertical',
      space: { item: 10 }
    })
      .add(homeButton)
      .add(scoreboardButton)
      .add(settingsButton)
      .add(aboutButton)

    if (this.sys.game.device.fullscreen.available) {
      if (this.scale.isFullscreen) {
        this.leaveFullscreenButton = this.createHUDSceneButton('leaveFullscreenButton', 'arrows-in', .4)
        this.rhsButtons.add(this.leaveFullscreenButton)
      } else {
        this.enterFullscreenButton = this.createHUDSceneButton('enterFullscreenButton', 'arrows-out', .4)
        this.rhsButtons.add(this.enterFullscreenButton)
      }
    }

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
    this.eventEmitter.on('startRotateCard', this.onStartRotateCard, this)
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
        case 'enterFullscreenButton': return this.onEnterFullscreenClick()
        case 'leaveFullscreenButton': return this.onLeaveFullscreenClick()
      }
    })
  }

  private createHUDSceneButton(name: string, iconTexture: string, scale: number) {
    const sprite = new Phaser.GameObjects.Sprite(this, 0, 0, iconTexture).setScale(scale)
    const iconContainer = new Phaser.GameObjects.Container(this, 0, 0, [sprite])
    return this.rexUI.add.label({
      width: 35,
      height: 35,
      name,
      background: ui.createLabelBackgroundWithBorder(this),
      icon: this.add.existing(iconContainer),
      align: 'center'
    })
      .setInnerPadding(7)
      .setInteractive({ useHandCursor: true })
      .layout()
  }

  private resize(): void {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.scale.resize(windowWidth, windowHeight)
  }

  private onWake(_thisScene: Phaser.Scene, boardScene: IBoardScene) {
    log.debug('[HUDScene#onWake]')
    this.boardScene = boardScene
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

  private updateScoreboardTexts(arg: any): void {
    this.miniScoreboard.update(this.turnManager.scoreboard)
    // const scoreboard: Scoreboard = <Scoreboard>arg.scoreboard
    // scoreboard.forEach((entry, index) => {
    //   const value = `${entry.playerName}: ${entry.score} (${entry.bestScore})`
    //   const scoreboardText = this.scoreboardTexts[index]
    //   scoreboardText.setText(value)
    //   scoreboardText.setColor(entry.isCurrentPlayer ? 'red' : 'white')
    //   scoreboardText.setFontStyle(entry.isCurrentPlayer ? 'bold' : '')
    // })
  }

  private updateButtonState(): void {
    const isNoMove = this.currentPlayerScore == null
    const isComputerMove = this.currentPlayerScore?.player.type == PlayerType.Computer
    // this.rotateCWElement.disabled = isComputerMove || isNoMove
    // this.rotateCCWElement.disabled = isComputerMove || isNoMove
    // this.placeCardElement.disabled = isComputerMove || isNoMove
  }

  private endOfTurn(arg: any): void {
    const score = <number>arg.score
    const bestScore = <number>arg.bestScore
    this.turnManager.addTurnScore(this.currentPlayerScore, score, bestScore)
    this.currentPlayerScore = null
    this.clearCurrentCardScore()
    this.updateButtonState()
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

  private onRotateCWClick(): void {
    log.debug('[HUDScene#onRotateCWClick]')
    this.boardScene.onRotateCW()
  }

  private onRotateCCWClick(): void {
    log.debug('[HUDScene#onRotateCCWClick]')
    this.boardScene.onRotateCCW()
  }

  private onPlaceCardClick(): void {
    log.debug('[HUDScene#onPlaceCardClick]')
    this.boardScene.onPlaceCard()
  }

  private onNextTurn(arg: any): void {
    log.debug('[HUDScene#onNextTurn]', arg)
    this.currentPlayerScore = <PlayerScore>arg.currentPlayerScore
    this.updateScoreboardTexts(arg)
    this.updateButtonState()
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
    this.updateScoreboardTexts(arg)
    this.updateButtonState()
  }

  private onNextCard(arg: any): void {
    log.debug('[HUDScene#onNextCard]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
    this.updateButtonState()
  }

  private onMoveCard(arg: any): void {
    log.debug('[HUDScene#onMoveCard]', arg)
    this.updateCurrentCardScore(arg)
  }

  private onPlaceCard(arg: any): void {
    log.debug('[HUDScene#onPlaceCard]', arg)
    this.endOfTurn(arg)
  }

  private onStartRotateCard(arg: any): void {
    log.debug('[HUDScene#onStartRotateCard]', arg)
    // this.rotateCWElement.disabled = true
    // this.rotateCCWElement.disabled = true
    // this.placeCardElement.disabled = true
  }

  private onEndRotateCard(arg: any): void {
    log.debug('[HUDScene#onEndRotateCard]', arg)
    this.updateCurrentCardScore(arg)
    this.updateButtonState()
  }

  private onStartComputerMove(arg: any): void {
    log.debug('[HUDScene#onStartComputerMove]', arg)
    this.updateRemainingCards(arg)
    this.updateCurrentCardScore(arg)
    this.updateButtonState()
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
        this.boardScene.onRestart()
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

  private onEnterFullscreenClick(): void {
    log.debug('[HUDScene#onEnterFullscreenClick]')
    this.scale.startFullscreen()
    this.leaveFullscreenButton = this.createHUDSceneButton('leaveFullscreenButton', 'arrows-in', .4)
    this.rhsButtons
      .remove(this.enterFullscreenButton, true)
      .add(this.leaveFullscreenButton)
      .layout()
  }

  private onLeaveFullscreenClick(): void {
    log.debug('[HUDScene#onLeaveFullscreenClick]')
    this.scale.stopFullscreen()
    this.enterFullscreenButton = this.createHUDSceneButton('enterFullscreenButton', 'arrows-out', .4)
    this.rhsButtons
      .remove(this.leaveFullscreenButton, true)
      .add(this.enterFullscreenButton)
      .layout()
  }
}
