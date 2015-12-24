'use strict';

const fs     = require('fs');
const epoll  = require('epoll');
const log4js = require('log4js');
const logger = log4js.getLogger('core-plugins-hw-sysfs.Poller');

class PollerFactory {
  constructor() {
    this._pollers = new Map();
  }

  _trigger(err, fd/*, events*/) {
    if(err) { return logger.error('poller trigger error: ' + err); }
    const poller = this._pollers.get(fd);
    poller.trigger();
  }

  add(poller) {
    if(!this._native) {
      this._native = new epoll.Epoll(this._trigger.bind(this));
    }

    this._native.add(poller.fd, epoll.Epoll.EPOLLPRI);
    this._pollers.set(poller.fd, poller);
  }

  remove(poller) {
    this._pollers.remove(poller.fd);
    this._native.remove(poller.fd);

    if(!this._pollers.size) {
      this._native.close();
      this._native = null;
    }
  }
}

const pollerFactory = new PollerFactory();

module.exports = class Poller {
  constructor(fileName, bufferLen, callback) {
    this.fd = fs.openSync(fileName, 'r');
    this.buffer = new Buffer(bufferLen || 1);
    this.cb = callback;
    pollerFactory.add(this);

    // initial value
    this.trigger();
  }

  close() {
    pollerFactory.remove(this);
    this.closeSync(this.fd);
  }

  trigger() {
    fs.readSync(this.fd, this.buffer, 0, this.buffer.length, 0);
    this.callback(undefined, this.buffer.toString());
  }
};
