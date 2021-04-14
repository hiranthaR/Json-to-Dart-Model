<p align="center">
<img src="readme_assets/banner.png" style="background-color: transparent;" height=100 alt="JSON to Dart Model"/>
</p>

<p align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart"><img src="https://vsmarketplacebadge.apphb.com/version/hirantha.json-to-dart.svg?labelColor=009903&style=flat-square" alt="Version"></a>
<a href="https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart"><img src="https://vsmarketplacebadge.apphb.com/installs/hirantha.json-to-dart.svg?label=Installs&labelColor=009903&style=flat-square" alt="Install"></a>
<a href="https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart"><img src="https://vsmarketplacebadge.apphb.com/downloads/hirantha.json-to-dart.svg?label=Downloads&labelColor=009903&style=flat-square" alt="Download"></a>
<a href="https://www.hirantha.xyz"><img src="https://img.shields.io/badge/Ask%20Me-Anything-1abc9c.svg?labelColor=007d80&style=flat-square" alt="Ask Me Anything"></a>
<a href="https://github.com/hiranthaR/Json-to-Dart-Model/issues"><img src="https://img.shields.io/github/issues/hiranthaR/Json-to-Dart-Model?label=Issues&labelColor=c95149&logo=github&color=ff5b4f&style=flat-square" alt="Issues"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-orange.svg?labelColor=d67c15&style=flat-square" alt="License: MIT"></a>
<a href="https://dart.dev/guides/language/effective-dart/style"><img src="https://img.shields.io/badge/Style-Effective%20Dart-blue?labelColor=005f96&style=flat-square" alt="Effective Dart Style"></a>
<a href="https://github.com/rrousselGit/freezed"><img src="https://img.shields.io/badge/Supports-Freezed-blue?labelColor=005f96&style=flat-square" alt="Freezed"></a>
<a href="https://github.com/google/json_serializable.dart/tree/master/json_serializable"><img src="https://img.shields.io/badge/Supports-Json_Serializable-blue?labelColor=005f96&style=flat-square" alt="Json Serializable"></a> 
<a href="https://dart.dev/null-safety"><img src="https://img.shields.io/badge/Dart-Null_Safety-blue?labelColor=005f96&style=flat-square&logo=Dart" alt="Null Safety"></a>
</p>

> From JSON to Dart advanced

<!-- TABLE OF CONTENTS -->
<details closed="closed">
  <summary>Table of Contents</summary>
  <ol>
    <li> <a href="#features">Features</a>
      <ul>
        <li><a href="#convert-from-clipboard-o-manual-model-classes">Convert from clipboard</a></li>
        <li><a href="#convert-from-selection-to-manual-model-classes">Convert from selection</a></li>
        <li><a href="#convert-from-clipboard-to-code-generation-libraries-supported-model-classes">Convert from clipboard to code generation</a></li>
        <li><a href="#convert-from-selection-to-code-generation-libraries-supported-model-classes">Convert from selection to code generation</a></li>
        <li><a href="#convert-from-file">Convert from file</a></li>
      </ul>
    <li>
      <a href="#the-syntax">The Syntax</a>
      <ul>
        <li><a href="#to-string-method">toString method</a></li>
        <li><a href="#copyWith-method">copyWith method</a></li>
        <li><a href="#equality-operator">Equality Operator</a></li>
        <li><a href="#equatable">Equatable</a></li>
        <li><a href="#null-safety">Null safety</a></li>
      </ul>
    </li>
    <li><a href="#supported-generators">Supported Generators</a></li>
    <ul>
        <li><a href="#freezed">Freezed</a></li>
        <li><a href="#JSON-Serializable">JSON Serializable</a></li>
    </ul>
    <li><a href="#how-to-use">How to use</a></li>
    <ul>
        <li><a href="#customise">Customise</a></li>
        <li><a href="#key-bindings">Key bindings</a></li>
        <li><a href="https://pub.dev/packages/freezed">Freezed documentation</a></li>
        <li><a href="#converter">Converter</a></li>
        <li><a href="#known-issues">Known Issues</a></li>
        <li><a href="#links">Links</a></li>
    </ul>
  </ol>
</details>

<space><space>

