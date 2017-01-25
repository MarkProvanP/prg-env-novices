#!/bin/bash

LANG_FILE="lang"
SRC_FOLDER="src"
TEMP_FOLDER="tmp"
GRAMMAR_FILE="src/grammar/pegjs.txt"
GENERATED_GRAMMAR_FILE="src/grammar/generated.peg"
mkdir -p $TEMP_FOLDER
tsc "${SRC_FOLDER}/${LANG_FILE}.ts" --outDir $TEMP_FOLDER
echo "{" > $GENERATED_GRAMMAR_FILE
cat "${TEMP_FOLDER}/${LANG_FILE}.js" >> $GENERATED_GRAMMAR_FILE
echo "}" >> $GENERATED_GRAMMAR_FILE
cat $GRAMMAR_FILE >> $GENERATED_GRAMMAR_FILE
rm -r $TEMP_FOLDER
