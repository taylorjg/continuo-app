import { SceneWithRexUI } from './types'

export const DIALOG_BACKGROUND_COLOUR = 0x1565c0
export const DIALOG_OVERLAY_COLOUR = 0x000000
export const DIALOG_OVERLAY_ALPHA = 0.5

export const BUTTON_BACKGROUND_COLOUR = 0x5e92f3

export const BORDER_WIDTH = 2
export const BORDER_COLOUR = 0xFFFFFF

export const ROUND_RADIUS = 5

export const createDialogBackground = (scene: SceneWithRexUI) => {
  return scene.rexUI.add.roundRectangle(0, 0, 0, 0, ROUND_RADIUS, DIALOG_BACKGROUND_COLOUR)
    .setStrokeStyle(BORDER_WIDTH, BORDER_COLOUR)
}

export const createLabelBackground = (scene: SceneWithRexUI) => {
  return scene.rexUI.add.roundRectangle(0, 0, 0, 0, ROUND_RADIUS, BUTTON_BACKGROUND_COLOUR)
}

export const createLabelBackgroundWithBorder = (scene: SceneWithRexUI) => {
  return scene.rexUI.add.roundRectangle(0, 0, 0, 0, ROUND_RADIUS, BUTTON_BACKGROUND_COLOUR)
    .setStrokeStyle(BORDER_WIDTH, BORDER_COLOUR)
}

export const createLabel = (scene: SceneWithRexUI, text: string) => {
  return scene.rexUI.add.label({
    width: 40,
    height: 40,
    background: createLabelBackground(scene),
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
