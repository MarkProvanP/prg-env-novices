#!/bin/bash
tsc src/*.ts --outDir gen
browserify gen/script.js -o out/bundle.js --standalone sh
