# node-securitas-direct

[![](https://badges.greenkeeper.io/ptz0n/node-securitas-direct.svg)](https://greenkeeper.io/)

[![](https://travis-ci.org/ptz0n/node-securitas-direct.svg?branch=master)](https://travis-ci.org/ptz0n/node-securitas-direct)

A module for reading and changing status of Securitas Direct devices.

### Legal Disclaimer

This software is not affiliated with Securitas Direct and the developers take no legal responsibility for the functionality or security of your alarms and devices.

### Installation

```bash
$ npm install securitas-direct --save
```

### Usage

```javascript
const SecuritasDirect = require('securitas-direct');

const client = new SecuritasDirect('username', 'password', 'es');

client.login()
  .then(() => client.getInstallation('1234567'))
  .then(installation => {
    console.log('INSTALLATION:', installation);
  })
  .catch(error => {
    console.error('ERROR:', error);
  });
```
