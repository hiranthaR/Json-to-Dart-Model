# Changelog

## [Released]

## [2.4.2] - 2020-12-29

### Fixed

- Fixed List<Null>  to List<dynamic>
- improved with [Effective Dart: Style](https://dart.dev/guides/language/effective-dart/style)
- removed unwanted `new` keywords

## [2.4.1] - 2020-09-13

### Fixed

- Fixed temporary windows folder selection issue

## [2.4.0] - 2020-08-14

### Fixed

- Files stop generating when some dart file is duplicated
- Field names are bad formatted in the equatable related `props` override
- Cannot read type of undefined

## [2.3.0] - 2020-08-14

### Fixed

- Fixed JsonSerializable.toJson
- Also appends --delete-conflicting-outputs to the flutter pub run build_runner build command in the terminal so it can always be built

### Added

- Adds the ability to have better equality checks in the generated Dart models using the Equatable package.

## [2.2.0] - 2020-05-28

### Fixed

- fixed filename, snake cased file create error when underscore.

### Added

- `@JsonKey` annotation to code generation library generated codes

read more about [Creating model classes the json_serializable way](https://flutter.dev/docs/development/data-and-backend/json#creating-model-classes-the-json_serializable-way)

## [2.1.0] - 2020-03-31

### Fixed

- fixed extra empty lines on import section mistake
- chagelogs version mistake

## [2.0.0] - 2020-03-31

### Added

- Added command to generate model classes according to code generation libraries.
- generate models with selected json.
- generate models with copied json.
- add terminal session to run build command `flutter pub run build_runner build`

read more about [Serializing JSON using code generation libraries](https://flutter.dev/docs/development/data-and-backend/json#serializing-json-using-code-generation-libraries).

## [1.5.0] - 2020-03-31

### Added

- Code generation packages appending command. read more about [Serializing JSON using code generation libraries](https://flutter.dev/docs/development/data-and-backend/json#serializing-json-using-code-generation-libraries).

## [1.4.0] - 2020-03-24

### Fixed

- fixed numbers exponent error.

### Changed

- downgraded support version of vs code from 1.3 to 1.2

## [1.3.0] - 2020-03-23

### Fixed

- fixed array sub type error when subtype is not a primitive.
- fixed array sub type import error when subtype is not a primitive.
- fixed array subtype class generate error.

## [1.2.0] - 2020-03-23

### Fixed

- fixed error when null values appear

### Added

- display errors added

### Changed

- icon changed

## [1.1.0] - 2020-03-22

### Added

- Json convert to dart models
