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

    if (this.scene.sys.game.device.fullscreen.available) {
      if (this.scene.scale.isFullscreen) {
        this.leaveFullscreenButton = this.makeLeaveFullscreenButton()
        this.sizer.add(this.leaveFullscreenButton)
      } else {
        this.enterFullscreenButton = this.makeEnterFullscreenButton()
        this.sizer.add(this.enterFullscreenButton)
      }

      this.scene.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        _event: Phaser.Types.Input.EventData
      ) => {
        switch (gameObject.name) {
          case 'enterFullscreenButton': return this.onEnterFullscreenClick()
          case 'leaveFullscreenButton': return this.onLeaveFullscreenClick()
        }
      })
    }
  }

  private makeEnterFullscreenButton(): RexUIPlugin.Label {
    return ui.createHUDSceneButton(this.scene, 'enterFullscreenButton', 'arrows-out', .4)
  }

  private makeLeaveFullscreenButton(): RexUIPlugin.Label {
    return ui.createHUDSceneButton(this.scene, 'leaveFullscreenButton', 'arrows-in', .4)
  }

  private onEnterFullscreenClick(): void {
    this.scene.scale.startFullscreen()
    this.leaveFullscreenButton = this.makeLeaveFullscreenButton()
    this.sizer
      .remove(this.enterFullscreenButton, true)
      .add(this.leaveFullscreenButton)
      .layout()
  }

  private onLeaveFullscreenClick(): void {
    this.scene.scale.stopFullscreen()
    this.enterFullscreenButton = this.makeEnterFullscreenButton()
    this.sizer
      .remove(this.leaveFullscreenButton, true)
      .add(this.enterFullscreenButton)
      .layout()
  }
}
