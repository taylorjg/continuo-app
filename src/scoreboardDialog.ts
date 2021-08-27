import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import GridSizer from 'phaser3-rex-plugins/templates/ui/gridsizer/GridSizer'
import { ModalDialogBaseScene } from './modalDialogBase'
import { SceneWithRexUI } from './types'
import { Scoreboard, ScoreboardEntry } from './turnManager'
import * as ui from './ui'

const addRow = (
  scene: SceneWithRexUI,
  sizer: GridSizer,
  row: number,
  text: string,
  scoreboard: Scoreboard,
  makeText: (entry: ScoreboardEntry) => string) => {
  addRowLabel(scene, sizer, row, text)
  addRowValues(scene, sizer, row, scoreboard, makeText)
}

const addRowLabel = (scene: SceneWithRexUI, sizer: GridSizer, row: number, text: string) => {
  const child = scene.rexUI.add.label({
    text: scene.add.text(0, 0, text, ui.TEXT_STYLE)
  })
  sizer.add(child, { row, align: 'left' })
}

const addRowValues = (
  scene: SceneWithRexUI,
  sizer: GridSizer,
  row: number,
  scoreboard: Scoreboard,
  makeText: (entry: ScoreboardEntry) => string) => {
  scoreboard.forEach(entry => {
    const text = makeText(entry)
    const child = scene.rexUI.add.label({
      text: scene.add.text(0, 0, text, ui.TEXT_STYLE),
      align: 'center'
    })
    sizer.add(child, { row })
  })
}

const createTable = (scene: SceneWithRexUI, scoreboard: Scoreboard): Phaser.GameObjects.GameObject => {

  const sizer = scene.rexUI.add.gridSizer({
    column: 1 + scoreboard.length,
    row: 4,
    space: { row: 10, column: 40, left: 10, right: 10, top: 10, bottom: 10 }
  })

  addRow(scene, sizer, 0, 'Player name:', scoreboard, entry => entry.playerName)
  addRow(scene, sizer, 1, 'Score:', scoreboard, entry => `${entry.score} (${entry.bestScore})`)
  addRow(scene, sizer, 2, 'Highest card score:', scoreboard, _entry => 'TODO')
  addRow(scene, sizer, 3, 'Number of moves:', scoreboard, _entry => 'TODO')

  return sizer.layout()
}

class ScoreboardDialogScene extends ModalDialogBaseScene {

  scoreboard: Scoreboard
  isGameOver: boolean
  onPlayAgain?: Function
  onHome?: Function

  constructor(scoreboard: Scoreboard, isGameOver: boolean, onPlayAgain?: Function, onHome?: Function) {
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
          this.onPlayAgain && this.onPlayAgain()
          break
        case 'homeButton':
          this.closeDialog()
          this.onHome && this.onHome()
          break
      }
    })
  }
}

export const createScoreboardDialog = (
  parentScene: Phaser.Scene,
  scoreboard: Scoreboard,
  isGameOver: boolean,
  onPlayAgain?: Function,
  onHome?: Function): void => {
  parentScene.scene.add(undefined, new ScoreboardDialogScene(scoreboard, isGameOver, onPlayAgain, onHome), true)
}
