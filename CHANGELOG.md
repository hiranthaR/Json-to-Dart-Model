# Changelog

## [Released]

## [3.2.3] - 2021-06-23

### Fixed
   - Removed Dart UI import for hashCode.
   - To improve better stability and flexibility configuration from the file `models.jsonc` was moved to the `Settings/Extensions/JSON To Dart Model`
   - Equality operator now sort lists first.
   - Null-Safety enabled as default. To disable it go to the `Settings/Extensions/JSON To Dart Model/Null Safety`

## [3.2.0] - 2021-06-18

### Added
   - Expression body for `fromJson` and `toJson`. In most cases it has a nicer format.
   - More `DateTime` format support.
   
     ```
     // Supported date formats. 
     2008-09-15T15:53:00
     2007-03-01T13:00:00Z
     2015-10-05T21:46:54-1500
     2015-10-05T21:46:54+07:00
     2020-02-06T14:00:00+00:00
     ```

### Fixed
   - Bugfix for merging class definitions.
   - More accurate marking of null safety indication.
   - Bugfix for annotation  marking.

## [3.1.5] - 2021-04-30

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/34) from [Arnas](https://github.com/iamarnas)
   - Improved equality operator.
   - Added annotations support.

   It is possible to mark `JSON` values as default or required by adding to your `JSON` key `d@` or `r@`

## [3.1.3] - 2021-04-23

### Fixed

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/31) from [Arnas](https://github.com/iamarnas)
   - Improved some syntax correction.

## [3.1.1] - 2021-04-17

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/29) from [Arnas](https://github.com/iamarnas)
   - Added primary configuration option to the `models.jsonc` file.
   - Those who update to 3.1.0 from older version. Be sure to add `"primaryConfiguration": false` to `models.jsonc` configuration or go to help for more information if you were warned.

## [3.1.0] - 2021-04-14

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/28) from [Arnas](https://github.com/iamarnas)
   - Added support for Dart null safety. 

   > For any suggestions on how to improve the better null safety syntax your are welcome  to open [discuss](https://github.com/hiranthaR/Json-to-Dart-Model/discussions).

   - Those who update to 3.1.0 from older version. Be sure to add `"nullSafety": false,` to `models.jsonc` configuration or go to help for more information if you were warned.

## [3.0.3] - 2021-04-06

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/27) from [Arnas](https://github.com/iamarnas)
   - Added better support for building models from `models.jsonc` file.
   - Those who update to 3.0.2 from older version. Be sure to add `"fastMode": false` to `models.jsonc` configuration or go to help for more information if you were warned.

## [3.0.0] - 2021-03-31

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/24) from [Arnas](https://github.com/iamarnas)
   - Added support to build from file.

## [2.7.5] - 2021-03-26

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/23) from [Arnas](https://github.com/iamarnas)
   - Added support for duplicate structures. 

## [2.6.4] - 2021-03-22

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/22) from [Arnas](https://github.com/iamarnas)
   - Added return as a received keyword 

## [2.6.3] - 2021-02-22

### Added

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/18) from [Arnas](https://github.com/iamarnas)
   - Added responsive formatting and date support.

## [2.6.2] - 2021-02-03

### Fixed

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/17) from [Arnas](https://github.com/iamarnas)
   - Added better support for deeply nested json objects.
   - Added support for list of lists. (Hot fix)

## [2.6.1] - 2021-02-03

### Fixed

- nested array not generating properly - [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/14) from [Ayush P Gupta](https://github.com/apgapg)
- Use original case of json fields - [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/13) from [Ayush P Gupta](https://github.com/apgapg)

## [2.6.0] - 2021-01-11

### Merged

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/10) from [Arnas](https://github.com/iamarnas)
  - `copyWith()` method
  - Equality Operator
  - support array of arrays
  - Freezed support

## [2.5.0] - 2021-01-04

### Merged

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/9) from [Arnas](https://github.com/iamarnas)

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
