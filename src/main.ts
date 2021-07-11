import * as Phaser from 'phaser'
import log from 'loglevel'
import { Board } from './continuo-lib/board'
import { Card } from './continuo-lib/card'
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
const NUM_MARGIN_CELLS = 5
const CURRENT_CARD_HIGHLIGHT_LINE_WIDTH = CELL_SIZE / 5
const CHAIN_HIGHLIGHTS_LINE_WIDTH = CELL_SIZE / 5

const CURRENT_CARD_DEPTH = 1
const CHAIN_HIGHLIGHTS_DEPTH = 2

const COLOUR_MAP = new Map([
  [Colour.Red, 0xFF0000],
  [Colour.Green, 0x00FF00],
  [Colour.Blue, 0x0000FF],
  [Colour.Yellow, 0xFFFF00]
])

const CURRENT_CARD_HIGHLIGHT_COLOUR = 0xFF00FF
const CHAIN_HIGHLIGHT_COLOUR = 0xFF00FF

const drawCard = (graphics: Phaser.GameObjects.Graphics, card: Card): void => {
  graphics.fillStyle(0x000000)
  graphics.fillRect(0, 0, CARD_SIZE, CARD_SIZE)
  for (const rowWithinCard of [0, 1, 2, 3]) {
    for (const colWithinCard of [0, 1, 2, 3]) {
      const cellColour = card.colourAt(rowWithinCard, colWithinCard, Orientation.North)
      const colour = COLOUR_MAP.get(cellColour)
      graphics.fillStyle(colour)
      const x = rowWithinCard * (CELL_SIZE + GAP_SIZE)
      const y = colWithinCard * (CELL_SIZE + GAP_SIZE)
      graphics.fillRect(x, y, CELL_SIZE, CELL_SIZE)
    }
  }
}

