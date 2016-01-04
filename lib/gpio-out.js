'use strict';

const fs        = require('fs');
const log4js    = require('log4js');
const logger    = log4js.getLogger('core-plugins-hw-sysfs.GpioOut');
const internals = require('./internals');
const exporter  = new internals.Exporter('gpio');

module.exports = class GpioOut {
  constructor(config) {

    this._gpio = parseInt(config.gpio);
    this._activated = exporter.exists();

    this.value = 0;

    if(this._activated) {
      try {
        exporter.export(this._gpio);
        try {
          fs.appendFileSync(exporter.attribute('gpio', this._gpio, 'direction'), 'out');
          this._fileName = exporter.attribute('gpio', this._gpio, 'value');
          this.setValue('off');
        } catch(e) {
          exporter.unexport(this._gpio);
          throw e;
        }
      } catch(err) {
        this._activated = false;
        logger.error(`error creating gpio_out (gpio=${this._gpio} : ${err}`);
      }
    }

    this.online = this._activated ? 'on' : 'off';
  }

  setValue(arg, exiting) {
    if(!exiting) { this.value = arg; }
    if(!this._activated) { return; }
    fs.appendFileSync(this._fileName, arg === 'on' ? '1' : '0');
  }

  close(done) {
    if(this._activated) {
      this.setValue('off', true);
      exporter.unexport(this._gpio);
    }
    setImmediate(done);
  }

  static metadata(builder) {
    const binary  = builder.enum('off', 'on');

    builder.usage.driver();

    builder.attribute('online', binary);
    builder.attribute('value', binary);

    builder.action('setValue', binary);

    builder.config('gpio', 'integer');
  }
};
