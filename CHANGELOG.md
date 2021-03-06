# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- [#123](https://github.com/Kashoo/synctos/issues/123): Specify sync-function-loader.js as the main package file
- [#110](https://github.com/Kashoo/synctos/issues/110): Item constraint that requires an exact value match
- [#108](https://github.com/Kashoo/synctos/issues/108): Finer grained control over whether null and missing values are accepted
- [#127](https://github.com/Kashoo/synctos/issues/127): Immutable constraints that treat null and missing values as different
- [#128](https://github.com/Kashoo/synctos/issues/128): Equality constraint that treats null and missing values as different

### Changed
- [#118](https://github.com/Kashoo/synctos/issues/118): Embed indent.js as a static dependency

## [1.9.1] - 2017-05-01
### Fixed
- [#116](https://github.com/Kashoo/synctos/issues/116): Syntax error when the Sync Gateway admin UI loads a generated sync function

## [1.9.0] - 2017-04-26
### Added
- [#94](https://github.com/Kashoo/synctos/issues/94): Support dynamic item validation constraints
- [#95](https://github.com/Kashoo/synctos/issues/95): Accept Date object for date/time constraint parameters
- [#97](https://github.com/Kashoo/synctos/issues/97): Support dynamic document constraints
- [#100](https://github.com/Kashoo/synctos/issues/100): Option to initialize test helper module with document definition file

### Fixed
- [#113](https://github.com/Kashoo/synctos/issues/113): Backticks in document definitions cause syntax errors

## [1.8.0] - 2017-03-21
### Added
- [#90](https://github.com/Kashoo/synctos/issues/90): Document-wide constraints on file attachments

### Changed
- [#80](https://github.com/Kashoo/synctos/issues/80): Decompose specifications file for sample document definitions
- [#88](https://github.com/Kashoo/synctos/issues/88): Move test-helper module documentation to the top of the file

## [1.7.0] - 2017-01-26
### Added
- [#73](https://github.com/Kashoo/synctos/issues/73): Include an implicit type property when a simple type filter is used
- [#78](https://github.com/Kashoo/synctos/issues/78): Enum property validation type
- [#79](https://github.com/Kashoo/synctos/issues/79): Support minimum/maximum size constraint on hashtable validation type
- [#75](https://github.com/Kashoo/synctos/issues/75): Decompose the sync function template

## [1.6.0] - 2017-01-18
### Added
- [#66](https://github.com/Kashoo/synctos/issues/66): Modular document definition files
- [#69](https://github.com/Kashoo/synctos/issues/69): Helper function to determine whether a document is missing or deleted
- [#72](https://github.com/Kashoo/synctos/issues/72): New property validation type for type identifier properties

## [1.5.0] - 2016-12-14
### Added
- [#25](https://github.com/Kashoo/synctos/issues/25): Support custom actions to be executed on a document type
- [#61](https://github.com/Kashoo/synctos/issues/61): Support dynamic assignment of roles to users

## [1.4.0] - 2016-11-30
### Added
- [#22](https://github.com/Kashoo/synctos/issues/22): Support document authorization by role
- [#23](https://github.com/Kashoo/synctos/issues/23): Support document authorization by specific users

## [1.3.1] - 2016-11-24
### Changed
- [#52](https://github.com/Kashoo/synctos/issues/52): Upgrade development dependencies

### Fixed
- [#54](https://github.com/Kashoo/synctos/issues/54): Access assignments should receive null when old document is deleted

## [1.3.0] - 2016-11-23
### Added
- [#28](https://github.com/Kashoo/synctos/issues/28): Parameter to allow unknown properties in a document or object
- [#49](https://github.com/Kashoo/synctos/issues/49): Explicitly declare JSHint rules
- [#24](https://github.com/Kashoo/synctos/issues/24): Support dynamic assignment of channels to roles and users

## [1.2.0] - 2016-07-21
### Added
- [#29](https://github.com/Kashoo/synctos/issues/29): Parameter to indicate that an item cannot be modified if it has a value
- [#30](https://github.com/Kashoo/synctos/issues/30): Parameter to prevent documents from being replaced
- [#31](https://github.com/Kashoo/synctos/issues/31): Parameter to prevent documents from being deleted
- [#32](https://github.com/Kashoo/synctos/issues/32): Range validation parameters that exclude the minimum/maximum values
- [#39](https://github.com/Kashoo/synctos/issues/39): Test helper convenience functions to build validation error messages

### Fixed
- [#42](https://github.com/Kashoo/synctos/issues/42): Arrays can be assigned to items that expect object or hashtable

## [1.1.0] - 2016-07-15
### Added
- [#26](https://github.com/Kashoo/synctos/issues/26): Provide default type filter function

### Fixed
- [#36](https://github.com/Kashoo/synctos/issues/36): Does not return a non-zero exit status when sync function generation fails

## [1.0.0] - 2016-07-12
First public release

[Unreleased]: https://github.com/Kashoo/synctos/compare/v1.9.1...HEAD
[1.9.1]: https://github.com/Kashoo/synctos/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/Kashoo/synctos/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/Kashoo/synctos/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/Kashoo/synctos/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Kashoo/synctos/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Kashoo/synctos/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Kashoo/synctos/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Kashoo/synctos/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Kashoo/synctos/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Kashoo/synctos/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Kashoo/synctos/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Kashoo/synctos/compare/57a18bd...v1.0.0
