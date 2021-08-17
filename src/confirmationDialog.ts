import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from './ui'

class ConfirmationDialogScene extends ModalDialogBaseScene {

  onYes?: Function
  onNo?: Function

  constructor(onYes?: Function, onNo?: Function) {
    super('ConfirmationDialog')
    this.onYes = onYes
    this.onNo = onNo
  }

  protected createDialogContent(): RexUIPlugin.Dialog {
    return this.rexUI.add.dialog({
      background: ui.createDialogBackground(this),
      content: ui.createLabel(this, 'Abandon the current game ?'),
      actions: [ui.createLabel(this, 'Yes'), ui.createLabel(this, 'No')],
      space: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
        content: 25,
        action: 25
      },
      align: { title: 'center', actions: 'right' },
      click: { mode: 'release' }
    })
  }

  create() {
    super.create()
    this.dialog.on('button.click', (
      _button: Phaser.GameObjects.GameObject,
      _groupName: string,
      index: number,
      _pointer: Phaser.Input.Pointer,
      _event: Phaser.Types.Input.EventData) => {
      this.closeDialog()
      switch (index) {
        case 0:
          this.onYes && this.onYes()
          break
        case 1:
          this.onNo && this.onNo()
          break
      }
    })
  }
}

export class ConfirmationDialog {
  constructor(parentScene: Phaser.Scene, onYes?: Function, onNo?: Function) {
    parentScene.scene.add(undefined, new ConfirmationDialogScene(onYes, onNo), true)
  }
}
