import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

const createConfirmationDialog = (scene: SceneWithRexUI): RexUIPlugin.Dialog => {
  return scene.rexUI.add.dialog({
    background: ui.createDialogBackground(scene),
    content: ui.createLabel(scene, 'Abandon the current game ?'),
    actions: [ui.createLabel(scene, 'Yes'), ui.createLabel(scene, 'No')],
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

  rexUI: RexUIPlugin
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

    this.overlay = ui.createDialogOverlay(this)
    this.dialog = createConfirmationDialog(this).layout().popUp(0)

    this.dialog.on('button.click', (
      _button: Phaser.GameObjects.GameObject,
      _groupName: string,
      index: number,
      _pointer: Phaser.Input.Pointer,
      _event: Phaser.Types.Input.EventData) => {
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

    this.input.keyboard.on('keydown-ESC', () => {
      this.closeDialog()
    })

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.GameObject,
      _event: Phaser.Types.Input.EventData) => {
      if (gameObject.name == 'dialogOverlay') {
        this.closeDialog()
      }
    })
  }

  private closeDialog(): void {
    this.scene.remove()
  }

  private resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)
    this.rearrange()
  }

  private rearrange() {

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    if (this.overlay.visible) {
      this.overlay.setSize(windowWidth, windowHeight)
      // Ensure the hit area covers the new size
      this.overlay.setInteractive()
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
