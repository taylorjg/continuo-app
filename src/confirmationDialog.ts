import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
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

  protected getDialogConfig(): Dialog.IConfig {
    return {
      content: ui.createLabel(this, 'Abandon the current game ?'),
      actions: [
        ui.createLabel(this, 'Yes').setInteractive({ useHandCursor: true }),
        ui.createLabel(this, 'No').setInteractive({ useHandCursor: true })
      ]
    }
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

export const createConfirmationDialog = (parentScene: Phaser.Scene, onYes?: Function, onNo?: Function) => {
  parentScene.scene.add(undefined, new ConfirmationDialogScene(onYes, onNo), true)
}
