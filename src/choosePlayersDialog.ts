import { ModalDialogBaseScene } from './modalDialogBase'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

const createDialogContent = (scene: SceneWithRexUI) => {
  return scene.rexUI.add.dialog({
    background: ui.createDialogBackground(scene),
    content: ui.createLabel(scene, 'Placeholder for Choose Players dialog'),
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

export class ChoosePlayersDialog {
  constructor(parentScene: Phaser.Scene) {
    parentScene.scene.add(undefined, new ModalDialogBaseScene('ChoosePlayersDialog', createDialogContent), true)
  }
}
