import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from '../ui'

class ConfirmationDialogScene extends ModalDialogBaseScene {

  onYes?: () => void
  onNo?: () => void

  constructor(onYes?: () => void, onNo?: () => void) {
    super('ConfirmationDialog', onNo)
    this.onYes = onYes
    this.onNo = onNo
  }

  protected getDialogConfig(): Dialog.IConfig {
    return {
      content: ui.createLabel(this, 'Abandon the current game ?'),
      actions: [
        ui.createLabel(this, 'Yes')
          .setName('yesButton')
          .setInteractive({ useHandCursor: true }),
        ui.createLabel(this, 'No')
          .setName('noButton')
          .setInteractive({ useHandCursor: true })
      ]
    }
  }

  create() {
    super.create()
    this.dialog.on('button.click', (
      gameObject: Phaser.GameObjects.GameObject,
      _groupName: string,
      _index: number,
      _pointer: Phaser.Input.Pointer,
      _event: Phaser.Types.Input.EventData) => {
      switch (gameObject.name) {
        case 'yesButton':
          this.closeDialog()
          this.onYes?.()
          break
        case 'noButton':
          this.closeDialog()
          this.onNo?.()
          break
      }
    })
  }
}

export const createConfirmationDialog = (
  parentScene: Phaser.Scene,
  onYes?: () => void,
  onNo?: () => void
) => {
  parentScene.scene.add(
    undefined,
    new ConfirmationDialogScene(onYes, onNo),
    true)
}
