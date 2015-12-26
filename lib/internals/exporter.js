'use strict';

const fs            = require('fs');
const path          = require('path');
const child_process = require('child_process');

module.exports = class Exporter {
  constructor(sysfsClass, admin) {
    this._path  = path.join('/sys/class', sysfsClass);
    this._admin = admin || sysfsClass + '-admin';
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

  _execute_export(type, nb) {
    child_process.execSync(this._admin + ' ' + type + ' ' + nb.toString());
   }

  export(nb) {
    this._execute_export('export', nb);
  }

  unexport(nb) {
    this._execute_export('unexport', nb);
  }
};
