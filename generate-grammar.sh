#!/bin/bash

LANG_FILE="src/lang"
GRAMMAR_FILE="src/grammar/pegjs.txt"
GENERATED_GRAMMAR_FILE="src/grammar/generated.peg"
tsc "${LANG_FILE}.ts"
echo "{" > $GENERATED_GRAMMAR_FILE
cat "${LANG_FILE}.js" >> $GENERATED_GRAMMAR_FILE
echo "}" >> $GENERATED_GRAMMAR_FILE
cat $GRAMMAR_FILE >> $GENERATED_GRAMMAR_FILE
rm "${LANG_FILE}.js"
