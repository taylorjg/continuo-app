import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import * as ui from './ui'

export abstract class ModalDialogBaseScene extends Phaser.Scene {

  rexUI: RexUIPlugin
  overlay: Phaser.GameObjects.Rectangle
  dialog: RexUIPlugin.Dialog
  closeButton: Phaser.GameObjects.GameObject

  constructor(key: string) {
    super(key)
  }

  protected abstract createDialogContent(): RexUIPlugin.Dialog

  create() {
    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    this.overlay = ui.createDialogOverlay(this)
    this.dialog = this.createDialogContent().layout().popUp(0)
    this.closeButton = ui.createCloseButton(this)

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
      if (gameObject.name == 'closeButton') {
        this.closeDialog()
      }
    })
  }

  protected closeDialog(): void {
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

    const background = <Phaser.GameObjects.GameObject>this.dialog.getElement('background')
    Phaser.Display.Align.To.RightTop(this.closeButton, background)
  }
}
