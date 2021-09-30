import Dialog from 'phaser3-rex-plugins/templates/ui/dialog/Dialog'
import GridSizer from 'phaser3-rex-plugins/templates/ui/gridsizer/GridSizer'
import Label from 'phaser3-rex-plugins/templates/ui/label/Label'
import Sizer from 'phaser3-rex-plugins/templates/ui/sizer/Sizer'
import { EventCentre } from '../eventCentre'
import { ModalDialogBaseScene } from './modalDialogBase'
import { Player, PlayerType } from '../turnManager'
import { ContinuoAppEvents } from '../constants'
import * as ui from '../ui'

const TITLE_STEP1 = 'Choose Players (Step 1)'
const TITLE_STEP2 = 'Choose Players (Step 2)'

const TEXTBOX_WIDTH = 250

class PlayersDialogScene extends ModalDialogBaseScene {

  private title: Phaser.GameObjects.Text
  private contentSizer: Sizer
  private singlePlayerName = 'You'
  private numPlayers = 2
  private multiPlayerNames: [string, string, string, string] = [
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4'
  ]
  private getPlayers: () => readonly Player[]

  constructor(
    private eventCentre: EventCentre,
    private players: readonly Player[],
    private onDone?: (players: readonly Player[]) => void
  ) {
    super('PlayersDialog')
    if (this.players.length == 2 && this.players[0].type == PlayerType.Human && this.players[1].type == PlayerType.Computer) {
      this.singlePlayerName = this.players[0].name
    } else {
      const safePlayers = this.players.slice(0, this.multiPlayerNames.length)
      this.numPlayers = safePlayers.length
      safePlayers.forEach((player, index) => this.multiPlayerNames[index] = player.name)
    }
  }

  private getPlayersSingle(): readonly Player[] {
    return [
      new Player(this.singlePlayerName, PlayerType.Human),
      new Player('Computer', PlayerType.Computer)
    ]
  }

  private getPlayersMultiLocal(): readonly Player[] {
    return this.multiPlayerNames
      .slice(0, this.numPlayers)
      .map(playerName => new Player(playerName, PlayerType.Human))
  }

