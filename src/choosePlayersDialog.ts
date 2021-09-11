import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import Sizer from 'phaser3-rex-plugins/templates/ui/sizer/Sizer'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from './ui'

const TITLE_STEP1 = 'Choose Players (Step 1)'
const TITLE_STEP2 = 'Choose Players (Step 2)'

class ChoosePlayersDialogScene extends ModalDialogBaseScene {

  title: Phaser.GameObjects.Text
  contentSizer: Sizer

  constructor() {
    super('ChoosePlayersDialog')
  }

  private onStep1() {
    const minWidth = 400
    const button1 = ui.createLabel(this, 'Play against the computer', true)
      .setMinWidth(minWidth)
      .setName('singleButton')
      .setInteractive({ useHandCursor: true })
    const button2 = ui.createLabel(this, 'Multiplayer (local)', true)
      .setMinWidth(minWidth)
      .setName('multiLocalButton')
      .setInteractive({ useHandCursor: true })
    const button3 = ui.createLabel(this, 'Multiplayer (remote)', true)
      .setMinWidth(minWidth)
      .setName('multiRemoteButton')
      .setInteractive({ useHandCursor: true })
    const innerSizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 10 }
    })
    innerSizer
      .add(button1)
      .add(button2)
      .add(button3)
    this.title.text = TITLE_STEP1
    this.contentSizer
      .removeAll(true)
      .add(innerSizer)
      .layout()
  }

  private onStep2Single() {
    const innerSizer = this.rexUI.add.sizer({
      orientation: 'horizontal',
      space: { item: 10 }
    })
      .add(ui.createLabel(this, 'Your name:'))
      .add(this.rexUI.add.textBox({
        text: this.add.text(0, 0, 'You', ui.TEXT_STYLE)
      }))
    this.contentSizer.add(innerSizer)
  }

  private onStep2MultiLocal() {
    const gridSizer = this.rexUI.add.gridSizer({
      column: 2,
      row: 2,
      space: { row: 10, column: 40, left: 10, right: 10, top: 10, bottom: 10 }
    })
    const label1 = ui.createLabel(this, 'Player 1 name:')
    const textBox1 = this.rexUI.add.textBox({ text: this.add.text(0, 0, 'Player 1', ui.TEXT_STYLE) })
    const label2 = ui.createLabel(this, 'Player 2 name:')
    const textBox2 = this.rexUI.add.textBox({ text: this.add.text(0, 0, 'Player 2', ui.TEXT_STYLE) })
    gridSizer.add(label1, { row: 0 })
    gridSizer.add(textBox1, { row: 0 })
    gridSizer.add(label2, { row: 1 })
    gridSizer.add(textBox2, { row: 1 })
    this.contentSizer.add(gridSizer)
  }

  private onStep2MultiRemote() {
    const message = 'Sorry - this feature has not been implemented yet.'
    const text = this.add.text(0, 0, message, ui.TEXT_STYLE)
    this.contentSizer.add(text)
  }

  private wrapStep1(fn: () => void) {
    this.contentSizer.removeAll(true)
    fn()
    this.contentSizer.layout()
    this.title.text = TITLE_STEP1
    this.dialog
      .hideAction(0)
      .hideAction(1)
      .layout()
    this.forceResize()
  }

  private wrapStep2(fn: () => void) {
    this.contentSizer.removeAll(true)
    fn()
    this.contentSizer.layout()
    this.title.text = TITLE_STEP2
    this.dialog
      .showAction(0)
      .showAction(1)
      .layout()
    this.forceResize()
  }

  protected getDialogConfig(): Dialog.IConfig {
    this.title = this.add.text(0, 0, '', ui.TEXT_STYLE)
    this.contentSizer = this.rexUI.add.sizer()
    this.onStep1()
    return {
      title: this.title,
      content: this.contentSizer,
      actions: [
        ui.createLabel(this, 'Back').setName('backButton').setInteractive({ useHandCursor: true }),
        ui.createLabel(this, 'Done').setName('doneButton').setInteractive({ useHandCursor: true })
      ],
      expand: { title: false }
    }
  }

  create() {
    super.create()

    this.dialog
      .hideAction(0)
      .hideAction(1)

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.GameObject,
      _event: Phaser.Types.Input.EventData) => {
      console.log('[ChoosePlayersDialogScene input.on]', 'gameObject.name:', gameObject.name)
      switch (gameObject.name) {
        case 'singleButton':
          this.wrapStep2(() => this.onStep2Single())
          break
        case 'multiLocalButton':
          this.wrapStep2(() => this.onStep2MultiLocal())
          break
        case 'multiRemoteButton':
          this.wrapStep2(() => this.onStep2MultiRemote())
          break
      }
    })

    this.dialog.on('button.click', (
      gameObject: Phaser.GameObjects.GameObject,
      _groupName: string,
      _index: number,
      _pointer: Phaser.Input.Pointer,
      _event: Phaser.Types.Input.EventData) => {
      console.log('[ChoosePlayersDialogScene dialog.on]', 'gameObject.name:', gameObject.name)
      switch (gameObject.name) {
        case 'backButton':
          this.wrapStep1(() => this.onStep1())
          break
        case 'doneButton':
          this.closeDialog()
          break
      }
    })
  }
}

export const createChoosePlayersDialog = (parentScene: Phaser.Scene) => {
  parentScene.scene.add(undefined, new ChoosePlayersDialogScene(), true)
}
