import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from './ui'

export class ChoosePlayersDialogScene extends ModalDialogBaseScene {

  constructor() {
    super('ChoosePlayersDialog')
  }

  protected createDialogContent(): RexUIPlugin.Dialog {
    return this.rexUI.add.dialog({
      background: ui.createDialogBackground(this),
      content: ui.createLabel(this, 'Placeholder for Choose Players dialog'),
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

export class ChoosePlayersDialog {
  constructor(parentScene: Phaser.Scene) {
    parentScene.scene.add(undefined, new ChoosePlayersDialogScene(), true)
  }
}
