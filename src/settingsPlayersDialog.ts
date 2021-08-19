import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { ModalDialogBaseScene } from './modalDialogBase'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

const createCheckbox = (scene: SceneWithRexUI, name: string, text: string) => {
  return scene.rexUI.add.label({
    name,
    text: scene.add.text(0, 0, text, { fontSize: '20px' }),
    icon: scene.add.container(0, 0, [
      scene.add.rectangle(0, 0, 22, 22).setStrokeStyle(2, 0xFFFFFF),
      scene.add.rectangle(0, 0, 16, 16)
    ]).setSize(22, 22),
    space: { icon: 15 }
  })
}

const createContent = (scene: SceneWithRexUI): Phaser.GameObjects.GameObject => {
  const sizer = scene.rexUI.add.sizer({ orientation: 'vertical' })
  sizer.add(createSoundsPanel(scene))
  return sizer.layout()
}

const createSoundsPanel = (scene: SceneWithRexUI): Phaser.GameObjects.GameObject => {
  const sizer = scene.rexUI.add.sizer({ orientation: 'vertical' })
  sizer.add(scene.add.text(0, 0, 'Sounds:', { fontSize: '24px' }), { align: 'left' })
  sizer.add(scene.rexUI.add.buttons({
    orientation: 'vertical',
    buttons: [
      createCheckbox(scene, 'sound-0', 'Top scoring placement of current card'),
      createCheckbox(scene, 'sound-1', 'Illegal placement of current card'),
      createCheckbox(scene, 'sound-2', 'Rotation of current card')
    ],
    type: 'checkboxes',
    setValueCallback: (button: RexUIPlugin.Label, value: boolean, _previousValue: boolean) => {
      const container = <Phaser.GameObjects.Container>button.getElement('icon')
      const rectangle = <Phaser.GameObjects.Rectangle>container.getAt(1)
      rectangle.setFillStyle(value ? 0xFFFFFF : undefined)
    },
    space: { top: 20, item: 10 }
  }), { padding: { left: 50 } })
  return sizer.layout()
}

class SettingsDialogScene extends ModalDialogBaseScene {

  constructor() {
    super('SettingsDialog')
  }

  protected createDialogContent(): RexUIPlugin.Dialog {
    return this.rexUI.add.dialog({
      background: ui.createDialogBackground(this),
      title: this.add.text(0, 0, 'Settings', { fontSize: '24px' }),
      content: createContent(this),
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

export const createSettingsDialog = (parentScene: Phaser.Scene): void => {
  parentScene.scene.add(undefined, new SettingsDialogScene(), true)
}
