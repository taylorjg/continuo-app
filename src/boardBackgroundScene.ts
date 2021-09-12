import * as Phaser from 'phaser'
import { ContinuoAppScenes } from './constants'

export class BoardBackgroundScene extends Phaser.Scene {

  private background: Phaser.GameObjects.TileSprite

  constructor() {
    super(ContinuoAppScenes.BoardBackground)
  }

  create() {
    const onResize = () => this.resize()
    const onOrientationChange = () => this.resize()

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.background = this.add.tileSprite(0, 0, windowWidth, windowHeight, 'melamine-wood').setOrigin(0, 0)
  }

  private resize(): void {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.scale.resize(windowWidth, windowHeight)
    this.background.setSize(windowWidth, windowHeight)
  }
}
