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

  onYes?: Function
  onNo?: Function
  overlay: Phaser.GameObjects.Rectangle
  dialog: RexUIPlugin.Dialog

  constructor(onYes?: Function, onNo?: Function) {
    super('ConfirmationDialog')
    this.onYes = onYes
    this.onNo = onNo
  }

  create() {
    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    this.overlay = this.add.rectangle(0, 0, 0, 0, 0x000000, 0.5)
      .setOrigin(0, 0)
      .setInteractive()

    this.dialog = createConfirmationDialog(this).layout().popUp(100)

    this.dialog.on('button.click', (
      _button: Phaser.GameObjects.GameObject,
      _groupName: string,
      index: number,
      _pointer: Phaser.Input.Pointer,
      _event: any) => {
      this.scene.remove()
      switch (index) {
        case 0:
          this.onYes && this.onYes()
          break
        case 1:
          this.onNo && this.onNo()
          break
      }
    })

    this.rearrange()
  }

  private resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
    this.rearrange()
  }

  private rearrange() {
    const width = window.innerWidth
    const height = window.innerHeight
    if (this.overlay.visible) {
      this.overlay.setSize(width, height)
    }
    if (this.dialog.visible) {
      Phaser.Display.Align.In.Center(this.dialog, this.overlay)
    }
  }
}

export class ConfirmationDialog {
  constructor(parentScene: Phaser.Scene, onYes?: Function, onNo?: Function) {
    parentScene.scene.add(undefined, new ConfirmationDialogScene(onYes, onNo), true)
  }
}
