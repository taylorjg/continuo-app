import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import { ModalDialogBaseScene } from './modalDialogBase'
import { SceneWithRexUI } from './types'
import { Settings } from './settings'
import * as ui from './ui'

const createContent = (scene: SceneWithRexUI, settings: Settings): Phaser.GameObjects.GameObject => {
  const sizer = scene.rexUI.add.sizer({
    orientation: 'vertical',
    space: { item: 20 }
  })
  sizer.add(createSoundsPanel(scene, settings), { align: 'left' })
  sizer.add(createHintsPanel(scene, settings), { align: 'left' })
  return sizer.layout()
}

const createSoundsPanel = (scene: SceneWithRexUI, settings: Settings): Phaser.GameObjects.GameObject => {
  const sizer = scene.rexUI.add.sizer({ orientation: 'vertical' })
  sizer.add(scene.add.text(0, 0, 'Sounds:', ui.TEXT_STYLE), { align: 'left' })
  const buttons = scene.rexUI.add.buttons({
    orientation: 'vertical',
    buttons: [
      ui.createCheckbox(scene, 'sound-0', 'Top scoring placement of current card'),
      ui.createCheckbox(scene, 'sound-1', 'Illegal placement of current card'),
      ui.createCheckbox(scene, 'sound-2', 'Rotation of current card')
    ],
    type: 'checkboxes',
    setValueCallback: (gameObject: Phaser.GameObjects.GameObject, value: boolean, previousValue: boolean) => {
      ui.updateCheckbox(gameObject, value)
      if (previousValue !== undefined) {
        switch (gameObject.name) {
          case 'sound-0':
            settings.soundBestScoreEnabled = value
            break
          case 'sound-1':
            settings.soundIllegalMoveEnabled = value
            break
          case 'sound-2':
            settings.soundRotationEnabled = value
            break
        }
      }
    },
    space: { top: 10, item: 10 }
  })
  buttons.setData('sound-0', settings.soundBestScoreEnabled)
  buttons.setData('sound-1', settings.soundIllegalMoveEnabled)
  buttons.setData('sound-2', settings.soundRotationEnabled)
  sizer.add(buttons, { padding: { left: 50 } })
  return sizer.layout()
}

const createHintsPanel = (scene: SceneWithRexUI, settings: Settings): Phaser.GameObjects.GameObject => {
  const sizer = scene.rexUI.add.sizer({ orientation: 'vertical' })
  sizer.add(scene.add.text(0, 0, 'Hints:', ui.TEXT_STYLE), { align: 'left' })
  const buttons = scene.rexUI.add.buttons({
    orientation: 'vertical',
    buttons: [
      ui.createCheckbox(scene, 'hint-0', 'Highlight scoring chains/wedges'),
      ui.createCheckbox(scene, 'hint-1', 'Show best available score')
    ],
    type: 'checkboxes',
    setValueCallback: (gameObject: Phaser.GameObjects.GameObject, value: boolean, previousValue: boolean) => {
      ui.updateCheckbox(gameObject, value)
      if (previousValue !== undefined) {
        switch (gameObject.name) {
          case 'hint-0':
            settings.hintShowScoringHighlights = value
            break
          case 'hint-1':
            settings.hintShowBestAvailableScore = value
            break
        }
      }
    },
    space: { top: 10, item: 10 }
  })
  buttons.setData('hint-0', settings.hintShowScoringHighlights)
  buttons.setData('hint-1', settings.hintShowBestAvailableScore)
  sizer.add(buttons, { padding: { left: 50 } })
  return sizer.layout()
}

class SettingsDialogScene extends ModalDialogBaseScene {

  settings: Settings

  constructor(settings: Settings) {
    super('SettingsDialog')
    this.settings = settings
  }

  protected getDialogConfig(): Dialog.IConfig {
    return {
      title: this.add.text(0, 0, 'Settings', ui.TEXT_STYLE),
      content: createContent(this, this.settings),
      expand: { title: false }
    }
  }
}

export const createSettingsDialog = (parentScene: Phaser.Scene, settings: Settings): void => {
  parentScene.scene.add(undefined, new SettingsDialogScene(settings), true)
}
