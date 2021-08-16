import { SceneWithRexUI } from './types'

export const BUTTON_BACKGROUND_COLOUR = 0x5e92f3
export const DIALOG_BACKGROUND_COLOUR = 0x1565c0
export const DIALOG_OVERLAY_COLOUR = 0x000000
export const DIALOG_OVERLAY_ALPHA = 0.5

export const createLabel = (scene: Phaser.Scene, text: string) => {
  const rexUI = (<SceneWithRexUI>scene).rexUI
  return rexUI.add.label({
    width: 40,
    height: 40,
    background: rexUI.add.roundRectangle(0, 0, 0, 0, 5, BUTTON_BACKGROUND_COLOUR),
    text: scene.add.text(0, 0, text, { fontSize: '24px' }),
    space: { left: 10, right: 10, top: 10, bottom: 10 }
  })
}

export const createDialogOverlay = (scene: Phaser.Scene) => {
  return scene.add.rectangle(0, 0, 0, 0, DIALOG_OVERLAY_COLOUR, DIALOG_OVERLAY_ALPHA)
    .setName('dialogOverlay')
    .setOrigin(0, 0)
    .setInteractive()
}

export const createCloseButton = (scene: Phaser.Scene): Phaser.GameObjects.GameObject => {
  const icon = new Phaser.GameObjects.Sprite(scene, 0, 0, 'circlex')
  const arc = new Phaser.GameObjects.Arc(scene, 0, 0, icon.width / 2 - 1)
  arc.name = 'closeButton'
  arc.setFillStyle(0xFFFFFF)
  arc.setInteractive({ useHandCursor: true })
  const container = new Phaser.GameObjects.Container(scene)
  container.add(arc)
  container.add(icon)
  scene.add.existing(container)
  return container
}
