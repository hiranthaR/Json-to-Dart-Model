<p align="center">
<img src="readme_assets/banner.png" style="background-color: transparent;" alt="JSON to Dart Model"/>
</p>

<p align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart"><img src="https://vsmarketplacebadge.apphb.com/version/hirantha.json-to-dart.svg" alt="Version"></a>
<a href="https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart"><img src="https://vsmarketplacebadge.apphb.com/installs/hirantha.json-to-dart.svg" alt="Install"></a>
<a href="https://marketplace.visualstudio.com/items?itemName=hirantha.json-to-dart"><img src="https://vsmarketplacebadge.apphb.com/downloads/hirantha.json-to-dart.svg" alt="Download"></a>
<a href="https://www.hirantha.xyz"><img src="https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg" alt="Ask Me Anything"></a>
<a href="https://github.com/hiranthaR/Json-to-Dart-Model/issues"><img src="https://img.shields.io/github/issues/hiranthaR/Json-to-Dart-Model?logo=github" alt="Issues"></a>
<a href="https://dart.dev/guides/language/effective-dart/style"><img src="https://img.shields.io/badge/style-Effective%20Dart-blue" alt="Effective Dart Style"></a>
</p>

> From JSON to Dart advanced

- **[Features](#features)**
- **The syntax**
  - [To String method](#to-string-method)
  - [CopyWith method](#copyWith-method)
  - [Equality Operator](#equality-operator)
  - [Equatable](#equatable)
- **Code generators**
  - [Freezed](#freezed)
  - [JSON Serializable](#JSON-Serializable)
- **[How to use](#how-to-use)** 
  - [Customise](#customise)
  - [Key bindings](#key-bindings)
  - [Freezed documentation](https://pub.dev/packages/freezed)
  - [Converter](#converter)
  - [Links](#links)

## Given a JSON string, this library will generate all the necessary Dart classes to parse and generate JSON

This library is designed to generate `Flutter` friendly model classes following the [flutter's doc recommendation](https://flutter.io/json/#serializing-json-manually-using-dartconvert) and [Effective Dart: Style](https://dart.dev/guides/language/effective-dart/style). Extention supports for both **Serializing JSON manually** and **Serializing JSON using code generation libraries**

- Equal structures are not detected yet (Equal classes are going to be created over and over).
- Properties named with funky names (like "!breaks", "|breaks", etc) or keyword (like "`this`", "`break`", "`class`", etc) will produce syntax errors.


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

Freezed requires three packages to generate json files to Freezed classes with a few clicks.
  
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
@freezed
abstract class Todos with _$Todos {
	const factory Todos({
	  int userId,
	  int id,
	  String title,
	  bool completed,
	}) = _Todos;

	factory Todos.fromJson(Map<String, dynamic> json) => _$TodosFromJson(json);
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

## Serializing JSON using code generation libraries

If you'd like to use Code Generation Libraries from **Flutter**, first of all I suggest you to add dependencies to the `pubspec.yaml` file. It also can be done with this extension. You don't need to worry about it :wink:.
After that you can convert your `JSON` to model classes.
Then you need to run the `flutter pub run build_runner build` command to generate the missing code of the models, according to Flutter documentation.
Fortunately the extension automatically opens a new terminal session and runs that command for you, yey :smile:.

- Read more about [flutter's doc recommendation](https://flutter.io/json/#serializing-json-manually-using-dartconvert) about **JSON and serialization**

## How to use

1. Select a valid json. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Convert from Selection` or `Convert from Selection to Code Generation supported classes`. Provide a Base class name and location to save.

2. Copy a valid json. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Convert from Clipboard` or `Convert from Clipboard to Code Generation supported classes`. Provide a Base class name and location to save.

3. Press `Ctrl + shift + P` (linux and mac) or `Ctrl + P` (Windows) and search for `Add Code Generation Libraries to pubspec.yaml` and hit enter.

4. Using short cuts.

## Key bindings

Convert from Clipboard (`Shift + Ctrl + Alt + V`)

Convert from Selection (`Shift + Ctrl + Alt + S`)

Convert from Clipboard to Code Generation supported classes (`Shift + Ctrl + Alt + G`)

Convert from Selection to Code Generation supported classes (`Shift + Ctrl + Alt + H`)

## Converter

- Array type merging
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