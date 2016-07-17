'use strict';

const fs        = require('fs');
const log4js    = require('log4js');
const logger    = log4js.getLogger('core-plugins-hw-sysfs.GpioIn');
const internals = require('./internals');
const exporter  = new internals.Exporter('gpio');

module.exports = class GpioIn {
  constructor(config) {

    const pull = config.pull;
    this._gpio = parseInt(config.gpio);
    this._reverse = config.activelow === 'true';
    this._activated = exporter.exists();

    this.value = 'off';

    if(this._activated) {
      try {
        exporter.export(this._gpio, this._readPull(pull));
        try {
          fs.appendFileSync(exporter.attribute('gpio', this._gpio, 'direction'), 'in');
          fs.appendFileSync(exporter.attribute('gpio', this._gpio, 'edge'), 'both');
          const fileName = exporter.attribute('gpio', this._gpio, 'value');
          this._poller = new internals.Poller(fileName, 1, this._trigger.bind(this));
        } catch(e) {
          exporter.unexport(this._gpio);
          throw e;
        }
      } catch(err) {
        this._activated = false;
        logger.error(`error creating gpio_in (gpio=${this._gpio} : ${err}`);
      }
    }

    this.online = this._activated ? 'on' : 'off';
  }

  _readPull(config) {
    switch(config) {
      case 'up': return ['pullup'];
      case 'down': return ['pulldown'];
    }
    return null;
  }

  _trigger(err, data) {
    if(err) { return logger.error(`trigger error (gpio=${this._gpio} : ${err}`); }
    let val = data === '1';
    if(this._reverse) { val = !val; }
    this.value = val ? 'on' : 'off';
  }

  close(done) {
    if(this._activated) {
      this._poller.close();
      this._poller = null;
      exporter.unexport(this._gpio);
    }
    setImmediate(done);
  }

  static metadata(builder) {
    const binary = builder.enum('off', 'on');

    builder.usage.driver();

    builder.attribute('online', binary);
    builder.attribute('value', binary);

    builder.config('gpio', 'integer');
    builder.config('activelow', 'boolean');
    builder.config('pull', 'string');
  }
};
