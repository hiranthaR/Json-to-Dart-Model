# Changelog

## 3.5.8

   - Now can detect fractional seconds.

## 3.5.7

   - Fixed lint error for non-nullable typecast to the nullable type for JSON parser.
   - Added better equality operator with `DeepCollectionEquality` from the Dart collection.

## 3.5.6

   - Updated failing build scripts.

## 3.5.5

   - Bugfix and syntaxt corecction.

## 3.5.4

   - Added possibility to implement JSON converter, `encode/decode` inside the `toJson/fromJson` methods. Also will be added extra methods toMap/fromMap.

## 3.5.3

   - Bugfix for windows.

## 3.5.2

   - Bugfix.

## 3.5.1

   - Bugfix.

## 3.5.0

   - Added support for safe `JSON`. The generator can read and parse `json` and `jsonc` from any method.
   - Added support for multiple files conversion. The generator can read `**.json` and `**.jsonc` files from the tracked file or directory.
   - Added a better method for writing files from the context or file explorer.
   - Added option to override from/to suffix.
   - Added option to avoid `dynamic` types. Generator will generate `dynamic` types as `Object` with null safety check.
   - Improved conversion performance. 5X faster speed.
   - Bugfix.

## 3.4.1

   - Bugfix.

## 3.4.0

   - Hotfix. Does not generate a new model after deleted.
   - Added method to generate models from the `models.jsonc` file after detected newly added JSON objects.

## 3.3.9

   - Implemented faster equality operator.

## 3.3.8

   - Added new option include if null for the `fromJson` method.

## 3.3.7

   - Improved double values conversion.
   - Added possibility to override the default path with a new one by adding `__path` key by working with models.jsonc file. Example: `"__path": "/lib/models/user"`.
 
## 3.3.6

   - Bugfix.

## 3.3.5

   - Added support to force new type for key.

     Example:
     ```json
     {
        "userPost.post": {
         "id": 1,
         "description": "Json To Dart Model",
         "completed": false
	     }
     }
     ```
     Result:
     ```dart
     Post? userPost; // <- result
     UserPost? userPost; // <- without forcing
     ```
   - Bugfix.

## 3.3.4

   - Fixed JSON annotation key bug.

## 3.3.3

   - Fixed JSON annotation key for Freezed and JSON serializable, ex: `@JsonKey(name: user_id)`. JSON key annotation will be added only when needed. This provides a cleaner code syntax.
   - Fixed a correction of plural class names.

## 3.3.2

   - Added option to sort constructor declarations before other members.
   - Fixed lint errors for empty classes.
   - Documentation update.

## 3.3.1

   - Fixed an issue with `Freezed` where optional dynamic keys were not allowed.
   - Fixed a bug with Dart Format.

## 3.3.0

   - Improved implementation of code generation libraries to `pubspec.yaml` included and Freezed. All missing dependencies will be installed with one click.
   - Added file name enhancement. Separate your class name with a dot and after the dot everything will be added as enhancement name.

## 3.2.8

   - Correction of certain descriptions.
   - Added terminal focus when running the generator.

## 3.2.7 

   - Added actions from the right mouse button context menu.
   - Improved setting quality.

## 3.2.5

   - Added option to disable run build runner.
   - Added button don't ask again for confirmation, when generating from the `models.json` file.
   - Bug fix.

## 3.2.3

   - Removed Dart UI import for hashCode.
   - To improve better stability and flexibility configuration from the file `models.jsonc` was moved to the `Settings/Extensions/JSON To Dart Model`
   - Equality operator now sort lists first.
   - Null-Safety enabled as default. To disable it go to the `Settings/Extensions/JSON To Dart Model/Null Safety`

## 3.2.0

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
   - Bugfix for merging class definitions.
   - More accurate marking of null safety indication.
   - Bugfix for annotation  marking.

