import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from './types'
import { Scoreboard, ScoreboardEntry } from './turnManager'
import { ContinuoAppEvents } from './constants'
import * as ui from './ui'

export class MiniScoreboard {

  private eventEmitter: Phaser.Events.EventEmitter
  private scene: SceneWithRexUI
  private cellMap: Map<string, RexUIPlugin.Label>
  private gridSizer: RexUIPlugin.GridSizer

  public constructor(
    eventEmitter: Phaser.Events.EventEmitter,
    scene: SceneWithRexUI,
    scoreboard: Scoreboard,
    y: number
  ) {
    this.scene = scene
    this.eventEmitter = eventEmitter
    this.cellMap = new Map<string, RexUIPlugin.Label>()

    this.gridSizer = scene.rexUI.add.gridSizer({
      x: 0,
      y,
      column: 3,
      row: scoreboard.length,
      space: { row: 10, column: 10, left: 10, right: 10, top: 10, bottom: 10 },
      anchor: { left: 'left+10' }
    })

    this.gridSizer.addBackground(ui.createLabelBackgroundWithBorder(scene))

    this.addMarkers(0, scoreboard)
    this.addColumnValues(1, scoreboard, entry => entry.playerName)
    this.addColumnValues(2, scoreboard, _entry => '')

    this.gridSizer
      .setOrigin(.5, 0)
      .layout()

    this.eventEmitter.on(ContinuoAppEvents.UpdateScoreboard, this.onUpdateScoreboard, this)
  }

  public destroy() {
    this.eventEmitter.off(ContinuoAppEvents.UpdateScoreboard, this.onUpdateScoreboard, this)
    this.gridSizer.destroy()
  }

  private addMarkers(column: number, scoreboard: Scoreboard): void {
    scoreboard.forEach((_, index) => {
      const child = this.scene.rexUI.add.label({
        icon: this.scene.add.image(0, 0, 'play').setScale(.5)
      })
      this.cellMap.set(`${column}:${index}`, child)
      child.setVisible(false)
      this.gridSizer.add(child, { column })
    })
  }

  private addColumnValues(
    column: number,
    scoreboard: Scoreboard,
    makeText: (entry: ScoreboardEntry) => string
  ): void {
    scoreboard.forEach((entry, index) => {
      const text = makeText(entry)
      const child = this.scene.rexUI.add.label({
        text: this.scene.add.text(0, 0, text, ui.TEXT_STYLE_SMALL)
      })
      this.cellMap.set(`${column}:${index}`, child)
      this.gridSizer.add(child, { column, align: column == 1 ? 'left' : 'center' })
    })
  }

  private onUpdateScoreboard(scoreboard: Scoreboard) {

    scoreboard.forEach((entry, index) => {

      const markerLabel = this.cellMap.get(`0:${index}`)
      markerLabel.setVisible(entry.isCurrentPlayer)

      const scoreLabel = this.cellMap.get(`2:${index}`)
      scoreLabel.text = `${entry.score} (${entry.bestScore})`
    })

    this.gridSizer.layout()
  }
}
