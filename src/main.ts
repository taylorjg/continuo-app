import * as Phaser from 'phaser'
import { Board } from './continuo-lib/board'
import { Card } from './continuo-lib/card'
import { Chain } from './continuo-lib/chain'
import { Deck } from './continuo-lib/deck'
import { Colour, Orientation } from './continuo-lib/enums'
import { evaluateCard } from './continuo-lib/evaluate'
import { PlacedCard } from './continuo-lib/placedCard'
import { PossibleMove } from './continuo-lib/possibleMove'

const CELL_SIZE = 28 * 2
const GAP_SIZE = 2
const CARD_SIZE = 4 * CELL_SIZE + 3 * GAP_SIZE
const QUARTER_CARD_SIZE = CARD_SIZE / 4
const EIGHTH_CARD_SIZE = CARD_SIZE / 8
const NUM_BORDER_CELLS = 5

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
  key: 'GameScene'
}

export class GameScene extends Phaser.Scene {

  deck: Deck
  board: Board
  normalCardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>
  rotatedCardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>
  chainHighlights: Phaser.GameObjects.Polygon[]

  constructor() {
    super(sceneConfig)
    this.deck = new Deck()
    this.board = Board.empty
    this.normalCardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()
    this.rotatedCardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()
    this.chainHighlights = []
  }

  private getCardPosition(row: number, col: number): Phaser.Geom.Point {
    const x = (col + 2) * QUARTER_CARD_SIZE
    const y = (row + 2) * QUARTER_CARD_SIZE
    return new Phaser.Geom.Point(x, y)
  }

  private getCellPosition(row: number, col: number): Phaser.Geom.Point {
    const x = col * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
    const y = row * QUARTER_CARD_SIZE + EIGHTH_CARD_SIZE
    return new Phaser.Geom.Point(x, y)
  }

  private highlightChains(chains: readonly Chain[]): void {
    this.chainHighlights.forEach(chainHighlight => chainHighlight.destroy())
    this.chainHighlights = []
    chains.forEach(chain => {
      const points = chain.cells.map(cell => this.getCellPosition(cell.row, cell.col))
      const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, points)
      polygon.setClosePath(false)
      polygon.setOrigin(0, 0)
      polygon.setStrokeStyle(CELL_SIZE / 5, 0xFF00FF)
      this.add.existing(polygon)
      this.chainHighlights.push(polygon)
    })
  }

  private placeCard(possibleMove: PossibleMove, noAnimation: boolean = false): void {
    const placedCard = possibleMove.placedCard
    this.board = this.board.placeCard(placedCard)

    const boundaries = this.board.getBoundaries()
    const [leftMost, rightMost, topMost, bottomMost] = boundaries
    const width = <number>this.game.config.width
    const height = <number>this.game.config.height
    const numCellsWide = rightMost - leftMost + 1 + (2 * NUM_BORDER_CELLS)
    const numCellsHigh = bottomMost - topMost + 1 + (2 * NUM_BORDER_CELLS)
    const totalWidth = numCellsWide * QUARTER_CARD_SIZE
    const totalHeight = numCellsHigh * QUARTER_CARD_SIZE
    const scaleX = width / totalWidth
    const scaleY = height / totalHeight
    const scale = Math.min(scaleX, scaleY)
    // console.log({ width, height, numCellsWide, numCellsHigh, totalWidth, totalHeight, scaleX, scaleY, scale, boundaries })

    if (noAnimation) {
      this.cameras.main.zoom = scale
    } else {
      this.tweens.add({
        targets: this.cameras.main,
        zoom: scale,
        duration: 1000,
        ease: 'Expo.Out'
      })
    }

    const centreX = (leftMost - NUM_BORDER_CELLS) * QUARTER_CARD_SIZE + (totalWidth / 2)
    const centreY = (topMost - NUM_BORDER_CELLS) * QUARTER_CARD_SIZE + (totalHeight / 2)
    this.cameras.main.centerOn(centreX, centreY)

    const map = placedCard.orientation == Orientation.North || placedCard.orientation == Orientation.South
      ? this.normalCardSpritesMap
      : this.rotatedCardSpritesMap
    const cardSprite = map.get(placedCard.card)
    const pos = this.getCardPosition(placedCard.row, placedCard.col)
    cardSprite.setPosition(pos.x, pos.y)
    cardSprite.visible = true
    this.highlightChains(possibleMove.chains)
  }

  public create() {

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

    this.startNewGame()
  }

  private startNewGame(): void {
    this.normalCardSpritesMap.forEach(cardSprite => cardSprite.visible = false)
    this.rotatedCardSpritesMap.forEach(cardSprite => cardSprite.visible = false)
    this.deck.reset()
    this.board = Board.empty

    const card1 = this.deck.nextCard()
    const placedCard1 = new PlacedCard(card1, 0, 0, Orientation.North)
    const move1 = new PossibleMove(placedCard1, [])
    this.placeCard(move1, true /* noAnimation */)

    const card2 = this.deck.nextCard()
    const move2 = evaluateCard(this.board, card2)[0]
    this.placeCard(move2, true /* noAnimation */)
  }

  public onRestart(nextCardElement: HTMLButtonElement): void {
    this.startNewGame()
    nextCardElement.disabled = false
  }

  public onNextCard(nextCardElement: HTMLButtonElement): void {
    const card = this.deck.nextCard()
    const move = evaluateCard(this.board, card)[0]
    this.placeCard(move)
    nextCardElement.disabled = this.deck.numCardsLeft == 0
  }
}

export class HUDScene extends Phaser.Scene {

  gameScene: GameScene
  nextCardElement: HTMLButtonElement

  constructor() {
    super({
      active: true,
      visible: true,
      key: 'HUDScene'
    })
  }

  create() {
    this.gameScene = <GameScene>this.scene.get('GameScene')

    const restartButton = this.add.dom(0, 0, 'button', 'margin: 10px; width: 80px;', 'Restart')
    restartButton.setOrigin(0, 0)
    restartButton.addListener('click')

    this.nextCardElement = document.createElement('button')
    this.nextCardElement.style.margin = '10px'
    this.nextCardElement.style.width = '80px'
    this.nextCardElement.innerText = 'Next Card'
    const nextCardButton = this.add.dom(0, 30, this.nextCardElement)
    nextCardButton.setOrigin(0, 0)
    nextCardButton.addListener('click')

    restartButton.on('click', this.onRestart, this)
    nextCardButton.on('click', this.onNextCard, this)
  }

  public onRestart(): void {
    this.gameScene.onRestart(this.nextCardElement)
  }

  public onNextCard(): void {
    this.gameScene.onNextCard(this.nextCardElement)
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
  scene: [GameScene, HUDScene],
  parent: 'game',
  dom: {
    createContainer: true
  }
}

export const game = new Phaser.Game(gameConfig)
