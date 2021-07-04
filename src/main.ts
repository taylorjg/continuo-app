import * as Phaser from 'phaser'
import { Deck } from './continuo-lib/deck'
import { Colour } from './continuo-lib/enums'
import { PlacedCard } from './continuo-lib/placedCard'

const CELL_SIZE = 28 * 2
const GAP_SIZE = 2
const CARD_SIZE = 4 * CELL_SIZE + 3 * GAP_SIZE
// const HALF_CARD_SIZE = CARD_SIZE / 2

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

  private static getCardPosition(placedCard: PlacedCard): Phaser.Geom.Point {
    const x = placedCard.col * CARD_SIZE / 4 + 100
    const y = placedCard.row * CARD_SIZE / 4 + 100
    return new Phaser.Geom.Point(x, y)
  }

  public create() {
    const [card1, orientation1] = Deck.findCard(Colour.Blue, Colour.Green, Colour.Green, Colour.Blue)
    const [card2, orientation2] = Deck.findCard(Colour.Blue, Colour.Green, Colour.Red, Colour.Blue)
    const [card3, orientation3] = Deck.findCard(Colour.Blue, Colour.Red, Colour.Red, Colour.Yellow)
    const [card4, orientation4] = Deck.findCard(Colour.Blue, Colour.Green, Colour.Yellow, Colour.Blue)
    const placedCards = [
      new PlacedCard(card1, 0, 0, orientation1),
      new PlacedCard(card2, -1, 4, orientation2),
      new PlacedCard(card3, 3, 5, orientation3),
      new PlacedCard(card4, 4, 1, orientation4)
    ]

    placedCards.forEach((placedCard, index) => {
      const cardGraphics = new Phaser.GameObjects.Graphics(this)
      drawPlacedCard(cardGraphics, placedCard)
      const cardSpriteKey = `card${index}`
      cardGraphics.generateTexture(cardSpriteKey, CARD_SIZE, CARD_SIZE)
      const pos = GameScene.getCardPosition(placedCard)
      const cardSprite = this.add.sprite(pos.x, pos.y, cardSpriteKey)
      cardSprite.setOrigin(0, 0)
    })
  }
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Continuo',
  type: Phaser.AUTO,
  scale: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  backgroundColor: '#AAAAAA',
  scene: GameScene
}

export const game = new Phaser.Game(gameConfig)
