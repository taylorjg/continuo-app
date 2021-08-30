import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from './types'
import * as ui from './ui'

export class Fullscreen {

  private scene: SceneWithRexUI
  private sizer: RexUIPlugin.Sizer
  private enterFullscreenButton: RexUIPlugin.Label
  private leaveFullscreenButton: RexUIPlugin.Label

  public constructor(scene: SceneWithRexUI, sizer: RexUIPlugin.Sizer) {

    this.scene = scene
    this.sizer = sizer

    if (scene.sys.game.device.fullscreen.available) {
      if (scene.scale.isFullscreen) {
        this.leaveFullscreenButton = ui.createHUDSceneButton(scene, 'leaveFullscreenButton', 'arrows-in', .4)
        sizer.add(this.leaveFullscreenButton)
      } else {
        this.enterFullscreenButton = ui.createHUDSceneButton(scene, 'enterFullscreenButton', 'arrows-out', .4)
        sizer.add(this.enterFullscreenButton)
      }

      this.scene.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        _event: Phaser.Types.Input.EventData) => {
        switch (gameObject.name) {
          case 'enterFullscreenButton': return this.onEnterFullscreenClick()
          case 'leaveFullscreenButton': return this.onLeaveFullscreenClick()
        }
      })
    }
  }

  private onEnterFullscreenClick(): void {
    this.scene.scale.startFullscreen()
    this.leaveFullscreenButton = ui.createHUDSceneButton(this.scene, 'leaveFullscreenButton', 'arrows-in', .4)
    this.sizer
      .remove(this.enterFullscreenButton, true)
      .add(this.leaveFullscreenButton)
      .layout()
  }

  private onLeaveFullscreenClick(): void {
    this.scene.scale.stopFullscreen()
    this.enterFullscreenButton = ui.createHUDSceneButton(this.scene, 'enterFullscreenButton', 'arrows-out', .4)
    this.sizer
      .remove(this.leaveFullscreenButton, true)
      .add(this.enterFullscreenButton)
      .layout()
  }
}
