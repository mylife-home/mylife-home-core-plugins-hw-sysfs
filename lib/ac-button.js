'use strict';

const log4js    = require('log4js');
const logger    = log4js.getLogger('core-plugins-hw-sysfs.AcButton');
const internals = require('./internals');
const exporter  = new internals.Exporter('ac_button');

module.exports = class AcButton {
  constructor(config) {

    this._gpio = config.gpio;
    this._activated = exporter.exists();

    this.online = this._activated ? 'on' : 'off';
    this.value = 'off';

    if(this._activated) {
      exporter.export(this._gpio);
      try {
        const fileName = exporter.attribute('button', this._gpio, 'value');
        this._poller = new internals.Poller(fileName, 1, this._trigger.bind(this));
      } catch(err) {
        exporter.unexport(this._gpio);
        throw err;
      }
    }
  }

  _trigger(err, data) {
    if(err) { return logger.error(`trigger error (gpio=${this._gpio} : ${err}`); }
    this.value = data === '1' ? 'on' : 'off';
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
  }
};
