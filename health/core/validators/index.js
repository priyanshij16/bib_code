'use strict';

const appRoot = require('app-root-path')
const walkSync = require('walk-sync')
const req = require

const validators = {}

const paths = walkSync(`${appRoot.path}/src/core/validators`, {
    globs: ['**/*.ts'],
    ignore: ['index.js', 'Validator.ts']
})

paths.forEach(path => {
    let validatorName = path.split('/').pop().replace('.js', '')
    validators[validatorName] = req(`${appRoot.path}/src/core/validators/${path.replace('.ts', '')}`);
})

module.exports = validators;