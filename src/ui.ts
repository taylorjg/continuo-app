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
    .setOrigin(0, 0)
    .setInteractive()
}

export const createCloseButton = (scene: Phaser.Scene): Phaser.GameObjects.Components.Transform => {

  const container = new Phaser.GameObjects.Container(scene)

  const arc = new Phaser.GameObjects.Arc(scene, 0, 0, 14)
  arc.setStrokeStyle(2, 0xFFFFFF)
  arc.setFillStyle(0x000000)
  arc.setInteractive()

  const d = 8
  const line1 = new Phaser.GameObjects.Line(scene, 0, 0, -d, +d, +d, -d)
  const line2 = new Phaser.GameObjects.Line(scene, 0, 0, -d, -d, +d, +d)
  line1.setStrokeStyle(2, 0xFFFFFF)
  line2.setStrokeStyle(2, 0xFFFFFF)
  line2.setOrigin(0, 0)
  line1.setOrigin(0, 0)

  container.add(arc)
  container.add(line1)
  container.add(line2)

  scene.add.existing(container)

  return container
}
