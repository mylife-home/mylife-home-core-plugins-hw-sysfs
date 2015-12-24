'use strict';

const fs    = require('fs');
const path  = require('path');


module.exports = class Exporter {
  constructor(sysfsClass) {
    this._path     = path.join('/sys/class', sysfsClass);
    this._export   = path.join(this._path, 'export');
    this._unexport = path.join(this._path, 'unexport');
  }

  exists() {
    try {
      fs.statSync(this._path);
      return true;
    }
    catch (e) {
      return false;
    }
  }

  attribute(objPrefix, nb, attributeName) {
    return path.join(this._path, objPrefix + nb, attributeName);
  }

  export(nb) {
    fs.appendFileSync(this._export, nb.toString());
  }

  unexport(nb) {
    console.log(this._unexport, nb.toString());
    fs.appendFileSync(this._unexport, nb.toString());
  }
};
