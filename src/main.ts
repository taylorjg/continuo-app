import * as Phaser from 'phaser'
import log from 'loglevel'
// import { ContinuoBoardScene } from './continuoBoardScene'
import { HexagoBoardScene } from './hexagoBoardScene'
import { HUDScene } from './hudScene'

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Continuo',
  type: Phaser.AUTO,
  scale: {
    width: window.innerWidth,
    height: window.innerHeight,
    mode: Phaser.Scale.NONE,
    fullscreenTarget: 'game'
  },
  backgroundColor: '#AAAAAA',
  // scene: [ContinuoBoardScene, HUDScene],
  scene: [HexagoBoardScene, HUDScene],
  parent: 'game',
  dom: {
    createContainer: true
  }
}

const main = () => {
  (window as any).log = log
  log.setLevel('info')
  new Phaser.Game(gameConfig)
}

main()
