import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from './ui'

class ChoosePlayersDialogScene extends ModalDialogBaseScene {

  constructor() {
    super('ChoosePlayersDialog')
  }

  protected getDialogConfig(): Dialog.IConfig {
    return {
      content: ui.createLabel(this, 'Placeholder for Choose Players dialog')
    }
  }
}

export const createChoosePlayersDialog = (parentScene: Phaser.Scene) => {
  parentScene.scene.add(undefined, new ChoosePlayersDialogScene(), true)
}