## 3.1.5

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/34) from [Arnas](https://github.com/iamarnas)
   - Improved equality operator.
   - Added annotations support.

It is possible to mark `JSON` values as default or required by adding to your `JSON` key `d@` or `r@`

## 3.1.3

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/31) from [Arnas](https://github.com/iamarnas)
   - Improved some syntax correction.

## 3.1.1

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/29) from [Arnas](https://github.com/iamarnas)
   - Added primary configuration option to the `models.jsonc` file.
   - Those who update to 3.1.0 from older version. Be sure to add `"primaryConfiguration": false` to `models.jsonc` configuration or go to help for more information if you were warned.

## 3.1.0

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/28) from [Arnas](https://github.com/iamarnas)
   - Added support for Dart null safety. 

   > For any suggestions on how to improve the better null safety syntax your are welcome  to open [discuss](https://github.com/hiranthaR/Json-to-Dart-Model/discussions).

   - Those who update to 3.1.0 from older version. Be sure to add `"nullSafety": false,` to `models.jsonc` configuration or go to help for more information if you were warned.

## 3.0.3

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/27) from [Arnas](https://github.com/iamarnas)
   - Added better support for building models from `models.jsonc` file.
   - Those who update to 3.0.2 from older version. Be sure to add `"fastMode": false` to `models.jsonc` configuration or go to help for more information if you were warned.

## 3.0.0

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/24) from [Arnas](https://github.com/iamarnas)
   - Added support to build from file.

## 2.7.5

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/23) from [Arnas](https://github.com/iamarnas)
   - Added support for duplicate structures. 

## 2.6.4

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/22) from [Arnas](https://github.com/iamarnas)
   - Added return as a received keyword 

## 2.6.3

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/18) from [Arnas](https://github.com/iamarnas)
   - Added responsive formatting and date support.

## 2.6.2

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/17) from [Arnas](https://github.com/iamarnas)
   - Added better support for deeply nested json objects.
   - Added support for list of lists. (Hot fix)

## 2.6.1

- nested array not generating properly - [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/14) from [Ayush P Gupta](https://github.com/apgapg)
- Use original case of json fields - [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/13) from [Ayush P Gupta](https://github.com/apgapg)

## 2.6.0

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/10) from [Arnas](https://github.com/iamarnas)
  - `copyWith()` method
  - Equality Operator
  - support array of arrays
  - Freezed support

## 2.5.0 - 2021-01-04

- see [pull request](https://github.com/hiranthaR/Json-to-Dart-Model/pull/9) from [Arnas](https://github.com/iamarnas)

## 2.4.2 - 2020-12-29

- Fixed List<Null>  to List<dynamic>
- improved with [Effective Dart: Style](https://dart.dev/guides/language/effective-dart/style)
- removed unwanted `new` keywords

## 2.4.

- Fixed temporary windows folder selection issue

## 2.4.0

- Files stop generating when some dart file is duplicated
- Field names are bad formatted in the equatable related `props` override
- Cannot read type of undefined

## 2.3.0

- Fixed JsonSerializable.toJson
- Also appends --delete-conflicting-outputs to the flutter pub run build_runner build command in the terminal so it can always be built
- Adds the ability to have better equality checks in the generated Dart models using the Equatable package.

## 2.2.0

- fixed filename, snake cased file create error when underscore.
- `@JsonKey` annotation to code generation library generated codes.
Read more about [Creating model classes the json_serializable way](https://flutter.dev/docs/development/data-and-backend/json#creating-model-classes-the-json_serializable-way)

## 2.1.0

- fixed extra empty lines on import section mistake
- chagelogs version mistake

## 2.0.0

- Added command to generate model classes according to code generation libraries.
- generate models with selected json.
- generate models with copied json.
- add terminal session to run build command `flutter pub run build_runner build`. Read more about [Serializing JSON using code generation libraries](https://flutter.dev/docs/development/data-and-backend/json#serializing-json-using-code-generation-libraries).

## 1.5.0

- Code generation packages appending command. read more about [Serializing JSON using code generation libraries](https://flutter.dev/docs/development/data-and-backend/json#serializing-json-using-code-generation-libraries).

## 1.4.0

- fixed numbers exponent error.
- downgraded support version of vs code from 1.3 to 1.2

## 1.3.0

- fixed array sub type error when subtype is not a primitive.
- fixed array sub type import error when subtype is not a primitive.
- fixed array subtype class generate error.

## 1.2.0

- fixed error when null values appear.
- display errors added.
- icon changed

## 1.1.0

- Json convert to dart models