  private onStep1() {
    const minButtonWidth = 400
    const button1 = ui.createLabel(this, 'Play against the computer', { alignCenter: true })
      .setMinWidth(minButtonWidth)
      .setName('singleButton')
      .setInteractive({ useHandCursor: true })
    const button2 = ui.createLabel(this, 'Multiplayer (local)', { alignCenter: true })
      .setMinWidth(minButtonWidth)
      .setName('multiLocalButton')
      .setInteractive({ useHandCursor: true })
    const button3 = ui.createLabel(this, 'Multiplayer (remote)', { alignCenter: true })
      .setMinWidth(minButtonWidth)
      .setName('multiRemoteButton')
      .setInteractive({ useHandCursor: true })
    const innerSizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 10 }
    })
    innerSizer
      .add(button1)
      .add(button2)
      .add(button3)
    this.contentSizer.add(innerSizer)
  }

  private makeTextField(getText: () => string, setText: (text: string) => void): Label {

    const background = ui.createLabelBackgroundWithBorder(this)
    const textbox = this.rexUI.add.BBCodeText(0, 0, getText(), { ...ui.TEXT_STYLE, fixedWidth: TEXTBOX_WIDTH })

    const textField = this.rexUI.add.label({
      orientation: 'horizontal',
      background,
      text: textbox,
      space: { top: 5, bottom: 5, left: 5, right: 5 }
    })

    // https://codepen.io/rexrainbow/pen/YbvwBw
    textField
      .setInteractive()
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        const config = {
          onTextChanged: (_textObject: Phaser.GameObjects.GameObject, text: string) => {
            setText(text)
            textbox.text = text
          }
        }
        this.rexUI.edit(textbox, config)
      })

    return textField
  }

  private onStep2Single() {
    const label = ui.createLabel(this, 'Your name:', { background: false })
    const textField = this.makeTextField(
      () => this.singlePlayerName,
      text => this.singlePlayerName = text
    )
    const innerSizer = this.rexUI.add.sizer({
      orientation: 'horizontal',
      space: { item: 10 }
    })
      .add(label)
      .add(textField)

    this.contentSizer.add(innerSizer)
    this.getPlayers = this.getPlayersSingle
  }

  private makePlayersGridSizer(): GridSizer {
    const gridSizer = this.rexUI.add.gridSizer({
      column: 2,
      row: this.numPlayers,
      space: { row: 10, column: 10, left: 10, right: 10, top: 10, bottom: 10 }
    })
    for (const index of Array.from(Array(this.numPlayers).keys())) {
      const label = ui.createLabel(this, `Player ${index + 1} name:`, { background: false })
      const textField = this.makeTextField(
        () => this.multiPlayerNames[index],
        text => this.multiPlayerNames[index] = text
      )
      gridSizer.add(label, { row: index })
      gridSizer.add(textField, { row: index })
    }
    return gridSizer.setName('playersGridSizer')
  }

  private onStep2MultiLocal() {
    const buttonsSizer = this.rexUI.add.sizer({
      orientation: 'horizontal',
      space: { item: 10, bottom: 20 }
    })
    const buttons = this.rexUI.add.buttons({
      orientation: 'horizontal',
      buttons: [
        ui.createRadioButton(this, '2-players', '2').setData('numPlayers', 2),
        ui.createRadioButton(this, '3-players', '3').setData('numPlayers', 3),
        ui.createRadioButton(this, '4-players', '4').setData('numPlayers', 4)
      ],
      space: { item: 20 },
      type: 'radio',
      setValueCallback: (gameObject: Phaser.GameObjects.GameObject, value: boolean, previousValue: boolean) => {
        ui.updateRadioButton(gameObject, value)
        if (previousValue !== undefined) {
          if (value) {
            const gridSizerOld = this.contentSizer.getChildren().find(({ name }) => name == 'playersGridSizer')
            if (gridSizerOld) {
              this.contentSizer.remove(gridSizerOld, true)
            }
            this.numPlayers = gameObject.getData('numPlayers')
            const gridSizer = this.makePlayersGridSizer()
            this.contentSizer.add(gridSizer).layout()
            this.dialog.layout()
            this.forceResize()
          }
        }
      }
    })

    buttonsSizer.add(ui.createLabel(this, 'Number of players:', { background: false }))
    buttonsSizer.add(buttons)
    this.contentSizer.add(buttonsSizer)

    buttons.setData(`${this.numPlayers}-players`, true)

    this.getPlayers = this.getPlayersMultiLocal
  }

  private onStep2MultiRemote() {
    const message = 'Sorry - this feature has not been implemented yet.'
    const text = this.add.text(0, 0, message, ui.TEXT_STYLE)
    this.contentSizer.add(text)
    this.getPlayers = () => []
  }

  private wrapStep1(fn: () => void) {
    this.contentSizer.removeAll(true)
    fn()
    this.contentSizer.layout()
    this.title.text = TITLE_STEP1
    this.dialog.clearActions(true).layout()
    this.forceResize()
  }

  private wrapStep2(fn: () => void) {
    this.contentSizer.removeAll(true)
    fn()
    this.contentSizer.layout()
    this.title.text = TITLE_STEP2
    this.dialog
      .addAction(ui.createLabel(this, 'Back').setName('backButton').setInteractive({ useHandCursor: true }))
      .addAction(ui.createLabel(this, 'Done').setName('doneButton').setInteractive({ useHandCursor: true }))
      .layout()
    this.forceResize()
  }

  protected getDialogConfig(): Dialog.IConfig {
    this.title = this.add.text(0, 0, TITLE_STEP1, ui.TEXT_STYLE)
    this.contentSizer = this.rexUI.add.sizer({
      orientation: 'vertical'
    })
    this.onStep1()
    return {
      title: this.title,
      content: this.contentSizer,
      actions: [],
      expand: { title: false }
    }
  }

  create() {
    super.create()

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.GameObject,
      _event: Phaser.Types.Input.EventData) => {
      switch (gameObject.name) {
        case 'singleButton':
          this.wrapStep2(() => this.onStep2Single())
          break
        case 'multiLocalButton':
          this.wrapStep2(() => this.onStep2MultiLocal())
          break
        case 'multiRemoteButton':
          this.wrapStep2(() => this.onStep2MultiRemote())
          this.dialog.setActionEnable(1, false)
          break
      }
    })

    this.dialog.on('button.click', (
      gameObject: Phaser.GameObjects.GameObject,
      _groupName: string,
      _index: number,
      _pointer: Phaser.Input.Pointer,
      _event: Phaser.Types.Input.EventData) => {
      switch (gameObject.name) {
        case 'backButton':
          this.wrapStep1(() => this.onStep1())
          break
        case 'doneButton':
          this.closeDialog()
          const players = this.getPlayers()
          this.eventCentre.emit(ContinuoAppEvents.PlayersChanged, players)
          this.onDone?.(players)
          break
      }
    })
  }
}

export const createPlayersDialog = (
  parentScene: Phaser.Scene,
  eventCentre: EventCentre,
  players: readonly Player[],
  onDone?: (players: readonly Player[]) => void
) => {
  parentScene.scene.add(undefined, new PlayersDialogScene(eventCentre, players, onDone), true)
}
