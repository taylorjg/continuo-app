import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import { ModalDialogBaseScene } from './modalDialogBase'
import * as ui from '../ui'
import { version, author } from '../../package.json'

class AboutDialogScene extends ModalDialogBaseScene {

  constructor() {
    super('AboutDialog')
  }

  protected getDialogConfig(): Dialog.IConfig {
    const sizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 20 }
    })
    sizer.add(this.add.text(0, 0, 'Continuo and Hexago', ui.TEXT_STYLE))
    sizer.add(this.add.text(0, 0, 'Built using Phaser 3 and TypeScript', ui.TEXT_STYLE))
    sizer.add(this.add.text(0, 0, `Version: ${version}`, ui.TEXT_STYLE))
    sizer.add(this.add.text(0, 0, `Author: ${author}`, ui.TEXT_STYLE))
    return {
      content: sizer
    }
  }
}

export const createAboutDialog = (parentScene: Phaser.Scene): void => {
  parentScene.scene.add(undefined, new AboutDialogScene(), true)
}
