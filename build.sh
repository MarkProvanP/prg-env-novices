#!/bin/bash
tsc src/*.ts --outDir gen
browserify gen/script.js -o shwww/bundle.js --standalone sh
