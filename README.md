# JSON to DART

[![version](https://vsmarketplacebadge.apphb.com/version/hirantha.json-to-dart.svg)](https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart)
[![install](https://vsmarketplacebadge.apphb.com/installs/hirantha.json-to-dart.svg)](https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart)
[![download](https://vsmarketplacebadge.apphb.com/downloads/hirantha.json-to-dart.svg)](https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)](https://www.hirantha.xyz)

### Given a JSON string, this library will generate all the necessary Dart classes to parse and generate JSON

This library is designed to generate `Flutter` friendly model classes following the [flutter's doc recommendation](https://flutter.io/json/#serializing-json-manually-using-dartconvert) and [Effective Dart: Style](https://dart.dev/guides/language/effective-dart/style).Extention supports for both **Serializing JSON manually** and **Serializing JSON using code generation libraries**

- Equal structures are not detected yet (Equal classes are going to be created over and over).
- Properties named with funky names (like "!breaks", "|breaks", etc) or keyword (like "`this`", "`break`", "`class`", etc) will produce syntax errors.
- Array of arrays are not supported:

```json
[[{ "isThisSupported": false }]]
```

```json
[{ "thisSupported": [{ "cool": true }] }]
```

## Features

#### Convert from clipboard to manual model classes

- Convert json you copied in to dart model classes.

#### Convert from selection to manual model classes

- Convert json you selected in to dart model classes.

#### Convert from clipboard to code generation libraries supported model classes

- Convert json you copied in to code generarion libraries supported model classes. A terminal session run after convertion to generate rest parts.

#### Convert from selection to code generation libraries supported model classes

- Convert json you selected in to code generarion libraries supported model classes. A terminal session run after convertion to generate rest parts.

#### Add code generation Libaries to `pubspec.yaml` file

- Add serializing JSON using code generation libraries to `pubspec.yaml`.

  structure of the `pubspec.yaml`

  ```yaml
  dependencies:
    # Your other regular dependencies here
    json_annotation: <latest_version>

  dev_dependencies:
    # Your other dev_dependencies here
    build_runner: <latest_version>
    json_serializable: <latest_version>
  ```

#### Add advanced equality comparability with `Equatable`

- Add the ability to compare your generated models in a better way with `Equatable`. You can check if 2 classes, that are diferent instances, are equals **_without a single line of extra code_**.

### Serializing JSON using code generation libraries

If you'd like to use Code Generation Libraries from **Flutter**, first of all I suggest you to add dependencies to the `pubspec.yaml` file. It also can be done with this extension. You don't need to worry about it :wink:.
After that you can convert your `JSON` to model classes.
Then you need to run the `flutter pub run build_runner build` command to generate the missing code of the models, according to Flutter documentation.
Fortunately the extension automatically opens a new terminal session and runs that command for you, yey :smile:.

- Read more about [flutter's doc recommendation](https://flutter.io/json/#serializing-json-manually-using-dartconvert) about **JSON and serialization**

### How to use

1. Select a valid json. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Convert from Selection` or `Convert from Selection to Code Generation supported classes`. Provide a Base class name and location to save.

2. Copy a valid json. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Convert from Clipboard` or `Convert from Clipboard to Code Generation supported classes`. Provide a Base class name and location to save.

3. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Add Code Generation Libraries to pubspec.yaml` and hit enter.

4. Using short cuts.

#### Code equality

You just have to select `Yes` when the process of parsing your JSON to Code has started and the extension will take care of setting up the advanced code equality check in your Dart models

![Equality check menu](<./readme_assets/Captura%20de%20Pantalla%202020-08-12%20a%20la(s)%206.01.10%20p.m..png> "Equality check menu")

## Key bindings

Convert from Clipboard (`Shift + Ctrl + Alt + V`)

Convert from Selection (`Shift + Ctrl + Alt + S`)

Convert from Clipboard to Code Generation supported classes (`Shift + Ctrl + Alt + G`)

Convert from Selection to Code Generation supported classes (`Shift + Ctrl + Alt + H`)

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

```bash
    sudo apt-get install xclip
```

Happens when linux is missing clipboard packages

### Links

- [Repository](https://github.com/hiranthar/Json-to-Dart-Model.git)
- [Issues](https://github.com/hiranthar/Json-to-Dart-Model.git/issues)
- [Changelog](https://github.com/hiranthar/Json-to-Dart-Model.git/blob/master/CHANGELOG.md)

### Special thanks

:heart: Special thanks to [Israel Ibarra](https://github.com/ElZombieIsra) for adding equatable support.</br>
:heart: Special thanks to [Arnas](https://github.com/iamarnas) for suggesting to add [Effective Dart: Styles](https://dart.dev/guides/language/effective-dart/style)

### Contact me

Feel free to contact me anytime :blush:

- [https://hirantha.xyz](https://hirantha.xyz)
- [github:нιяαитнα](https://github.com/hiranthar)
- [mail@hirantha.xyz](mailto:mail@hirantha.xyz)