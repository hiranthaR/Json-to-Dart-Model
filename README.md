# JSON to DART

[![version ](https://vsmarketplacebadge.apphb.com/version/hirantha.json-to-dart.svg)](https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart)
[![install ](https://vsmarketplacebadge.apphb.com/installs/hirantha.json-to-dart.svg)](https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart)
[![donwlaod ](https://vsmarketplacebadge.apphb.com/downloads/hirantha.json-to-dart.svg)](https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)](https://www.hirantha.xyz)


### Given a JSON string, this library will generate all the necessary Dart classes to parse and generate JSON.
This library is designed to generate `Flutter` friendly model classes following the [flutter's doc recommendation](https://flutter.io/json/#serializing-json-manually-using-dartconvert).

- When an empty array is given, it will create a `List<Null>`. Such weird behaviour should warn the user that there is no data to extract.
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

#### Convert from clipboard
- convert json you copied in to dart model classes.

#### Convert from selection
- convert json you selected in to dart model classes.

#### Add code generation Libaries to `pubspec.yaml` file.
- add serializing JSON using code generation libraries to `pubspec.yaml`
  
  dependencies
    ```yaml
    dependencies:
        # Your other regular dependencies here
        json_annotation: <latest_version>

    dev_dependencies:
        # Your other dev_dependencies here
        build_runner: <latest_version>
        json_serializable: <latest_version>
    ```

### How to use
1. Select a valid json.Press `Ctrl + P` and search for `Convert from Selection`. Provide a Base class name and location to save.

2. Copy a valid json.Press `Ctrl + P` and search for `Convert from Clipboard`. Provide a Base class name and location to save.


3. Press `Ctrl + P` and search for `Add Code Generation Libraries to pubspec.yaml` and hit enter.

4. Useing short cuts 

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

- [Repository](https://github.com/hiranthar/Json-to-Dart-Model.git)
- [Issues](https://github.com/hiranthar/Json-to-Dart-Model.git/issues)
- [Change log](https://github.com/hiranthar/Json-to-Dart-Model.git/blob/master/CHANGELOG.md)


### Contact me

feel free to contact me anytime :blush:

- [https://www.hirantha.xyz](https://www.hirantha.xyz)
- [github](https://github.com/hiranthar)
- [facebook](https://www.facebook.com/sahanhirantha)
