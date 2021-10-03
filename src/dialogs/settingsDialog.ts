import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import { EventCentre } from '../eventCentre'
import { ModalDialogBaseScene } from './modalDialogBase'
import { Settings } from '../settings'
import { ContinuoAppEvents } from '../constants'
import * as ui from '../ui'

class SettingsDialogScene extends ModalDialogBaseScene {

  private settings: Settings

  public constructor(
    private eventCentre: EventCentre,
    settings: Settings,
    onCloseDialog?: () => void
  ) {
    super('SettingsDialog', () => {
      this.eventCentre.emit(ContinuoAppEvents.SettingsChanged, this.settings)
      onCloseDialog?.()
    })
    this.settings = settings
  }

  protected getDialogConfig(): Dialog.IConfig {
    return {
      title: this.add.text(0, 0, 'Settings', ui.TEXT_STYLE),
      content: this.createContent(),
      expand: { title: false }
    }
  }

  private createContent(): Phaser.GameObjects.GameObject {
    const sizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 20 }
    })
    sizer.add(this.createSoundsPanel(), { align: 'left' })
    sizer.add(this.createHintsPanel(), { align: 'left' })
    sizer.add(this.createTurnClockPanel(), { align: 'left' })
    return sizer.layout()
  }

  private createSoundsPanel(): Phaser.GameObjects.GameObject {
    const sizer = this.rexUI.add.sizer({ orientation: 'vertical' })
    sizer.add(this.add.text(0, 0, 'Sounds:', ui.TEXT_STYLE), { align: 'left' })
    const buttons = this.rexUI.add.buttons({
      orientation: 'vertical',
      buttons: [
        ui.createCheckbox(this, 'sound-0', 'Top scoring placement of current card'),
        ui.createCheckbox(this, 'sound-1', 'Illegal placement of current card'),
        ui.createCheckbox(this, 'sound-2', 'Rotation of current card')
      ],
      type: 'checkboxes',
      setValueCallback: (gameObject: Phaser.GameObjects.GameObject, value: boolean, previousValue: boolean) => {
        ui.updateCheckbox(gameObject, value)
        if (previousValue !== undefined) {
          switch (gameObject.name) {
            case 'sound-0':
              this.settings = { ...this.settings, soundBestScoreEnabled: value }
              break
            case 'sound-1':
              this.settings = { ...this.settings, soundIllegalMoveEnabled: value }
              break
            case 'sound-2':
              this.settings = { ...this.settings, soundRotationEnabled: value }
              break
          }
        }
      },
      space: { top: 10, item: 10 }
    })
    buttons.setData('sound-0', this.settings.soundBestScoreEnabled)
    buttons.setData('sound-1', this.settings.soundIllegalMoveEnabled)
    buttons.setData('sound-2', this.settings.soundRotationEnabled)
    sizer.add(buttons, { padding: { left: 50 } })
    return sizer.layout()
  }

  private createHintsPanel(): Phaser.GameObjects.GameObject {
    const sizer = this.rexUI.add.sizer({ orientation: 'vertical' })
    sizer.add(this.add.text(0, 0, 'Hints:', ui.TEXT_STYLE), { align: 'left' })
    const buttons = this.rexUI.add.buttons({
      orientation: 'vertical',
      buttons: [
        ui.createCheckbox(this, 'hint-0', 'Highlight scoring chains/wedges'),
        ui.createCheckbox(this, 'hint-1', 'Show best available score')
      ],
      type: 'checkboxes',
      setValueCallback: (gameObject: Phaser.GameObjects.GameObject, value: boolean, previousValue: boolean) => {
        ui.updateCheckbox(gameObject, value)
        if (previousValue !== undefined) {
          switch (gameObject.name) {
            case 'hint-0':
              this.settings = { ...this.settings, hintShowScoringHighlights: value }
              break
            case 'hint-1':
              this.settings = { ...this.settings, hintShowBestAvailableScore: value }
              break
          }
        }
      },
      space: { top: 10, item: 10 }
    })
    buttons.setData('hint-0', this.settings.hintShowScoringHighlights)
    buttons.setData('hint-1', this.settings.hintShowBestAvailableScore)
    sizer.add(buttons, { padding: { left: 50 } })
    return sizer.layout()
  }

  private createTurnClockPanel(): Phaser.GameObjects.GameObject {
    const sizer = this.rexUI.add.sizer({ orientation: 'vertical' })
    sizer.add(this.add.text(0, 0, 'Turn clock:', ui.TEXT_STYLE), { align: 'left' })
    const buttons = this.rexUI.add.buttons({
      orientation: 'horizontal',
      buttons: [
        ui.createRadioButton(this, 'turn-clock-off', 'Off'),
        ui.createRadioButton(this, 'turn-clock-15', '15s'),
        ui.createRadioButton(this, 'turn-clock-30', '30s'),
        ui.createRadioButton(this, 'turn-clock-60', '60s')
      ],
      type: 'radio',
      setValueCallback: (gameObject: Phaser.GameObjects.GameObject, value: boolean, previousValue: boolean) => {
        ui.updateRadioButton(gameObject, value)
        if (previousValue !== undefined && value) {
          switch (gameObject.name) {
            case 'turn-clock-off':
              this.settings = { ...this.settings, turnClock: 0 }
              break
            case 'turn-clock-15':
              this.settings = { ...this.settings, turnClock: 15 }
              break
            case 'turn-clock-30':
              this.settings = { ...this.settings, turnClock: 30 }
              break
            case 'turn-clock-60':
              this.settings = { ...this.settings, turnClock: 60 }
              break
          }
        }
      },
      space: { top: 10, item: 20 }
    })
    buttons.setData('turn-clock-off', this.settings.turnClock == 0)
    buttons.setData('turn-clock-15', this.settings.turnClock == 15)
    buttons.setData('turn-clock-30', this.settings.turnClock == 30)
    buttons.setData('turn-clock-60', this.settings.turnClock == 60)
    sizer.add(buttons, { padding: { left: 50 } })
    return sizer.layout()
  }
}

export const createSettingsDialog = (
  parentScene: Phaser.Scene,
  eventCentre: EventCentre,
  settings: Settings,
  onCloseDialog?: () => void
): void => {
  parentScene.scene.add(undefined, new SettingsDialogScene(eventCentre, settings, onCloseDialog), true)
}
