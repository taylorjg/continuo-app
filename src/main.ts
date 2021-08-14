import * as Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import log from 'loglevel'
import { HomeScene } from './homeScene'
import { version } from '../package.json'

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
  scene: [HomeScene],
  parent: 'game',
  dom: {
    createContainer: true
  },
  plugins: {
    scene: [{
      key: 'rexUI',
      plugin: RexUIPlugin,
      mapping: 'rexUI'
    }]
  }
}

const main = () => {
  (window as any).log = log
  log.setLevel('info')
  new Phaser.Game(gameConfig)
  const versionElement = document.getElementById('version')
  versionElement.innerText = version
}

main()
