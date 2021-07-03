import * as Phaser from 'phaser'
import { Card } from './continuo-lib/card'
import { Deck } from './continuo-lib/deck'
import { Colour } from './continuo-lib/enums'

const CARD_SIZE = 200
const HALF_CARD_SIZE = CARD_SIZE / 2

const drawCard = (graphics: Phaser.GameObjects.Graphics /* , card: Card */): void => {
  graphics.fillStyle(0xFF0000)
  graphics.fillRect(0, 0, HALF_CARD_SIZE, CARD_SIZE)
  graphics.fillStyle(0x0000FF)
  graphics.fillRect(HALF_CARD_SIZE, 0, HALF_CARD_SIZE, CARD_SIZE)
}

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game'
}

export class GameScene extends Phaser.Scene {

  constructor() {
    super(sceneConfig)
  }

  public create() { 
    const cardGraphics = new Phaser.GameObjects.Graphics(this)
    drawCard(cardGraphics)
    cardGraphics.generateTexture('card', CARD_SIZE, CARD_SIZE)
    this.add.image(400, 300, 'card')
  }
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Continuo',
  type: Phaser.AUTO,
  scale: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  parent: 'game',
  backgroundColor: '#AAAAAA',
  scene: [GameScene]
}

export const game = new Phaser.Game(gameConfig)
