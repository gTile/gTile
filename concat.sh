#!/bin/sh

out=$1
shift
cat "$@" > $out
