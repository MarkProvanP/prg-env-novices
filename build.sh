#!/bin/bash
tsc src/*.ts --outDir gen
browserify gen/script.js -o shwww/bundle.js
cp src/index.html shwww/index.html
node_modules/node-sass/bin/node-sass src/styles.scss > shwww/styles.css
