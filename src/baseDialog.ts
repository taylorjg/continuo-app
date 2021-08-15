import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

class ConfirmationDialogScene extends Phaser.Scene {

  createDialogContent: Function
  overlay: Phaser.GameObjects.Rectangle
  dialog: RexUIPlugin.Dialog

  constructor(key: string, createDialogContent: Function) {
    super(key)
    this.createDialogContent = createDialogContent
  }

  create() {
    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    this.overlay = ui.createDialogOverlay(this)
    this.dialog = this.createDialogContent(this).layout().popUp(100)

    // this.dialog.on('button.click', (
    //   _button: Phaser.GameObjects.GameObject,
    //   _groupName: string,
    //   index: number,
    //   _pointer: Phaser.Input.Pointer,
    //   _event: any) => {
    //   this.scene.remove()
    //   switch (index) {
    //     case 0:
    //       this.onYes && this.onYes()
    //       break
    //     case 1:
    //       this.onNo && this.onNo()
    //       break
    //   }
    // })

    this.rearrange()

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.remove()
    })
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