Given a JSON string, this library will generate all the necessary Dart classes to parse and generate JSON. Also designed to generate `Flutter` friendly model classes following the [flutter's doc recommendation](https://flutter.io/json/#serializing-json-manually-using-dartconvert) and [Effective Dart: Style](https://dart.dev/guides/language/effective-dart/style). Extention supports for both **Serializing JSON manually** and **Serializing JSON** using code generation libraries like **Freezed** and **Json Serializable**. If you are an api service provider, you can build a `models.jsonc` file for your users to convert json to `Dart` language with a few clicks.

## How it works

`Dart to Json Model Generator` creates your `JSON` object into separate files and thanks to this if similar structures are detected `generator` will create them into different files and merge them with path (`import`) no matter how named your objects are. In this way you can keep your code cleaner and more readable. The path name in the first will be renamed with the class name added as a prefix to show from which class the objects are. If the names continue to be duplicated then will be marked with index for infinity renaming.

- Avoid using file base class name as json keys to avoid conflicts and unwanted change of structure names. **Note:** converting from file `Json to Dart Model` will help to avoid it.
- Properties named with funky names (like "!breaks", "|breaks", etc) will produce syntax errors.


## Customise

To customise your classes is very easy. If you want fast create a simple class then just click enter to continue skip all methods. Otherwise build your own. For generate Freezed class and Json Serializable choose Code Generation.

<p align="center">
<img src="readme_assets/usage.gif" alt="How To Customise"/>
</p>


## Features

#### Convert from clipboard to manual model classes

- Convert json you copied in to dart model classes.

#### Convert from selection to manual model classes

- Convert json you selected in to dart model classes.

#### Convert from clipboard to code generation libraries supported model classes

- Convert json you copied in to code generarion libraries supported model classes. A terminal session run after convertion to generate rest parts.

#### Convert from selection to code generation libraries supported model classes

- Convert json you selected in to code generarion libraries supported model classes. A terminal session run after convertion to generate rest parts.

#### Convert from file

- Convert your all json objects from the file.

`Json to Dart Model` generator keep all your json objects in the file with name `models.jsonc` and allows you to configure your classes according to you preferences. `models.jsonc` content is a list that contains all of your json objects that will later be converted to `Dart` classes. You can share this file with your friends and help them create better code. The `jsonc` format allows you to comment on your json objects to easily find them later or make it easier to explain to your team. To create the `models.jsonc` file you can run command in the command palette `Build Models` or use keys bingning `Shift + Ctrl + Alt + B` and you will be asked if you want create file, hit `Enter` to add file. After adding file open it to read detailed instructions on how it works.

Create file manually. Add new file to your app directory `my_app/models.jsonc` and add configuration object. 

```jsonc
[
  {
    // Generates Freezed classes.
    // If it's true, everything below will be ignored because Freezed supports them all.
    "freezed": false,
    // Enable Json Serializable builder.
    "serializable": false,
    // Enable Equatable support.
    // If it's true, equality operator and immutability will be ignored.
    "equatable": false,
    // Generate immutable classes.
    "immutable": false,
    // Add toString method to improve the debugging experience.
    "toString": false,
    // Add copyWith method (Recommended with immutable classes).
    "copyWith": false,
    // Add equality operator.
    "equality": false,
    // Indicate that a variable can have the value null.
    "nullSafety": false,
    // Default target directory.
    "targetDirectory": "/lib/models",
    // Disable ask for confirmation to start the conversion.
    "fastMode": false
  }
]
```
Put your all json objects to this list below configuration object separated by commas. Configuration object must be first in the list. ***Note that you add base class names to each object with key*** `"__className": "MyClass",` class name will be removed from the object and used as the root class name for your code syntax. Duplicate class names are not allowed to avoid overwriting the files. Your JSON object should look like this:

```jsonc
{
  "__className": "UserPost", // <- The base class name of the object.
  "userId": 1,
  "id": 1,
  "title": "Json To Dart Model",
  "body": "Json to Dart advanced..."
},
```
After adding the object and convert to `Dart` classes just run command from the [command palette](#how-to-use) or simpler use key binding `Shift + Ctrl + Alt + B`. If you want to update some class just delete class folder from the directory and run again `Build Models` and `Json to Dart Model` will generate the missing directory.

Your final result should look like this:

```json
[
  {
    "freezed": false,
    "serializable": false,
    "equatable": false,
    "immutable": false,
    "toString": false,
    "copyWith": false,
    "equality": false,
    "nullSafety": false,
    "targetDirectory": "/lib/models",
    "fastMode": false
  },
  {
    "__className": "UserPost",
    "userId": 1,
    "id": 1,
    "title": "Json To Dart Model",
    "body": "Json to Dart advanced..."
  }
]
```
> TIP: This may look too advanced but will give you the best results with this generator. Because the Json to Dart Model has more data sources to compare it to provide more secure and cleaner code.

## JSON Serializable

Add serializing JSON using code generation libraries to `pubspec.yaml`.

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

## Freezed

Freezed supports both old versions to 0.12.7 and new from 0.14.0 and higher. Freezed requires three packages to generate json files to Freezed classes with a few clicks.
  
  structure of the `pubspec.yaml`

  ```yaml
   dependencies:
     # Your other regular dependencies here
     freezed_annotation: <latest_version>
 
   dev_dependencies:
     # Your other dev_dependencies here
     build_runner: <latest_version>
     freezed: <latest_version>
   ```
   Read more about how to install [freezed](https://pub.dev/packages/freezed#install). 

  All generated classes with Freezed will be `@immutable` and support all methods like [copyWith](#copyWith-method), [toString](#to-string-method), [equality operator](#equality-operator)`==`... See example:

```dart
// Examples are for Freezed up to version 0.12.7
@freezed
abstract class Address with _$Address {
  factory Address({
    @JsonKey(name: "street") String street,
    @JsonKey(name: "suite") String suite,
    @JsonKey(name: "city") String city,
    @JsonKey(name: "zipcode") String zipcode,
    @JsonKey(name: "geo") Geo geo,
  }) = _Address;

  factory Address.fromJson(Map<String, dynamic> json) => _$AddressFromJson(json);
}
```

Freezed generator are useful for who work daily with coding. All you have to do is upgrade some values and Freezed will takecare of the rest. Your don't need worry about that you have forget update  parser to some method. More what you can do withFreezed read [freezed documentation](https://pub.dev/packages/freezed). 

**TIP:** If you think that you have too much generated files you can look at tips by Freezed how to [ignore lint warnings on generated files](https://pub.dev/packages/freezed#ignore-lint-warnings-on-generated-files).

## Equatable

`Equatable` are immutable class with ability to compare your generated models in a better way. You can check if 2 classes, that are diferent instances, are equals **_without a single line of extra code_**. Ofcourse you can add [toString](#to-string-method) method and [copyWith](#copyWith-method) for better experience.

```dart
class Todos extends Equatable {
  final int userId;
  final int id;
  final String title;
  final bool completed;

  const Todos({
    this.userId,
    this.id,
    this.title,
    this.completed,
  });

  factory Todos.fromJson(Map<String, dynamic> json) {
    return Todos(
      userId: json['userId'] as int,
      id: json['id'] as int,
      title: json['title'] as String,
      completed: json['completed'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'id': id,
      'title': title,
      'completed': completed,
    };
  }

  // Here will be more methods after your customization.
  // toString();
  // copyWith();

  @override
  List<Object> get props => [userId, id, title, completed]; 
}
```

To add`Equatable` support you just have to select `Yes` when the process of parsing your JSON to Code has started and the extension will take care of setting up the advanced code equality check in your Dart models

![Equality check menu](<./readme_assets/Captura%20de%20Pantalla%202020-08-12%20a%20la(s)%206.01.10%20p.m..png> "Equality check menu")

## Equality Operator

If you don't want install `Equatable` package and work with `@immutable` classes and values then you can add equality operator `==` with less boilerplate syntax. And customize your class as mutable.

```dart
@override
bool operator ==(Object o) =>
    o is Todos &&
    identical(o.userId, userId) &&
    identical(o.id, id) &&
    identical(o.title, title) &&
    identical(o.completed, completed);

@override
int get hashCode => hashValues(userId, id, title, completed);
```
## To String method

You can add `toString()` method in your classes to improve the debugging experience.

```dart
@override
String toString() {
  return 'Todos(userId: $userId, id: $id, title: $title, completed: $completed)';
}
```
Equatable can implement [toString](https://github.com/felangel/equatable/blob/master/README.md#tostring-implementation) method including all the given props. If Equatable support enabled then will implement Equatable `toString` Implementation.

```dart
@override
bool get stringify => true;
```

## CopyWith method

`copyWith()` method will make your life easier with `@immutable` classes. Highly recommended with imuttable classes.

```dart
Todos copyWith({
  int userId,
  int id,
  String title,
  bool completed,
}) {
  return Todos(
    userId: userId ?? this.userId,
    id: id ?? this.id,
    title: title ?? this.title,
    completed: completed ?? this.completed,
  );
}
```

## Null Safety

If `null safety` enabled it will indicate that a variable may have the value `null`. Required in the new `Dart` language from version 2.12... 

> **Note:** Before enable null safety make sure your packages also support Dart null safety.

## Serializing JSON using code generation libraries

If you'd like to use Code Generation Libraries from **Flutter**, first of all I suggest you to add dependencies to the `pubspec.yaml` file. It also can be done with this extension. You don't need to worry about it :wink:.
After that you can convert your `JSON` to model classes.
Then you need to run the `flutter pub run build_runner build` command to generate the missing code of the models, according to Flutter documentation.
Fortunately the extension automatically opens a new terminal session and runs that command for you, yey :smile:.

- Read more about [flutter's doc recommendation](https://flutter.io/json/#serializing-json-manually-using-dartconvert) about **JSON and serialization**

## How to use

1. Select a valid json. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Convert From Selection` or `Convert From Selection To Code Generation Supported Classes`. Provide a Base class name and location to save.

2. Copy a valid json. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Convert From Clipboard` or `Convert From Clipboard To Code Generation Supported Classes`. Provide a Base class name and location to save.

3. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Add Code Generation Libraries To pubspec.yaml` and hit enter.

4. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Build Models` and hit enter.

5. Using short cuts.

## Key bindings

Convert from Clipboard (`Shift + Ctrl + Alt + V`)

Convert from Selection (`Shift + Ctrl + Alt + S`)

Convert from file (`Shift + Ctrl + Alt + B`)

Convert from Clipboard to Code Generation supported classes (`Shift + Ctrl + Alt + G`)

Convert from Selection to Code Generation supported classes (`Shift + Ctrl + Alt + H`)

## Converter

- Array type merging
- Duplicate type prevention
- Union types
- Optional types
- Array types

## Known Issues

1. Using key binding on `Linux` can throw error `Command failed: xclip -selection clipboard -o` it happens when Linux lacks clipboard package. To resolve this error run in the terminal this command to install the missing package.

   ```bash
   sudo apt-get install xclip
   ```

2. Matches the wrong type. In my experience some api deliverers write `integer` values instead of `double`, example: 1 or 1.00 instead 1.10. The problem is that this generator does deep object scan and reads each items to detect the type of value and returns type as found. But with lists works well, if the list only has double and intengers, the list type returns as num. If you write yourself json objects try to give the right value type for better results. It’s all about json quality  :sunglasses:

### Links

- [Repository](https://github.com/hiranthar/Json-to-Dart-Model.git)
- [Issues](https://github.com/hiranthaR/Json-to-Dart-Model/issues)
- [Changelog](https://github.com/hiranthaR/Json-to-Dart-Model/blob/master/CHANGELOG.md)

### Special thanks

:heart: Special thanks to [Israel Ibarra](https://github.com/ElZombieIsra) for adding [equatable](https://pub.dev/packages/equatable) support.</br>
:heart: Special thanks to [Arnas](https://github.com/iamarnas) for adding [Effective Dart: Styles](https://dart.dev/guides/language/effective-dart/style).</br>
:heart: Special thanks to [Ayush P Gupta](https://github.com/apgapg) for fixing bugs.

### Support us

If you like this, please give us the :star: and share with your friends. Thank you :blue_heart:

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

### Contact me

Feel free to contact me anytime :blush:

- [https://hirantha.xyz](https://hirantha.xyz)
- [github:нιяαитнα](https://github.com/hiranthar)
- [mail@hirantha.xyz](mailto:mail@hirantha.xyz)

