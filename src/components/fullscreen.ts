import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { SceneWithRexUI } from '../types'
import * as ui from '../ui'

export class Fullscreen {

  private scene: SceneWithRexUI
  private sizer: RexUIPlugin.Sizer
  private enterFullscreenButton: RexUIPlugin.Label
  private leaveFullscreenButton: RexUIPlugin.Label

  public constructor(scene: SceneWithRexUI, sizer: RexUIPlugin.Sizer) {

    this.scene = scene
    this.sizer = sizer
    this.enterFullscreenButton = null
    this.leaveFullscreenButton = null

    if (this.scene.sys.game.device.fullscreen.available) {

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

      const onResize = () => this.resize()
      window.addEventListener('resize', onResize)

      this.resize()
    }
  }

  private isFullscreen() {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const screenWidth = window.screen.availWidth
    const screenHeight = window.screen.availHeight
    return windowWidth == screenWidth || windowHeight == screenHeight
  }

  private resize(): void {
    if (this.isFullscreen() != this.scene.scale.isFullscreen) {
      if (this.isFullscreen()) {
        // Looks like we have entered fullscreen via F11/browser menu
        this.hideButtons()
      } else {
        // Looks like we have exited fullscreen via F11/browser menu
        this.showButtons()
      }
    } else {
      this.showButtons()
    }
  }

  private showButtons() {
    this.hideButtons()
    if (this.scene.scale.isFullscreen) {
      if (!this.leaveFullscreenButton) {
        this.leaveFullscreenButton = this.makeLeaveFullscreenButton()
        this.sizer.add(this.leaveFullscreenButton).layout()
      }
    } else {
      if (!this.enterFullscreenButton) {
        this.enterFullscreenButton = this.makeEnterFullscreenButton()
        this.sizer.add(this.enterFullscreenButton).layout()
      }
    }
  }

  private hideButtons() {
    if (this.enterFullscreenButton) {
      this.sizer.remove(this.enterFullscreenButton, true).layout()
      this.enterFullscreenButton = null
    }
    if (this.leaveFullscreenButton) {
      this.sizer.remove(this.leaveFullscreenButton, true).layout()
      this.leaveFullscreenButton = null
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
    this.enterFullscreenButton = null
  }

  private onLeaveFullscreenClick(): void {
    this.scene.scale.stopFullscreen()
    this.enterFullscreenButton = this.makeEnterFullscreenButton()
    this.sizer
      .remove(this.leaveFullscreenButton, true)
      .add(this.enterFullscreenButton)
      .layout()
    this.leaveFullscreenButton = null
  }
}
