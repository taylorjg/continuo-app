import * as Phaser from 'phaser'
import { ContinuoAppEvents } from './constants'

export class EventCentre {

  private eventEmitter: Phaser.Events.EventEmitter
  private emitting: boolean

  public constructor() {
    this.eventEmitter = new Phaser.Events.EventEmitter()
    this.emitting = false
  }

  public on(event: ContinuoAppEvents, fn: Function, context?: any): void {
    this.eventEmitter.on(event, fn, context)
  }

  public off(event: ContinuoAppEvents, fn?: Function, context?: any): void {
    this.eventEmitter.off(event, fn, context)
  }

  public emit(event: ContinuoAppEvents, ...args: any[]): void {
    if (this.emitting) {
      setTimeout(() => {
        this.emit(event, ...args)
      })
    } else {
      try {
        this.emitting = true
        this.eventEmitter.emit(event, ...args)
      } finally {
        this.emitting = false
      }
    }
  }
}
