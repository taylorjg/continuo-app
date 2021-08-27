export enum PlayerType {
  Human,
  Computer
}

export class Player {
  constructor(
    public readonly name: string,
    public readonly type: PlayerType) {
  }
}

const DEFAULT_PLAYERS = [
  new Player('You', PlayerType.Human),
  new Player('Computer', PlayerType.Computer)
]

export class PlayerScore {

  private _score: number
  private _bestScore: number

  constructor(public readonly player: Player) {
  }

  public get score() {
    return this._score
  }

  public get bestScore() {
    return this._bestScore
  }

  public addTurnScore(score: number, bestScore: number) {
    this._score += score
    this._bestScore += bestScore
  }

  public reset(): void {
    this._score = 0
    this._bestScore = 0
  }
}

export class ScoreboardEntry {
  constructor(
    public playerName: string,
    public score: number,
    public bestScore: number,
    public isCurrentPlayer: boolean
  ) {
  }
}

export type Scoreboard = ScoreboardEntry[]

export class TurnManager {

  private readonly playerScores: PlayerScore[]
  private nextPlayerIndex: number
  private currentPlayerScore: PlayerScore
  private isGameOver: boolean

  constructor(
    private eventEmitter: Phaser.Events.EventEmitter,
    public readonly players: readonly Player[] = DEFAULT_PLAYERS) {
    this.playerScores = this.players.map(player => new PlayerScore(player))
    this.nextPlayerIndex = 0
    this.currentPlayerScore = null
    this.isGameOver = false
  }

  public step(): void {
    if (this.isGameOver) {
      return
    }
    this.currentPlayerScore = this.playerScores[this.nextPlayerIndex]
    this.nextPlayerIndex = (this.nextPlayerIndex + 1) % this.playerScores.length
    this.eventEmitter.emit('nextTurn', {
      currentPlayerScore: this.currentPlayerScore,
      scoreboard: this.makeScoreboard()
    })
  }

  public reset(): void {
    this.playerScores.forEach(playerScore => playerScore.reset())
    this.nextPlayerIndex = 0
    this.currentPlayerScore = null
    this.isGameOver = false
  }

  public addTurnScore(playerScore: PlayerScore, score: number, bestScore: number): void {
    playerScore.addTurnScore(score, bestScore)
  }

  public gameOver() {
    this.currentPlayerScore = null
    this.isGameOver = true
    this.eventEmitter.emit('finalScores', {
      scoreboard: this.makeScoreboard()
    })
  }

  public get scoreboard(): Scoreboard {
    return this.makeScoreboard()
  }

  private makeScoreboard(): Scoreboard {
    return this.playerScores.map(playerScore =>
      new ScoreboardEntry(
        playerScore.player.name,
        playerScore.score,
        playerScore.bestScore,
        playerScore == this.currentPlayerScore
      )
    )
  }
}
