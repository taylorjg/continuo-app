import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'

import { SceneWithRexUI } from './types'

const createLabel = (scene: Phaser.Scene, text: string) => {
  const rexUI = (<SceneWithRexUI>scene).rexUI
  return rexUI.add.label({
    width: 40,
    height: 40,
    background: rexUI.add.roundRectangle(0, 0, 0, 0, 5, 0x5e92f3),
    text: scene.add.text(0, 0, text, { fontSize: '24px' }),
    space: { left: 10, right: 10, top: 10, bottom: 10 }
  })
}

const createConfirmationDialog = (scene: Phaser.Scene): RexUIPlugin.Dialog => {
  const rexUI = (<SceneWithRexUI>scene).rexUI
  return rexUI.add.dialog({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    background: rexUI.add.roundRectangle(0, 0, 0, 0, 5, 0x1565c0),
    content: createLabel(scene, 'Abandon the current game ?'),
    actions: [createLabel(scene, 'Yes'), createLabel(scene, 'No')],
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

class ConfirmationDialogScene extends Phaser.Scene {

  constructor() {
    super('ConfirmationDialog')
  }

  create() {
    this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000, 0.5)
      .setOrigin(0, 0)
      .setInteractive()
  }
}

export class ConfirmationDialog {
  constructor(parentScene: Phaser.Scene, onYes?: Function, onNo?: Function) {
    const dialogScene = parentScene.scene.add(undefined, new ConfirmationDialogScene(), true)
    const dialog = createConfirmationDialog(dialogScene).layout().popUp(100)
    dialog.on('button.click', (
      _button: Phaser.GameObjects.GameObject,
      _groupName: string,
      index: number,
      _pointer: Phaser.Input.Pointer,
      _event: any) => {
      dialogScene.scene.remove()
      switch (index) {
        case 0:
          onYes && onYes()
          break
        case 1:
          onNo && onNo()
          break
      }
    })
  }
}
