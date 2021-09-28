import log from 'loglevel'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from './types'
import { EventCentre } from './eventCentre'
import { Player, Scoreboard } from './turnManager'
import { ContinuoAppEvents } from './constants'
import * as ui from './ui'

export class MiniScoreboard {

  private eventCentre: EventCentre
  private scene: SceneWithRexUI
  private y: number
  private cellMap: Map<string, RexUIPlugin.Label>
  private gridSizer: RexUIPlugin.GridSizer

  public constructor(
    eventCentre: EventCentre,
    scene: SceneWithRexUI,
    y: number
  ) {
    this.eventCentre = eventCentre
    this.scene = scene
    this.y = y
    this.cellMap = new Map<string, RexUIPlugin.Label>()
    this.eventCentre.on(ContinuoAppEvents.NewGame, this.onNewGame, this)
    this.eventCentre.on(ContinuoAppEvents.PlayersChanged, this.onPlayersChanged, this)
    this.eventCentre.on(ContinuoAppEvents.ScoreboardUpdated, this.onScoreboardUpdated, this)
  }

  private makeNewGridSizer = (players: readonly Player[]): void => {

    if (this.gridSizer) {
      this.gridSizer.destroy()
    }

    this.gridSizer = this.scene.rexUI.add.gridSizer({
      x: 0,
      y: this.y,
      column: 3,
      row: players.length,
      space: { row: 10, column: 10, left: 10, right: 10, top: 10, bottom: 10 },
      anchor: { left: 'left+10' }
    })

    this.gridSizer.addBackground(ui.createLabelBackgroundWithBorder(this.scene))

    this.addMarkers(0, players)
    this.addColumnValues(1, players, player => player.name)
    this.addColumnValues(2, players, _player => '')

    this.gridSizer
      .setOrigin(.5, 0)
      .layout()
  }

  private addMarkers(column: number, players: readonly Player[]): void {
    players.forEach((_, index) => {
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
    players: readonly Player[],
    makeText: (player: Player) => string
  ): void {
    players.forEach((player, index) => {
      const text = makeText(player)
      const child = this.scene.rexUI.add.label({
        text: this.scene.add.text(0, 0, text, ui.TEXT_STYLE_SMALL)
      })
      this.cellMap.set(`${column}:${index}`, child)
      this.gridSizer.add(child, { column, align: column == 1 ? 'left' : 'center' })
    })
  }

  public onNewGame(players: readonly Player[]): void {
    log.debug('[MiniScoreboard#onNewGame]', players)
    this.makeNewGridSizer(players)
  }

  public onPlayersChanged(players: readonly Player[]): void {
    log.debug('[MiniScoreboard#onPlayersChanged]', players)
    this.makeNewGridSizer(players)
  }

  private onScoreboardUpdated(scoreboard: Scoreboard) {
    log.debug('[MiniScoreboard#onScoreboardUpdated]', scoreboard)

    scoreboard.forEach((entry, index) => {

      const markerLabel = this.cellMap.get(`0:${index}`)
      markerLabel.setVisible(entry.isCurrentPlayer)

      const scoreLabel = this.cellMap.get(`2:${index}`)
      scoreLabel.text = `${entry.score} (${entry.bestScore})`
    })

    this.gridSizer.layout()
  }
}
