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

class PlayerScore {

  private _score: number
  private _bestScore: number
  private _scores: number[]

  constructor(public readonly player: Player) {
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

  public reset(): void {
    this._score = 0
    this._bestScore = 0
    this._scores = []
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

  private readonly playerScores: PlayerScore[]
  private nextPlayerIndex: number
  private currentPlayerScore: PlayerScore
  private _isGameOver: boolean

  constructor(
    private eventEmitter: Phaser.Events.EventEmitter,
    public readonly players: readonly Player[]
  ) {
    this.playerScores = this.players.map(player => new PlayerScore(player))
    this.nextPlayerIndex = 0
    this.currentPlayerScore = null
    this._isGameOver = false
    this.eventEmitter.on(ContinuoAppEvents.NewGame, this.onNewGame, this)
  }

  public step(): void {
    if (this._isGameOver) {
      return
    }
    this.currentPlayerScore = this.playerScores[this.nextPlayerIndex]
    this.nextPlayerIndex = (this.nextPlayerIndex + 1) % this.playerScores.length
    this.eventEmitter.emit(ContinuoAppEvents.NextTurn, {
      currentPlayer: this.currentPlayerScore.player,
      scoreboard: this.makeScoreboard()
    })
    this.eventEmitter.emit(ContinuoAppEvents.UpdateScoreboard, this.scoreboard)
  }

  public reset(): void {
    this.playerScores.forEach(playerScore => playerScore.reset())
    this.nextPlayerIndex = 0
    this.currentPlayerScore = null
    this._isGameOver = false
    this.eventEmitter.emit(ContinuoAppEvents.UpdateScoreboard, this.scoreboard)
  }

  public addTurnScore(player: Player, score: number, bestScore: number): void {
    const playerScore = this.playerScores.find(playerScore => playerScore.player == player)
    if (playerScore) {
      playerScore.addTurnScore(score, bestScore)
      this.eventEmitter.emit(ContinuoAppEvents.UpdateScoreboard, this.scoreboard)
    }
  }

  public gameOver() {
    this.currentPlayerScore = null
    this._isGameOver = true
  }

  public get scoreboard(): Scoreboard {
    return this.makeScoreboard()
  }

  public get isGameOver(): boolean {
    return this._isGameOver
  }

  private onNewGame() {
    log.debug('[TurnManager#onNewGame]')
    this.reset()
    this.step()
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
