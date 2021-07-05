import * as Phaser from 'phaser'
import { Board } from './continuo-lib/board'
import { Card } from './continuo-lib/card'
import { Deck } from './continuo-lib/deck'
import { Colour, Orientation } from './continuo-lib/enums'
import { evaluateCard } from './continuo-lib/evaluate'
import { PlacedCard } from './continuo-lib/placedCard'

const CELL_SIZE = 28 * 2
const HALF_CELL_SIZE = CELL_SIZE / 2
const GAP_SIZE = 2
const CARD_SIZE = 4 * CELL_SIZE + 3 * GAP_SIZE
const HALF_CARD_SIZE = CARD_SIZE / 2
const QUARTER_CARD_SIZE = CARD_SIZE / 4
const ARBITRARY_OFFSET_X = CARD_SIZE
const ARBITRARY_OFFSET_Y = CARD_SIZE

const COLOUR_MAP = new Map([
  [Colour.Red, 0xFF0000],
  [Colour.Green, 0x00FF00],
  [Colour.Blue, 0x0000FF],
  [Colour.Yellow, 0xFFFF00]
])

const drawCard = (graphics: Phaser.GameObjects.Graphics, card: Card, orientation: Orientation): void => {
  graphics.fillStyle(0x000000)
  graphics.fillRect(0, 0, CARD_SIZE, CARD_SIZE)
  for (const rowWithinCard of [0, 1, 2, 3]) {
    for (const colWithinCard of [0, 1, 2, 3]) {
      const cellColour = card.colourAt(rowWithinCard, colWithinCard, orientation)
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
  board: Board
  normalCardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>
  rotatedCardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>

  constructor() {
    super(sceneConfig)
    this.deck = new Deck()
    this.board = Board.empty
  }

  private static getCardPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * QUARTER_CARD_SIZE + HALF_CARD_SIZE + ARBITRARY_OFFSET_X
    const y = row * QUARTER_CARD_SIZE + HALF_CARD_SIZE + ARBITRARY_OFFSET_Y
    return new Phaser.Geom.Point(x, y)
  }

  private static getCellPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * QUARTER_CARD_SIZE + HALF_CELL_SIZE + ARBITRARY_OFFSET_X
    const y = row * QUARTER_CARD_SIZE + HALF_CELL_SIZE + ARBITRARY_OFFSET_Y
    return new Phaser.Geom.Point(x, y)
  }

  private placeCard(placedCard: PlacedCard): void {
    this.board = this.board.placeCard(placedCard)
    const map = placedCard.orientation == Orientation.North || placedCard.orientation == Orientation.South
      ? this.normalCardSpritesMap
      : this.rotatedCardSpritesMap
    const cardSprite = map.get(placedCard.card)
    const pos = GameScene.getCardPosition(placedCard.row, placedCard.col)
    cardSprite.setPosition(pos.x, pos.y)
    cardSprite.visible = true
  }

  public create() {

    this.normalCardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()
    this.rotatedCardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()

    const makeCardSprite = (card: Card, index: number, rotated: boolean): void => {
      const graphics = new Phaser.GameObjects.Graphics(this)
      const orientation = rotated ? Orientation.East : Orientation.North
      drawCard(graphics, card, orientation)
      const key = rotated ? `card-${index}-rotated` : `card-${index}`
      graphics.generateTexture(key, CARD_SIZE, CARD_SIZE)
      const sprite = new Phaser.GameObjects.Sprite(this, 0, 0, key)
      sprite.visible = false
      sprite.scaleX = 0.99
      sprite.scaleY = 0.99
      const map = rotated ? this.rotatedCardSpritesMap : this.normalCardSpritesMap
      map.set(card, sprite)
      this.add.existing(sprite)
    }

    Deck.originalCards.forEach((card, index) => {
      makeCardSprite(card, index, false /* rotated */)
      makeCardSprite(card, index, true /* rotated */)
    })

    const card1 = this.deck.nextCard()
    const placedCard = new PlacedCard(card1, 0, 0, Orientation.North)
    this.placeCard(placedCard)

    const card2 = this.deck.nextCard()
    const card2BestMove = evaluateCard(this.board, card2)[0]
    this.placeCard(card2BestMove.placedCard)

    // const possibleMove = evaluatePlacedCard(board, placedCards.slice(-1)[0])
    // possibleMove.chains.forEach(chain => {
    //   const points = chain.cells.map(cell => GameScene.getCellPosition(cell.row, cell.col))
    //   const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, points)
    //   polygon.setStrokeStyle(CELL_SIZE / 5, 0xFF00FF)
    //   polygon.closePath = false
    //   polygon.setOrigin(0, 0)
    //   this.add.existing(polygon)
    // })

    const restartButton = this.add.dom(0, 0, 'button', 'margin: 10px; width: 80px;', 'Restart')
    restartButton.setOrigin(0, 0)
    restartButton.addListener('click')

    const nextCardElement = document.createElement('button')
    nextCardElement.style.margin = '10px'
    nextCardElement.style.width = '80px'
    nextCardElement.innerText = 'Next Card'
    const nextCardButton = this.add.dom(0, 30, nextCardElement)
    nextCardButton.setOrigin(0, 0)
    nextCardButton.addListener('click')

    restartButton.on('click', () => {
      console.log('[Restart button click]')
      this.normalCardSpritesMap.forEach(cardSprite => cardSprite.visible = false)
      this.rotatedCardSpritesMap.forEach(cardSprite => cardSprite.visible = false)
      this.deck.reset()
      this.board = Board.empty
      const card1 = this.deck.nextCard()
      const placedCard = new PlacedCard(card1, 0, 0, Orientation.North)
      this.placeCard(placedCard)
      const card2 = this.deck.nextCard()
      const card2BestMove = evaluateCard(this.board, card2)[0]
      this.placeCard(card2BestMove.placedCard)
      nextCardElement.disabled = false
    }, this)

    nextCardButton.on('click', () => {
      console.log('[NextCard button click]')
      const card = this.deck.nextCard()
      const bestMove = evaluateCard(this.board, card)[0]
      this.placeCard(bestMove.placedCard)
      nextCardElement.disabled = this.deck.numCardsLeft == 0
    }, this)
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
  scene: GameScene,
  parent: 'game',
  dom: {
    createContainer: true
  }
}

export const game = new Phaser.Game(gameConfig)
