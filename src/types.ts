export interface IBoardScene {
  onRestart(): void
  onNextCard(): void
  onComputerMove(): Promise<void>
  onRotateCW(): void
  onRotateCCW(): void
  onPlaceCard(): number
}
