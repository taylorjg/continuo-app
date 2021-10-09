import * as Phaser from 'phaser'
import { promisifyTween } from './promisifyThings'

// https://www.emanueleferonato.com/2018/07/19/playing-with-phaser-3-tweens-curves-and-cubic-bezier-curves/
export const tweenAlongCurve = (
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Components.Transform,
  fromPosition: Phaser.Geom.Point,
  toPosition: Phaser.Geom.Point,
  fromAngle: number,
  toAngle: number
): Promise<void> => {
  const line = new Phaser.Geom.Line(fromPosition.x, fromPosition.y, toPosition.x, toPosition.y)
  const lineLength = Phaser.Geom.Line.Length(line)
  const normal = Phaser.Geom.Line.GetNormal(line)
  const normalElongated = Phaser.Geom.Point.Invert(Phaser.Geom.Point.SetMagnitude(normal, lineLength * 0.2))
  const fromV = new Phaser.Math.Vector2(fromPosition)
  const toV = new Phaser.Math.Vector2(toPosition)
  const control1V = new Phaser.Math.Vector2(Phaser.Geom.Point.Interpolate(fromPosition, toPosition, 0.2)).add(normalElongated)
  const control2V = new Phaser.Math.Vector2(Phaser.Geom.Point.Interpolate(fromPosition, toPosition, 0.8)).add(normalElongated)
  const bezierCurve = new Phaser.Curves.CubicBezier(fromV, control1V, control2V, toV)
  const tweenObject = { t: 0, angle: fromAngle }
  return promisifyTween(scene.tweens.add({
    targets: tweenObject,
    duration: lineLength / 2,
    ease: 'Sine.Out',
    t: 1,
    angle: toAngle,
    onUpdate: (_, tweenObjectCurrent) => {
      const p = bezierCurve.getPoint(tweenObjectCurrent.t)
      target.setPosition(p.x, p.y)
      if (fromAngle != toAngle) {
        target.setAngle(tweenObjectCurrent.angle)
      }
    }
  }))
}
