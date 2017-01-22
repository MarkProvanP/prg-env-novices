#!/bin/bash

TEST_FILE="test-peg"
LANG_FILE="new-lang"
GRAMMAR_FILE="pegjs-grammar-bottom.txt"
GENERATED_GRAMMAR_FILE="generated-grammar.txt"
tsc "${LANG_FILE}.ts" $TEST_FILE
echo "{" > $GENERATED_GRAMMAR_FILE
cat "${LANG_FILE}.js" >> $GENERATED_GRAMMAR_FILE
echo "}" >> $GENERATED_GRAMMAR_FILE
cat $GRAMMAR_FILE >> $GENERATED_GRAMMAR_FILE
