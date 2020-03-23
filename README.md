# JSON to DART

[![GitHub stars](https://img.shields.io/github/stars/hiranthar/Json-to-Dart-Model)](https://github.com/hiranthar/Json-to-Dart-Model/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/hiranthar/Json-to-Dart-Model?style=plastic)](https://github.com/hiranthar/Json-to-Dart-Model/network)
[![GitHub issues](https://img.shields.io/github/issues/hiranthar/Json-to-Dart-Model?style=plastic)](https://github.com/hiranthar/Json-to-Dart-Model/issues)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)](https://www.hirantha.xyz)

### Convert JSON object to Dart Model classes

## Features

#### Convert from clipboard
- convert json you copied in to dart model classes.

#### Convert from selection
- convert json you selected in to dart model classes.

### How to use
1. Select a valid json.Press `Ctrl + P` and search for `Convert from Selection`. Provide a Base class name and location to save.

2. Copy a valid json.Press `Ctrl + P` and search for `Convert from Clipboard`. Provide a Base class name and location to save.

3. Useing short cuts 

## Key bindings

Convert from clipboard (`Shift + Ctrl + Alt + V`)

Convert from selection (`Shift + Ctrl + Alt + S`)

## Converter

- Array type merging (**Huge deal**)
- Duplicate type prevention
- Union types
- Optional types
- Array types

## Known Issues

`Command failed: xclip -selection clipboard -o`

---

Solution: 

```console
    sudo apt-get install xclip
```

Happens when linux is missing clipboard packages

## Links

- [Repo](https://github.com/hiranthar/Json-to-Dart-Model.git)
- [Issues](https://github.com/hiranthar/Json-to-Dart-Model.git/issues)
- [Change log](https://github.com/hiranthar/Json-to-Dart-Model.git/blob/master/CHANGELOG.md)
