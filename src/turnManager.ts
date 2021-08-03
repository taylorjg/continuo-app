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

export class TurnManager {

  private readonly playerScores: PlayerScore[]
  private nextPlayerIndex: number

  constructor(
    private eventEmitter: Phaser.Events.EventEmitter,
    public readonly players: readonly Player[] = DEFAULT_PLAYERS) {
    this.playerScores = this.players.map(player => new PlayerScore(player))
    this.nextPlayerIndex = 0
  }

  public step(): void {
    const playerScore = this.playerScores[this.nextPlayerIndex]
    this.nextPlayerIndex = (this.nextPlayerIndex + 1) % this.players.length
    this.eventEmitter.emit('nextTurn', { playerScore })
  }

  public reset(): void {
    this.playerScores.forEach(playerScore => playerScore.reset())
    this.nextPlayerIndex = 0
  }

  public addTurnScore(playerScore: PlayerScore, score: number, bestScore: number): void {
    playerScore.addTurnScore(score, bestScore)
  }
}
