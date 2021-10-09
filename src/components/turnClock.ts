import log from 'loglevel'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from '../types'
import { EventCentre } from '../eventCentre'
import { Player, PlayerType } from '../turnManager'
import { Options } from '../options'
import { ContinuoAppEvents } from '../constants'
import * as ui from '../ui'

export class TurnClock {

  private eventCentre: EventCentre
  private options: Options
  private scene: SceneWithRexUI
  private timerEvent: Phaser.Time.TimerEvent
  private remainingTimeLabel: RexUIPlugin.Label
  private remainingTimePanel: RexUIPlugin.Sizer

  public constructor(
    eventCentre: EventCentre,
    options: Options,
    scene: SceneWithRexUI
  ) {
    this.eventCentre = eventCentre
    this.options = options
    this.scene = scene
    this.remainingTimeLabel = ui.createLabel(this.scene, '')
    this.remainingTimePanel = this.scene.rexUI.add.sizer({
      anchor: { centerX: 'center', top: 'top' },
      orientation: 'horizontal',
      space: { left: 10, right: 10, top: 10, bottom: 10 }
    })
      .add(this.remainingTimeLabel)
      .setVisible(false)
      .layout()
    this.eventCentre.on(ContinuoAppEvents.OptionsChanged, this.onOptionsChanged, this)
    this.eventCentre.on(ContinuoAppEvents.StartMove, this.onStartMove, this)
    this.eventCentre.on(ContinuoAppEvents.EndMove, this.onEndMove, this)
    this.eventCentre.on(ContinuoAppEvents.PlaceCard, this.onPlaceCard, this)
    this.eventCentre.on(ContinuoAppEvents.GameAborted, this.onGameAborted, this)
  }

  private onOptionsChanged(options: Options): void {
    log.debug('[TurnClock#onOptionsChanged]', options)
    const oldOptions = this.options
    this.options = options
    if (this.options.turnClock == 0) {
      this.killTimerEvent()
      return
    }
    if (oldOptions.turnClock != this.options.turnClock) {
      this.killTimerEvent()
      this.timerEvent = this.createTimerEvent()
    }
  }

  private onStartMove(arg: any): void {
    log.debug('[TurnClock#onStartMove]', arg)
    if (this.options.turnClock <= 0) return
    const player = <Player>arg.player
    if (player.type == PlayerType.Human) {
      this.timerEvent = this.createTimerEvent()
      this.updateRemainingTime()
    }
  }

  private onEndMove(arg: any): void {
    log.debug('[TurnClock#onEndMove]', arg)
    this.killTimerEvent()
  }

  private onPlaceCard(arg: any): void {
    log.debug('[TurnClock#onPlaceCard]', arg)
    this.killTimerEvent()
  }

  private onGameAborted(): void {
    log.debug('[TurnClock#onGameAborted]')
    this.killTimerEvent()
  }

  private updateRemainingTime(): void {
    const remainingTime = this.timerEvent.getOverallRemainingSeconds()
    this.remainingTimeLabel.text = `Remaining time: ${remainingTime}`
    const backgroundColour = remainingTime < 5 ? 0xff0000 : remainingTime < 10 ? 0xff8c00 : ui.BUTTON_BACKGROUND_COLOUR
    ui.setLabelBackgroundColour(this.remainingTimeLabel, backgroundColour)
    this.remainingTimeLabel.layout()
    this.remainingTimePanel.setVisible(true).layout()
  }

  private createTimerEvent = () => {
    return this.scene.time.addEvent({
      delay: 1000,
      repeat: this.options.turnClock - 1,
      callback: () => {
        this.updateRemainingTime()
        const remainingTime = this.timerEvent.getOverallRemainingSeconds()
        if (remainingTime == 0) {
          this.killTimerEvent()
          this.eventCentre.emit(ContinuoAppEvents.MoveTimedOut)
        }
      }
    })
  }

  private killTimerEvent(): void {
    this.remainingTimePanel.setVisible(false)
    if (this.timerEvent) {
      this.timerEvent.remove()
      this.timerEvent = null
    }
  }
}
