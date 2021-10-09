import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import { EventCentre } from '../eventCentre'
import { ModalDialogBaseScene } from './modalDialogBase'
import { Options } from '../options'
import { ContinuoAppEvents } from '../constants'
import * as ui from '../ui'

class OptionsDialogScene extends ModalDialogBaseScene {

  private options: Options

  public constructor(
    private eventCentre: EventCentre,
    options: Options,
    onCloseDialog?: () => void
  ) {
    super('OptionsDialog', () => {
      this.eventCentre.emit(ContinuoAppEvents.OptionsChanged, this.options)
      onCloseDialog?.()
    })
    this.options = options
  }

  protected getDialogConfig(): Dialog.IConfig {
    return {
      title: this.add.text(0, 0, 'Options', ui.TEXT_STYLE),
      content: this.createContent(),
      expand: { title: false }
    }
  }

  private createContent(): Phaser.GameObjects.GameObject {
    const sizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 20 }
    })
    sizer.add(this.createHintsPanel(), { align: 'left' })
    sizer.add(this.createTurnClockPanel(), { align: 'left' })
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
              this.options = { ...this.options, hintShowScoringHighlights: value }
              break
            case 'hint-1':
              this.options = { ...this.options, hintShowBestAvailableScore: value }
              break
          }
        }
      },
      space: { top: 10, item: 10 }
    })
    buttons.setData('hint-0', this.options.hintShowScoringHighlights)
    buttons.setData('hint-1', this.options.hintShowBestAvailableScore)
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
              this.options = { ...this.options, turnClock: 0 }
              break
            case 'turn-clock-15':
              this.options = { ...this.options, turnClock: 15 }
              break
            case 'turn-clock-30':
              this.options = { ...this.options, turnClock: 30 }
              break
            case 'turn-clock-60':
              this.options = { ...this.options, turnClock: 60 }
              break
          }
        }
      },
      space: { top: 10, item: 20 }
    })
    buttons.setData('turn-clock-off', this.options.turnClock == 0)
    buttons.setData('turn-clock-15', this.options.turnClock == 15)
    buttons.setData('turn-clock-30', this.options.turnClock == 30)
    buttons.setData('turn-clock-60', this.options.turnClock == 60)
    sizer.add(buttons, { padding: { left: 50 } })
    return sizer.layout()
  }
}

export const createOptionsDialog = (
  parentScene: Phaser.Scene,
  eventCentre: EventCentre,
  options: Options,
  onCloseDialog?: () => void
): void => {
  parentScene.scene.add(undefined, new OptionsDialogScene(eventCentre, options, onCloseDialog), true)
}
