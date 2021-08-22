import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from './ui'

class ScoreboardDialogScene extends ModalDialogBaseScene {

  constructor() {
    super('ScoreboardDialog')
  }

  protected getDialogConfig(): Dialog.IConfig {
    return {
      content: ui.createLabel(this, 'Placeholder for Scoreboard dialog')
    }
  }
}

export const createScoreboardDialog = (parentScene: Phaser.Scene): void => {
  parentScene.scene.add(undefined, new ScoreboardDialogScene(), true)
}
