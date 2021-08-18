import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from './ui'

class ScoreboardDialogScene extends ModalDialogBaseScene {

  constructor() {
    super('ScoreboardDialog')
  }

  protected createDialogContent(): RexUIPlugin.Dialog {
    return this.rexUI.add.dialog({
      background: ui.createDialogBackground(this),
      content: ui.createLabel(this, 'Placeholder for Scoreboard dialog'),
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

export const createScoreboardDialog = (parentScene: Phaser.Scene): void => {
  parentScene.scene.add(undefined, new ScoreboardDialogScene(), true)
}
