import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import GridSizer from 'phaser3-rex-plugins/templates/ui/gridsizer/GridSizer'
import { ModalDialogBaseScene } from './modalDialogBase'
import { SceneWithRexUI } from './types'
import { Scoreboard, ScoreboardEntry } from './turnManager'
import * as ui from './ui'

const addRowLabel = (scene: SceneWithRexUI, sizer: GridSizer, row: number, text: string) => {
  const child = scene.rexUI.add.label({ text: scene.add.text(0, 0, text, ui.TEXT_STYLE) })
  sizer.add(child, { row, align: 'left' })
}

const addRowValues = (scene: SceneWithRexUI, sizer: GridSizer, row: number, scoreboard: Scoreboard, makeText: (entry: ScoreboardEntry) => string) => {
  scoreboard.forEach(entry => {
    const text = makeText(entry)
    const child = scene.rexUI.add.label({ align: 'center', text: scene.add.text(0, 0, text, ui.TEXT_STYLE) })
    sizer.add(child, { row })
  })
}

const createTable = (scene: SceneWithRexUI, scoreboard: Scoreboard): Phaser.GameObjects.GameObject => {

  const sizer = scene.rexUI.add.gridSizer({
    column: 1 + scoreboard.length,
    row: 5,
    space: { row: 10, column: 40, left: 10, right: 10, top: 10, bottom: 10 }
  })

  addRowLabel(scene, sizer, 0, 'Player name:')
  addRowValues(scene, sizer, 0, scoreboard, entry => entry.playerName)

  addRowLabel(scene, sizer, 1, 'Score:')
  addRowValues(scene, sizer, 1, scoreboard, entry => `${entry.score} (${entry.bestScore})`)

  addRowLabel(scene, sizer, 2, 'Highest card score:')
  addRowValues(scene, sizer, 2, scoreboard, _entry => 'TODO')

  addRowLabel(scene, sizer, 3, 'Longest chain:')
  addRowValues(scene, sizer, 3, scoreboard, _entry => 'TODO')

  addRowLabel(scene, sizer, 4, 'Number of moves:')
  addRowValues(scene, sizer, 4, scoreboard, _entry => 'TODO')

  return sizer.layout()
}

class ScoreboardDialogScene extends ModalDialogBaseScene {

  scoreboard: Scoreboard

  constructor(scoreboard: Scoreboard) {
    super('ScoreboardDialog')
    this.scoreboard = scoreboard
  }


  protected getDialogConfig(): Dialog.IConfig {
    return {
      title: this.add.text(0, 0, 'Scoreboard', ui.TEXT_STYLE),
      content: createTable(this, this.scoreboard),
      expand: { title: false },
      actions: [
        ui.createLabel(this, 'Play Again').setInteractive({ useHandCursor: true }),
        ui.createLabel(this, 'Home').setInteractive({ useHandCursor: true })
      ]
    }
  }
}

export const createScoreboardDialog = (parentScene: Phaser.Scene, scoreboard: Scoreboard): void => {
  parentScene.scene.add(undefined, new ScoreboardDialogScene(scoreboard), true)
}
