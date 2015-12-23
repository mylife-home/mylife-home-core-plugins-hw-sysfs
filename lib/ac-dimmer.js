'use strict';

const fs        = require('fs');
//const log4js    = require('log4js');
//const logger    = log4js.getLogger('core-plugins-hw-sysfs.AcDimmer');
const internals = require('./internals');
const exporter  = new internals.Exporter('ac_dimmer');

module.exports = class AcDimmer {
  constructor(config) {

    this._gpio = config.gpio;
    this._activated = exporter.exists();

    this.online = this._activated ? 'on' : 'off';
    this.value = 0;

    if(this._activated) {
      exporter.export(this._gpio);
      this._fileName = exporter.attribute('dimmer', this._gpio, 'value');
      this.setValue(0);
    }
  }

  setValue(arg) {
    if(!this._activated) { return; }
    fs.appendFileSync(this._fileName, arg.toString());
    this.value = arg;
  }

  close(done) {
    if(this._activated) {
      exporter.unexport(this._gpio);
    }
    setImmediate(done);
  }

  static metadata(builder) {
    const binary = builder.enum('off', 'on');
    const range0_100 = builder.range(0, 100);

    builder.usage.driver();

    builder.attribute('online', binary);
    builder.attribute('value', range0_100);

    builder.action('setValue', range0_100);

    builder.config('gpio', 'integer');
  }
};
