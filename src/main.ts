import * as Phaser from 'phaser'
// import { Card } from './continuo-lib/card'
import { Deck } from './continuo-lib/deck'
import { Colour, Orientation } from './continuo-lib/enums'
import { PlacedCard } from './continuo-lib/placedCard'

const CELL_SIZE = 28 * 2
const GAP_SIZE = 2
const CARD_SIZE = 4 * CELL_SIZE + 3 * GAP_SIZE
const HALF_CARD_SIZE = CARD_SIZE / 2

const COLOUR_MAP = new Map([
  [Colour.Red, 0xFF0000],
  [Colour.Green, 0x00FF00],
  [Colour.Blue, 0x0000FF],
  [Colour.Yellow, 0xFFFF00]
])

const drawPlacedCard = (graphics: Phaser.GameObjects.Graphics, placedCard: PlacedCard): void => {
  graphics.fillStyle(0x000000)
  graphics.fillRect(0, 0, CARD_SIZE, CARD_SIZE)
  for (const rowWithinCard of [0, 1, 2, 3]) {
    for (const colWithinCard of [0, 1, 2, 3]) {
      const cellColour = placedCard.colourAt(rowWithinCard, colWithinCard)
      const colour = COLOUR_MAP.get(cellColour)
      graphics.fillStyle(colour)
      const x = rowWithinCard * (CELL_SIZE + GAP_SIZE)
      const y = colWithinCard * (CELL_SIZE + GAP_SIZE)
      graphics.fillRect(x, y, CELL_SIZE, CELL_SIZE)
    }
  }
}

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game'
}

export class GameScene extends Phaser.Scene {

  deck: Deck

  constructor() {
    super(sceneConfig)
    this.deck = new Deck()
  }

  public create() {
    // const card1 = Deck.findCard(Colour.Blue, Colour.Green, Colour.Green, Colour.Blue)
    // const card2 = Deck.findCard(Colour.Blue, Colour.Green, Colour.Red, Colour.Blue)
    // const placedCard1 = new PlacedCard(card1, 0, 0, Orientation.North)
    // const placedCard2 = new PlacedCard(card2, -1, 4, Orientation.North)
    const card = this.deck.nextCard()
    const placedCard = new PlacedCard(card, 0, 0, Orientation.North)
    const cardGraphics = new Phaser.GameObjects.Graphics(this)
    drawPlacedCard(cardGraphics, placedCard)
    cardGraphics.generateTexture('card', CARD_SIZE, CARD_SIZE)
    const cardSprite = this.add.sprite(400, 300, 'card')
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
