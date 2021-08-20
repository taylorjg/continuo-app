import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { ModalDialogBaseScene } from './modalDialogBase'
import { SceneWithRexUI } from './types'
import { Settings } from './settings'
import * as ui from './ui'

const createCheckbox = (scene: SceneWithRexUI, name: string, text: string) => {
  return scene.rexUI.add.label({
    name,
    text: scene.add.text(0, 0, text, { fontFamily: 'Arial', fontSize: '20px' }),
    icon: scene.add.container(0, 0, [
      scene.add.rectangle(0, 0, 22, 22).setStrokeStyle(2, 0xFFFFFF),
      scene.add.rectangle(0, 0, 16, 16)
    ]).setSize(22, 22),
    space: { icon: 15 }
  })
}

const createContent = (scene: SceneWithRexUI, settings: Settings): Phaser.GameObjects.GameObject => {
  const sizer = scene.rexUI.add.sizer({ orientation: 'vertical' })
  sizer.add(createSoundsPanel(scene, settings))
  return sizer.layout()
}

const createSoundsPanel = (scene: SceneWithRexUI, settings: Settings): Phaser.GameObjects.GameObject => {
  const sizer = scene.rexUI.add.sizer({ orientation: 'vertical' })
  sizer.add(scene.add.text(0, 0, 'Sounds:', { fontFamily: 'Arial', fontSize: '24px' }), { align: 'left' })
  const buttons = scene.rexUI.add.buttons({
    orientation: 'vertical',
    buttons: [
      createCheckbox(scene, 'sound-0', 'Top scoring placement of current card'),
      createCheckbox(scene, 'sound-1', 'Illegal placement of current card'),
      createCheckbox(scene, 'sound-2', 'Rotation of current card')
    ],
    type: 'checkboxes',
    setValueCallback: (button: RexUIPlugin.Label, value: boolean, previousValue: boolean) => {
      const container = <Phaser.GameObjects.Container>button.getElement('icon')
      const rectangle = <Phaser.GameObjects.Rectangle>container.getAt(1)
      rectangle.setFillStyle(value ? 0xFFFFFF : undefined)
      if (previousValue !== undefined) {
        switch (button.name) {
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
    space: { top: 20, item: 10 }
  })
  buttons.setData('sound-0', settings.soundBestScoreEnabled)
  buttons.setData('sound-1', settings.soundIllegalMoveEnabled)
  buttons.setData('sound-2', settings.soundRotationEnabled)
  sizer.add(buttons, { padding: { left: 50 } })
  return sizer.layout()
}

class SettingsDialogScene extends ModalDialogBaseScene {

  settings: Settings

  constructor(settings: Settings) {
    super('SettingsDialog')
    this.settings = settings
  }

  protected createDialogContent(): RexUIPlugin.Dialog {
    return this.rexUI.add.dialog({
      background: ui.createDialogBackground(this),
      title: this.add.text(0, 0, 'Settings', { fontFamily: 'Arial', fontSize: '24px' }),
      content: createContent(this, this.settings),
      space: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
        title: 25,
        content: 25
      },
      align: { title: 'center', actions: 'right' },
      expand: { title: false },
      click: { mode: 'release' }
    })
  }
}

export const createSettingsDialog = (parentScene: Phaser.Scene, settings: Settings): void => {
  parentScene.scene.add(undefined, new SettingsDialogScene(settings), true)
}
