import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import GridSizer from 'phaser3-rex-plugins/templates/ui/gridsizer/GridSizer'
import { ModalDialogBaseScene } from './modalDialogBase'
import { SceneWithRexUI } from '../types'
import { Scoreboard, ScoreboardEntry } from '../turnManager'
import * as ui from '../ui'

const addColumn = (
  scene: SceneWithRexUI,
  gridSizer: GridSizer,
  column: number,
  text: string,
  scoreboard: Scoreboard,
  makeText: (entry: ScoreboardEntry) => string) => {
  addColumnHeading(scene, gridSizer, column, text)
  addColumnValues(scene, gridSizer, column, scoreboard, makeText)
}

const addColumnHeading = (scene: SceneWithRexUI, gridSizer: GridSizer, column: number, text: string) => {
  const child = scene.rexUI.add.label({
    text: scene.add.text(0, 0, text, ui.TEXT_STYLE),
    space: { bottom: 15 }
  })
  gridSizer.add(child, { column })
}

const addColumnValues = (
  scene: SceneWithRexUI,
  gridSizer: GridSizer,
  column: number,
  scoreboard: Scoreboard,
  makeText: (entry: ScoreboardEntry) => string) => {
  scoreboard.forEach(entry => {
    const text = makeText(entry)
    const child = scene.rexUI.add.label({
      text: scene.add.text(0, 0, text, ui.TEXT_STYLE),
      align: 'center'
    })
    gridSizer.add(child, { column })
  })
}

const createTable = (scene: SceneWithRexUI, scoreboard: Scoreboard): Phaser.GameObjects.GameObject => {

  const gridSizer = scene.rexUI.add.gridSizer({
    column: 4,
    row: 1 + scoreboard.length,
    space: { row: 10, column: 40, left: 10, right: 10, top: 10, bottom: 10 }
  })

  addColumn(scene, gridSizer, 0, 'Player', scoreboard, entry => entry.playerName)
  addColumn(scene, gridSizer, 1, 'Score', scoreboard, entry => `${entry.score} (${entry.bestScore})`)
  addColumn(scene, gridSizer, 2, 'Best card', scoreboard, entry => `${entry.bestCard}`)
  addColumn(scene, gridSizer, 3, 'Cards placed', scoreboard, entry => `${entry.cardsPlaced}`)

  return gridSizer.layout()
}

class ScoreboardDialogScene extends ModalDialogBaseScene {

  scoreboard: Scoreboard
  isGameOver: boolean
  onPlayAgain?: () => void
  onHome?: () => void

  constructor(
    scoreboard: Scoreboard,
    isGameOver: boolean,
    onPlayAgain?: () => void,
    onHome?: () => void
  ) {
    super('ScoreboardDialog')
    this.scoreboard = scoreboard
    this.isGameOver = isGameOver
    this.onPlayAgain = onPlayAgain
    this.onHome = onHome
  }


  protected getDialogConfig(): Dialog.IConfig {

    const maybeActions = this.isGameOver
      ? {
        actions: [
          ui.createLabel(this, 'Play Again')
            .setName('playAgainButton')
            .setInteractive({ useHandCursor: true }),
          ui.createLabel(this, 'Home')
            .setName('homeButton')
            .setInteractive({ useHandCursor: true })
        ]
      }
      : undefined

    return {
      title: this.add.text(0, 0, 'Scoreboard', ui.TEXT_STYLE),
      content: createTable(this, this.scoreboard),
      expand: { title: false },
      ...maybeActions
    }
  }

  create() {
    super.create()
    this.dialog.on('button.click', (
      gameObject: Phaser.GameObjects.GameObject,
      _groupName: string,
      _index: number,
      _pointer: Phaser.Input.Pointer,
      _event: Phaser.Types.Input.EventData) => {
      switch (gameObject.name) {
        case 'playAgainButton':
          this.closeDialog()
          this.onPlayAgain?.()
          break
        case 'homeButton':
          this.closeDialog()
          this.onHome?.()
          break
      }
    })
  }
}

export const createScoreboardDialog = (
  parentScene: Phaser.Scene,
  scoreboard: Scoreboard,
  isGameOver: boolean,
  onPlayAgain?: () => void,
  onHome?: () => void
): void => {
  parentScene.scene.add(
    undefined,
    new ScoreboardDialogScene(scoreboard, isGameOver, onPlayAgain, onHome),
    true)
}
