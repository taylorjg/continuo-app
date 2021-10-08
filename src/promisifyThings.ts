import * as Phaser from 'phaser'

export const promisifyTween = (tween: Phaser.Tweens.Tween): Promise<void> => {
  return new Promise(resolve => {
    tween.once(Phaser.Tweens.Events.TWEEN_COMPLETE, resolve)
  })
}

export const promisifyDelayedCall = (scene: Phaser.Scene, delay: number): Promise<void> => {
  return new Promise(resolve => {
    scene.time.delayedCall(delay, resolve)
  })
}
