import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from './ui'

class SettingsDialogScene extends ModalDialogBaseScene {

  constructor() {
    super('SettingsDialog')
  }

  protected createDialogContent(): RexUIPlugin.Dialog {
    return this.rexUI.add.dialog({
      background: ui.createDialogBackground(this),
      content: ui.createLabel(this, 'Placeholder for Settings dialog'),
      space: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
        content: 25
      },
      align: { title: 'center', actions: 'right' },
      click: { mode: 'release' }
    })
  }
}

export const createSettingsDialog = (parentScene: Phaser.Scene): void => {
  parentScene.scene.add(undefined, new SettingsDialogScene(), true)
}