const orientationToAngle = (orientation: Orientation): number => {
  switch (orientation) {
    case Orientation.North: return 0
    case Orientation.South: return 180
    case Orientation.East: return 90
    case Orientation.West: return -90
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
  cardSpritesMap: Map<Card, Phaser.GameObjects.Sprite>
  currentCard: PlacedCard
  possibleMoves: PossibleMove[]
  currentPossibleMove: PossibleMove
  currentCardContainer: Phaser.GameObjects.Container
  chainHighlights: Phaser.GameObjects.Polygon[]

  constructor() {
    super(sceneConfig)
    this.deck = new Deck()
    this.board = Board.empty
    this.cardSpritesMap = new Map<Card, Phaser.GameObjects.Sprite>()
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

  private highlightChains(): void {
    this.currentPossibleMove.chains.forEach(chain => {
      const points = chain.cells.map(cell => this.getCellPosition(cell.row, cell.col))
      const polygon = new Phaser.GameObjects.Polygon(this, 0, 0, points)
      polygon.isFilled = false
      polygon.setClosePath(chain.isCycle)
      polygon.setOrigin(0, 0)
      polygon.setStrokeStyle(CHAIN_HIGHLIGHTS_LINE_WIDTH, CHAIN_HIGHLIGHT_COLOUR)
      polygon.setDepth(CHAIN_HIGHLIGHTS_DEPTH)
      this.add.existing(polygon)
      this.chainHighlights.push(polygon)
    })
  }

  private unhighlightChains(): void {
    this.chainHighlights.forEach(chainHighlight => chainHighlight.destroy())
    this.chainHighlights = []
  }

  private resize(noAnimation: boolean = false): void {

    const width = window.innerWidth
    const height = window.innerHeight
    this.scale.resize(width, height)

    const boundaries = this.board.getBoundaries()
    const [leftMost, rightMost, topMost, bottomMost] = boundaries
    const numCellsWide = rightMost - leftMost + 1 + (2 * NUM_MARGIN_CELLS)
    const numCellsHigh = bottomMost - topMost + 1 + (2 * NUM_MARGIN_CELLS)
    const totalWidth = numCellsWide * QUARTER_CARD_SIZE
    const totalHeight = numCellsHigh * QUARTER_CARD_SIZE
    const scaleX = width / totalWidth
    const scaleY = height / totalHeight
    const scale = Math.min(scaleX, scaleY)

    log.debug('[GameScene#resize]', {
      width,
      height,
      numCellsWide,
      numCellsHigh,
      totalWidth,
      totalHeight,
      scaleX,
      scaleY,
      scale,
      boundaries
    })

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

    const centreX = (leftMost - NUM_MARGIN_CELLS) * QUARTER_CARD_SIZE + (totalWidth / 2)
    const centreY = (topMost - NUM_MARGIN_CELLS) * QUARTER_CARD_SIZE + (totalHeight / 2)
    this.cameras.main.centerOn(centreX, centreY)
  }

  private placeCard(possibleMove: PossibleMove, addToBoard: boolean, noAnimation: boolean): void {

    const placedCard = possibleMove.placedCard

    if (addToBoard) {
      this.board = this.board.placeCard(placedCard)
      this.resize(noAnimation)
    } else {
      const savedBoard = this.board
      this.board = this.board.placeCard(placedCard)
      this.resize(noAnimation)
      this.board = savedBoard
    }

    const cardSprite = this.cardSpritesMap.get(placedCard.card)
    const cardPosition = this.getCardPosition(placedCard.row, placedCard.col)
    const angle = orientationToAngle(placedCard.orientation)

    if (addToBoard) {
      this.currentCardContainer.remove(cardSprite)
      this.currentCardContainer.setVisible(false)
      cardSprite.setPosition(cardPosition.x, cardPosition.y)
      cardSprite.setAngle(angle)
      cardSprite.setVisible(true)
      this.unhighlightChains()
    } else {
      cardSprite.setPosition(0, 0)
      cardSprite.setAngle(0)
      cardSprite.setVisible(true)
      this.currentCardContainer.add(cardSprite)
      this.currentCardContainer.moveTo(cardSprite, 0)
      this.currentCardContainer.setPosition(cardPosition.x, cardPosition.y)
      this.currentCardContainer.setAngle(angle)
      this.currentCardContainer.setVisible(true)
      this.highlightChains()
    }
  }

  public create() {

    window.addEventListener('resize', () => {
      this.resize()
    })

    this.scale.on('orientationchange', () => {
      this.resize()
    })

    Deck.originalCards.forEach((card, index) => {
      const graphics = new Phaser.GameObjects.Graphics(this)
      drawCard(graphics, card)
      const key = `card-${index}`
      graphics.generateTexture(key, CARD_SIZE, CARD_SIZE)
      const sprite = new Phaser.GameObjects.Sprite(this, 0, 0, key)
      sprite.visible = false
      sprite.scaleX = 0.99
      sprite.scaleY = 0.99
      this.cardSpritesMap.set(card, sprite)
      this.add.existing(sprite)
    })

    const currentCardHighlight = new Phaser.GameObjects.Rectangle(this, 0, 0, CARD_SIZE, CARD_SIZE)
    currentCardHighlight.setStrokeStyle(CURRENT_CARD_HIGHLIGHT_LINE_WIDTH, CURRENT_CARD_HIGHLIGHT_COLOUR)
    this.currentCardContainer = new Phaser.GameObjects.Container(this, 0, 0, [currentCardHighlight])
    this.currentCardContainer.setVisible(false)
    this.currentCardContainer.setDepth(CURRENT_CARD_DEPTH)
    this.add.existing(this.currentCardContainer)

    this.startNewGame()
  }

  private chooseRandomOrientation(): Orientation {
    return Phaser.Utils.Array.GetRandom([
      Orientation.North,
      Orientation.South,
      Orientation.East,
      Orientation.West
    ])
  }

  private chooseRandomBestScoreMove(possibleMoves: PossibleMove[]): PossibleMove {
    const bestScore = possibleMoves[0].score
    const bestScoreMoves = possibleMoves.filter(possibleMove => possibleMove.score == bestScore)
    return Phaser.Utils.Array.GetRandom(bestScoreMoves)
  }

  private startNewGame(): void {

    this.cardSpritesMap.forEach(cardSprite => cardSprite.setVisible(false))
    this.currentCardContainer.setVisible(false)
    this.unhighlightChains()
    this.deck.reset()
    this.board = Board.empty

    const card1 = this.deck.nextCard()
    const orientation1 = this.chooseRandomOrientation()
    const placedCard1 = new PlacedCard(card1, 0, 0, orientation1)
    const move1 = new PossibleMove(placedCard1, [])
    this.placeCard(move1, true /* addToBoard */, true /* noAnimation */)

    const card2 = this.deck.nextCard()
    const move2 = this.chooseRandomBestScoreMove(evaluateCard(this.board, card2))
    this.placeCard(move2, true /* addToBoard */, true /* noAnimation */)
  }

  public onRestart(): void {
    this.startNewGame()
  }

  public onNextCard(): void {
    const card = this.deck.nextCard()
    this.possibleMoves = evaluateCard(this.board, card)
    this.currentPossibleMove = this.possibleMoves[0]
    this.placeCard(this.currentPossibleMove, false /* addToBoard */, false /* noAnimation */)
  }

  public onPlaceCard(): number {
    this.placeCard(this.currentPossibleMove, true /* addToBoard */, false /* noAnimation */)
    return this.deck.numCardsLeft
  }
}

export class HUDScene extends Phaser.Scene {

  gameScene: GameScene
  nextCardElement: HTMLButtonElement
  placeCardElement: HTMLButtonElement

  constructor() {
    super({
      active: true,
      visible: true,
      key: 'HUDScene'
    })
  }

  create() {
    this.gameScene = <GameScene>this.scene.get('GameScene')

    let y = 0

    const restartButton = this.add.dom(0, y, 'button', 'margin: 10px; width: 120px;', 'Restart')
    y += 30
    restartButton.setOrigin(0, 0)
    restartButton.addListener('click')

    this.nextCardElement = document.createElement('button')
    this.nextCardElement.style.margin = '10px'
    this.nextCardElement.style.width = '120px'
    this.nextCardElement.innerText = 'Next Card'
    const nextCardButton = this.add.dom(0, y, this.nextCardElement)
    y += 30
    nextCardButton.setOrigin(0, 0)
    nextCardButton.addListener('click')

    this.placeCardElement = document.createElement('button')
    this.placeCardElement.style.margin = '10px'
    this.placeCardElement.style.width = '120px'
    this.placeCardElement.innerText = 'Place Card'
    const placeCardButton = this.add.dom(0, y, this.placeCardElement)
    y += 30
    placeCardButton.setOrigin(0, 0)
    placeCardButton.addListener('click')

    restartButton.on('click', this.onRestart, this)
    nextCardButton.on('click', this.onNextCard, this)
    placeCardButton.on('click', this.onPlaceCard, this)
    this.placeCardElement.disabled = true

    if (this.sys.game.device.fullscreen.available) {
      const enterFullScreenButton = this.add.dom(0, y, 'button', 'margin: 10px; width: 120px;', 'Enter Full Screen')
      enterFullScreenButton.setOrigin(0, 0)
      enterFullScreenButton.addListener('click')
      enterFullScreenButton.setVisible(true)

      const exitFullScreenButton = this.add.dom(0, y, 'button', 'margin: 10px; width: 120px;', 'Exit Full Screen')
      exitFullScreenButton.setOrigin(0, 0)
      exitFullScreenButton.addListener('click')
      exitFullScreenButton.setVisible(false)

      const toggleFullScreenMode = () => {
        enterFullScreenButton.setVisible(this.scale.isFullscreen)
        exitFullScreenButton.setVisible(!this.scale.isFullscreen)
        if (this.scale.isFullscreen) {
          this.scale.stopFullscreen()
        } else {
          this.scale.startFullscreen()
        }
      }

      enterFullScreenButton.on('click', toggleFullScreenMode)
      exitFullScreenButton.on('click', toggleFullScreenMode)

      y += 30
    }
  }

  public onRestart(): void {
    this.gameScene.onRestart()
    this.nextCardElement.disabled = false
    this.placeCardElement.disabled = true
  }

  public onNextCard(): void {
    this.gameScene.onNextCard()
    this.nextCardElement.disabled = true
    this.placeCardElement.disabled = false
  }

  public onPlaceCard(): void {
    const numCardsLeft = this.gameScene.onPlaceCard()
    this.nextCardElement.disabled = numCardsLeft == 0
    this.placeCardElement.disabled = true
  }
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Continuo',
  type: Phaser.AUTO,
  scale: {
    width: window.innerWidth,
    height: window.innerHeight,
    mode: Phaser.Scale.NONE,
    fullscreenTarget: 'game'
  },
  backgroundColor: '#AAAAAA',
  scene: [GameScene, HUDScene],
  parent: 'game',
  dom: {
    createContainer: true
  }
}

const main = () => {
  (window as any).log = log
  log.setLevel('info')
  new Phaser.Game(gameConfig)
}

main()
