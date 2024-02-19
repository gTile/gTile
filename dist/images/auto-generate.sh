#!/bin/bash
mkdir -p "$PWD"/icons/light/16
mkdir -p "$PWD"/icons/light/32
mkdir -p "$PWD"/icons/light/48

for file in $PWD/icons/light/source/*.svg
    do
        filename=$(basename "$file" .svg)
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=16 --export-filename="$PWD"/icons/light/16/"${filename}.png"
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=32 --export-filename="$PWD"/icons/light/32/"${filename}.png"
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=48 --export-filename="$PWD"/icons/light/48/"${filename}.png"
    done

mkdir -p "$PWD"/icons/dark/16
mkdir -p "$PWD"/icons/dark/32
mkdir -p "$PWD"/icons/dark/48

for file in $PWD/icons/dark/source/*.svg
    do
        filename=$(basename "$file" .svg)
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=16 --export-filename="$PWD"/icons/dark/16/"${filename}.png"
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=32 --export-filename="$PWD"/icons/dark/32/"${filename}.png"
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=48 --export-filename="$PWD"/icons/dark/48/"${filename}.png"
    done

mkdir -p "$PWD"/launcher/dark/16
for file in $PWD/launcher/dark/source/*.svg
    do
        filename=$(basename "$file" .svg)
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=16 --export-filename="$PWD"/launcher/dark/16/"${filename}.png"
    done

mkdir -p "$PWD"/launcher/light/16
for file in $PWD/launcher/light/source/*.svg
    do
        filename=$(basename "$file" .svg)
        inkscape "$file" --export-type=png --export-background-opacity=0 --export-width=16 --export-filename="$PWD"/launcher/light/16/"${filename}.png"
    done
