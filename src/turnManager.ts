import log from 'loglevel'
import { ContinuoAppEvents } from './constants'

export enum PlayerType {
  Human,
  Computer
}

export class Player {
  constructor(
    public readonly name: string,
    public readonly type: PlayerType
  ) {
  }
}

export const DEFAULT_PLAYERS = [
  new Player('You', PlayerType.Human),
  new Player('Computer', PlayerType.Computer)
]

class PlayerScore {

  private _score: number
  private _bestScore: number
  private _scores: number[]

  constructor(public readonly player: Player) {
    this.reset()
  }

  public reset(): void {
    this._score = 0
    this._bestScore = 0
    this._scores = []
  }

  public get score(): number {
    return this._score
  }

  public get bestScore(): number {
    return this._bestScore
  }

  public get bestCard(): number {
    return this._scores.length > 0
      ? Math.max(...this._scores)
      : 0
  }

  public get cardsPlaced(): number {
    return this._scores.length
  }

  public addTurnScore(score: number, bestScore: number) {
    this._score += score
    this._bestScore += bestScore
    this._scores.push(score)
  }
}

export class ScoreboardEntry {
  constructor(
    public readonly playerName: string,
    public readonly score: number,
    public readonly bestScore: number,
    public readonly bestCard: number,
    public readonly cardsPlaced: number,
    public readonly isCurrentPlayer: boolean
  ) {
  }
}

export type Scoreboard = ScoreboardEntry[]

export class TurnManager {

  private playerScores: PlayerScore[]
  private nextPlayerIndex: number
  private currentPlayerScore: PlayerScore

  public constructor(private eventEmitter: Phaser.Events.EventEmitter) {
    this.eventEmitter.on(ContinuoAppEvents.NewGame, this.onNewGame, this)
    this.eventEmitter.on(ContinuoAppEvents.ReadyForNextTurn, this.onReadyForNextTurn, this)
    this.eventEmitter.on(ContinuoAppEvents.EndMove, this.onEndMove, this)
  }

  private reset(players: readonly Player[]): void {
    this.playerScores = players.map(player => new PlayerScore(player))
    this.nextPlayerIndex = 0
    this.currentPlayerScore = null
    setTimeout(() => {
      this.eventEmitter.emit(ContinuoAppEvents.ScoreboardUpdated, this.makeScoreboard())
    })
  }

  private step(): void {
    this.currentPlayerScore = this.playerScores[this.nextPlayerIndex]
    this.nextPlayerIndex = (this.nextPlayerIndex + 1) % this.playerScores.length
    this.eventEmitter.emit(ContinuoAppEvents.NextTurn, this.currentPlayerScore.player)
    this.eventEmitter.emit(ContinuoAppEvents.ScoreboardUpdated, this.makeScoreboard())
  }

  private addTurnScore(player: Player, score: number, bestScore: number): void {
    const playerScore = this.playerScores.find(playerScore => playerScore.player == player)
    if (playerScore) {
      playerScore.addTurnScore(score, bestScore)
      this.eventEmitter.emit(ContinuoAppEvents.ScoreboardUpdated, this.makeScoreboard())
    }
  }

  private onNewGame(players: readonly Player[]) {
    log.debug('[TurnManager#onNewGame]', players)
    this.reset(players)
  }

  private onReadyForNextTurn() {
    log.debug('[TurnManager#onReadyForNextTurn]')
    this.step()
  }

  private onEndMove(arg: any) {
    log.debug('[TurnManager#onEndMove]', arg)
    this.currentPlayerScore = null
    const player = <Player>arg.player
    const score = <number>arg.score
    const bestScore = <number>arg.bestScore
    this.addTurnScore(player, score, bestScore)
    const numCardsLeft = <number>arg.numCardsLeft
    if (numCardsLeft == 0) {
      this.eventEmitter.emit(ContinuoAppEvents.GameOver, this.makeScoreboard())
    }
  }

  private makeScoreboard(): Scoreboard {
    return this.playerScores.map(playerScore =>
      new ScoreboardEntry(
        playerScore.player.name,
        playerScore.score,
        playerScore.bestScore,
        playerScore.bestCard,
        playerScore.cardsPlaced,
        playerScore == this.currentPlayerScore
      )
    )
  }
}
