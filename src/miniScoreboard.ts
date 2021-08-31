import GridSizer from 'phaser3-rex-plugins/templates/ui/gridsizer/GridSizer'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from './types'
import { Scoreboard, ScoreboardEntry } from './turnManager'
import * as ui from './ui'

const addMarkers = (
  scene: SceneWithRexUI,
  gridSizer: GridSizer,
  column: number,
  scoreboard: Scoreboard): void => {
  scoreboard.forEach((_, index) => {
    const child = scene.rexUI.add.label({
      icon: scene.add.image(0, 0, 'play').setScale(.5)
    })
    child.setData('column', column)
    child.setData('index', index)
    child.setVisible(false)
    gridSizer.add(child, { column })
  })
}

const addColumnValues = (
  scene: SceneWithRexUI,
  gridSizer: GridSizer,
  column: number,
  scoreboard: Scoreboard,
  makeText: (entry: ScoreboardEntry) => string): void => {
  scoreboard.forEach((entry, index) => {
    const text = makeText(entry)
    const child = scene.rexUI.add.label({
      text: scene.add.text(0, 0, text, ui.TEXT_STYLE_SMALL)
    })
    child.setData('column', column)
    child.setData('index', index)
    gridSizer.add(child, { column, align: column == 1 ? 'left' : 'center' })
  })
}

export class MiniScoreboard {

  eventEmitter: Phaser.Events.EventEmitter
  gridSizer: GridSizer

  public constructor(
    scene: SceneWithRexUI,
    eventEmitter: Phaser.Events.EventEmitter,
    scoreboard: Scoreboard,
    y: number
  ) {
    this.eventEmitter = eventEmitter
    this.gridSizer = scene.rexUI.add.gridSizer({
      x: 0,
      y,
      column: 3,
      row: scoreboard.length,
      space: { row: 10, column: 10, left: 10, right: 10, top: 10, bottom: 10 },
      anchor: { left: 'left+10' }
    })

    this.gridSizer.addBackground(ui.createLabelBackgroundWithBorder(scene))

    addMarkers(scene, this.gridSizer, 0, scoreboard)
    addColumnValues(scene, this.gridSizer, 1, scoreboard, entry => entry.playerName)
    addColumnValues(scene, this.gridSizer, 2, scoreboard, _entry => '')

    this.gridSizer
      // .setInteractive({ useHandCursor: true })
      .setOrigin(.5, 0)
      .layout()

    this.eventEmitter.on('updateScoreboard', this.onUpdateScoreboard, this)
  }

  private onUpdateScoreboard(scoreboard: Scoreboard) {
    scoreboard.forEach((entry, index) => {
      const childGameObject1 = this.gridSizer.getAllChildren().find(c => c.getData('column') == 0 && c.getData('index') == index)
      if (childGameObject1) {
        const label = <RexUIPlugin.Label>childGameObject1
        label.setVisible(entry.isCurrentPlayer)
      }
      const childGameObject2 = this.gridSizer.getAllChildren().find(c => c.getData('column') == 2 && c.getData('index') == index)
      if (childGameObject2) {
        const label = <RexUIPlugin.Label>childGameObject2
        label.text = `${entry.score} (${entry.bestScore})`
      }
    })
    this.gridSizer.layout()
  }

  public destroy() {
    this.gridSizer.destroy()
  }
}
