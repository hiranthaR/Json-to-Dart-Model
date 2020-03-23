# JSON to DART

### Convert JSON object to Dart Model classes

## Features

#### Convert from clipboard
- convert json you copied in to dart model classes.

#### Convert from selection
- convert json you selected in to dart model classes.

### How to use
1. Select a valid json.Press `Shift + Ctrl + P` and search for `Convert from Selection`. Provide a Base class name and location to save.

2. Copy a valid json.Press `Shift + Ctrl + P` and search for `Convert from Clipboard`. Provide a Base class name and location to save.

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
