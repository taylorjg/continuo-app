import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from './types'

export const DIALOG_BACKGROUND_COLOUR = 0x1565c0
export const DIALOG_OVERLAY_COLOUR = 0x000000
export const DIALOG_OVERLAY_ALPHA = 0.5

export const BUTTON_BACKGROUND_COLOUR = 0x5e92f3

export const BORDER_WIDTH = 2
export const BORDER_COLOUR = 0xFFFFFF

export const ROUND_RADIUS = 5

export const TEXT_STYLE = {
  fontFamily: 'Verdana',
  fontSize: '24px'
}

export const TEXT_STYLE_SMALL = {
  fontFamily: 'Verdana',
  fontSize: '12px'
}

export const createDialogOverlay = (scene: Phaser.Scene): Phaser.GameObjects.Rectangle => {
  return scene.add.rectangle(0, 0, 0, 0, DIALOG_OVERLAY_COLOUR, DIALOG_OVERLAY_ALPHA)
    .setName('dialogOverlay')
    .setOrigin(0, 0)
}

export const createDialogBackground = (scene: SceneWithRexUI): Phaser.GameObjects.GameObject => {
  return scene.rexUI.add.roundRectangle(0, 0, 0, 0, ROUND_RADIUS, DIALOG_BACKGROUND_COLOUR)
    .setName('dialogBackground')
    .setStrokeStyle(BORDER_WIDTH, BORDER_COLOUR)
    .setInteractive({ cursor: 'unset' })
}

export const createLabelBackground = (scene: SceneWithRexUI): Phaser.GameObjects.GameObject => {
  return scene.rexUI.add.roundRectangle(0, 0, 0, 0, ROUND_RADIUS, BUTTON_BACKGROUND_COLOUR)
}

export const createLabelBackgroundWithBorder = (scene: SceneWithRexUI): Phaser.GameObjects.GameObject => {
  return scene.rexUI.add.roundRectangle(0, 0, 0, 0, ROUND_RADIUS, BUTTON_BACKGROUND_COLOUR)
    .setStrokeStyle(BORDER_WIDTH, BORDER_COLOUR)
}

export const createLabel = (scene: SceneWithRexUI, text: string, alignCenter: boolean = false): RexUIPlugin.Label => {
  return scene.rexUI.add.label({
    width: 40,
    height: 40,
    background: createLabelBackground(scene),
    text: scene.add.text(0, 0, text, TEXT_STYLE),
    space: { left: 10, right: 10, top: 10, bottom: 10 },
    align: alignCenter ? 'center' : 'left'
  })
}

export const createCheckbox = (scene: SceneWithRexUI, name: string, text: string): RexUIPlugin.Label => {
  return scene.rexUI.add.label({
    name,
    text: scene.add.text(0, 0, text, TEXT_STYLE),
    icon: scene.add.container(0, 0, [
      scene.add.rectangle(0, 0, 22, 22).setStrokeStyle(2, 0xFFFFFF).setName('outerRectangle'),
      scene.add.rectangle(0, 0, 16, 16).setName('innerRectangle')
    ]).setSize(22, 22),
    space: { icon: 15 }
  })
    .setInteractive({ useHandCursor: true })
}

export const updateCheckbox = (gameObject: Phaser.GameObjects.GameObject, value: boolean) => {
  const checkbox = <RexUIPlugin.Label>gameObject
  const container = <Phaser.GameObjects.Container>checkbox.getElement('icon')
  const innerRectangle = <Phaser.GameObjects.Rectangle>container.getByName('innerRectangle')
  innerRectangle.setFillStyle(value ? 0xFFFFFF : undefined)
}

export const createCloseButton = (scene: Phaser.Scene): Phaser.GameObjects.GameObject => {
  const icon = new Phaser.GameObjects.Sprite(scene, 0, 0, 'circlex')
  const arc = new Phaser.GameObjects.Arc(scene, 0, 0, icon.width / 2 - 1)
  arc.name = 'closeButton'
  arc.setFillStyle(0x000000)
  arc.setInteractive({ useHandCursor: true })
  const container = new Phaser.GameObjects.Container(scene)
  container.add(arc)
  container.add(icon)
  scene.add.existing(container)
  return container
}

export const createHomeSceneButton = (
  scene: SceneWithRexUI,
  name: string,
  text: string,
  sprite: Phaser.GameObjects.Sprite
): RexUIPlugin.Label => {
  const iconContainer = new Phaser.GameObjects.Container(scene, 0, 0, [sprite]).setSize(125, 75)
  return scene.rexUI.add.label({
    width: 375,
    height: 130,
    background: createLabelBackgroundWithBorder(scene),
    text: scene.add.text(0, 0, text, TEXT_STYLE),
    icon: scene.add.existing(iconContainer),
    space: { left: 10, right: 10, top: 10, bottom: 10, icon: 10 }
  })
    .setName(name)
    .setInteractive({ useHandCursor: true })
}

export const createHUDSceneButton = (
  scene: SceneWithRexUI,
  name: string,
  iconTexture: string,
  scale: number
): RexUIPlugin.Label => {
  const sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, iconTexture).setScale(scale)
  const iconContainer = new Phaser.GameObjects.Container(scene, 0, 0, [sprite])
  return scene.rexUI.add.label({
    width: 35,
    height: 35,
    name,
    background: createLabelBackgroundWithBorder(scene),
    icon: scene.add.existing(iconContainer),
    align: 'center'
  })
    .setInnerPadding(7)
    .setInteractive({ useHandCursor: true })
}
