'use strict';

const fs        = require('fs');
const log4js    = require('log4js');
const logger    = log4js.getLogger('core-plugins-hw-sysfs.PwmRgb');
const internals = require('./internals');
const exporter  = new internals.Exporter('pwm');

class Controller {
  constructor(gpio) {
    this._gpio = gpio;
    this._activated = exporter.exists();

    if(!this._activated) {
      return;
    }

    try {
      exporter.export(this._gpio);
      try {
        this._fileName = exporter.attribute('pwm', this._gpio, 'value');
        this.setValue(0);
      } catch(e) {
        exporter.unexport(this._gpio);
        throw e;
      }
    } catch(err) {
      this._activated = false;
      logger.error(`error creating pwm (gpio=${this._gpio} : ${err}`);
    }
  }

  get online() {
    return this._activated;
  }

  close() {
    if(!this._activated) {
      return;
    }
    this.setValue(0);
    exporter.unexport(this._gpio);
  }

  setValue(value) {
    if(!this._activated) { return; }
    fs.appendFileSync(this._fileName, arg.toString());
  }
};

module.exports = class Pwm {
  constructor(config) {

    this._r = new Controller(config.redGpio);
    this._g = new Controller(config.greenGpio);
    this._b = new Controller(config.blueGpio);

    this.online = (this._r.online && this._g.online && this._b.online) ? 'on' : 'off';
    this.active = 'off';
    this.color  = 0;
  }

  _refresh() {
    if(this.active === 'off') {
      logger.info('pwm-rgb: OFF');
      this._r.setValue(0);
      this._g.setValue(0);
      this._b.setValue(0);
      return;
    }

    const r = Math.round(((this.color >> 16) & 255) * 100 / 255);
    const g = Math.round(((this.color >> 8) & 255) * 100 / 255);
    const b = Math.round((this.color & 255) * 100 / 255);

    logger.info(`pwm-rgb: R=${r}, G=${g}, B=${b}`);

    this._r.setValue(r);
    this._g.setValue(g);
    this._b.setValue(b);
  }

  setValue(arg, exiting) {
    if(!exiting) { this.value = arg; }
    this.value = arg;
    if(!this._activated) { return; }
    fs.appendFileSync(this._fileName, arg.toString());
  }

  setActive(arg) {
    this.active = arg;
    this._refresh();
  }

  setColor(arg) {
    this.color = arg;
    this._refresh();
  }

  close(done) {
    this._r.close(cb);
    this._g.close(cb);
    this._b.close(cb);
    setImmediate(done);
  }

  static metadata(builder) {
    const binary = builder.enum('off', 'on');
    const color  = builder.range(0, 16777215);

    builder.usage.driver();

    builder.attribute('online', binary);
    builder.attribute('active', binary);
    builder.attribute('color', color);

    builder.action('setActive', binary);
    builder.action('setColor', color);

    builder.config('redGpio', 'integer');
    builder.config('greenGpio', 'integer');
    builder.config('blueGpio', 'integer');
  }
};
