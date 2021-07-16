export interface IBoardScene {
  onRestart(): void
  onNextCard(): void
  onRotateCW(): void
  onRotateCCW(): void
  onPlaceCard(): number
}
