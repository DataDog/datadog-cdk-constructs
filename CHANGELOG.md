# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.21.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.20.0...v2-1.21.0) (2024-11-26)

## [1.20.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.19.0...v2-1.20.0) (2024-11-26)


### Features

* Add example Go stack for Step Functions ([#329](https://github.com/DataDog/datadog-cdk-constructs/issues/329)) ([dc2b917](https://github.com/DataDog/datadog-cdk-constructs/commit/dc2b9174cc84445cb2d15f694202c9516a1b573d))
* Add example Python stack for Step Functions ([#328](https://github.com/DataDog/datadog-cdk-constructs/issues/328)) ([ce4937d](https://github.com/DataDog/datadog-cdk-constructs/commit/ce4937df3b1509529e5d6ea0c63461b93ffda886))
* Set dd_cdk_construct version tag on state machine ([#339](https://github.com/DataDog/datadog-cdk-constructs/issues/339)) ([914c444](https://github.com/DataDog/datadog-cdk-constructs/commit/914c444f22ca56455f1a817312dcf60c6b5b044c))
* Set DD_TRACE_ENABLED tag on state machine ([#338](https://github.com/DataDog/datadog-cdk-constructs/issues/338)) ([8fcf1e1](https://github.com/DataDog/datadog-cdk-constructs/commit/8fcf1e1c83239e66a17784e6879383e6d1a6a18a))
* Support debug log for Step Function ([#340](https://github.com/DataDog/datadog-cdk-constructs/issues/340)) ([44e9dd0](https://github.com/DataDog/datadog-cdk-constructs/commit/44e9dd0fce0c8ba228681dfe94b1921d2b94b319))

## [1.19.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.18.0...v2-1.19.0) (2024-11-15)


### Features

* [Step Function] Set up logging ([#318](https://github.com/DataDog/datadog-cdk-constructs/issues/318)) ([49ae769](https://github.com/DataDog/datadog-cdk-constructs/commit/49ae76996a94585d0ff308ec41acf5c6e2947bb5))
* [Step Function] Subscribe forwarder to log group ([#319](https://github.com/DataDog/datadog-cdk-constructs/issues/319)) ([b91b796](https://github.com/DataDog/datadog-cdk-constructs/commit/b91b79690de4b7aa0f70d61211c62d8025fc1568))
* add skeleton of step function class and example stack ([#315](https://github.com/DataDog/datadog-cdk-constructs/issues/315)) ([225ad21](https://github.com/DataDog/datadog-cdk-constructs/commit/225ad21fae8f99aed3304eb9bf0442d53fe1c82e))
* Support StepFunction->Lambda trace merging ([#325](https://github.com/DataDog/datadog-cdk-constructs/issues/325)) ([cd49812](https://github.com/DataDog/datadog-cdk-constructs/commit/cd49812784c143572ee459f4d82dd2e8927b053e))
* Support StepFunction->StepFunction trace merging ([#326](https://github.com/DataDog/datadog-cdk-constructs/issues/326)) ([0fc4e7d](https://github.com/DataDog/datadog-cdk-constructs/commit/0fc4e7d886665bf167e5dfcbf597b545883978a8))
* update example code and doc to use DatadogLambda ([#289](https://github.com/DataDog/datadog-cdk-constructs/issues/289)) ([fbf5c43](https://github.com/DataDog/datadog-cdk-constructs/commit/fbf5c43bd72a4dc2193e2659e6b2bb133953ef46))

## [1.18.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.17.0...v2-1.18.0) (2024-10-17)


### Features

* Decouple `extensionLayerVersion` from `addLayers` ([#303](https://github.com/DataDog/datadog-cdk-constructs/issues/303)) ([db1738f](https://github.com/DataDog/datadog-cdk-constructs/commit/db1738fc5c461f399077de2089b9f5efce24476b))

## [1.17.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.16.1...v2-1.17.0) (2024-10-16)

### [1.16.1](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.16.0...v2-1.16.1) (2024-09-09)


### Bug Fixes

* revert "chore: rename Lambda related interfaces ([#288](https://github.com/DataDog/datadog-cdk-constructs/issues/288))" ([#296](https://github.com/DataDog/datadog-cdk-constructs/issues/296)) ([0330420](https://github.com/DataDog/datadog-cdk-constructs/commit/0330420ad36360d4c842aa4b96da1d241d3e2fe5))

## [1.16.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.15.0...v2-1.16.0) (2024-09-09)


### Features

* Rename: Datadog -> DatadogLambda ([#285](https://github.com/DataDog/datadog-cdk-constructs/issues/285)) ([44c50db](https://github.com/DataDog/datadog-cdk-constructs/commit/44c50dbff369e582beeee5ca40fb73ccedaeb580))


### Bug Fixes

* exclude example stacks from package ([#293](https://github.com/DataDog/datadog-cdk-constructs/issues/293)) ([a0748cc](https://github.com/DataDog/datadog-cdk-constructs/commit/a0748cc8963a11984c38ebde8e31230cde39789d))

## [1.15.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.14.1...v2-1.15.0) (2024-08-23)


### Bug Fixes

* add custom provided.al2023 to runtime lookup ([#284](https://github.com/DataDog/datadog-cdk-constructs/issues/284)) ([f72a797](https://github.com/DataDog/datadog-cdk-constructs/commit/f72a7972cc0d3870c7578d889da37fd7e1c6205b))

### [1.14.1](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.14.0...v2-1.14.1) (2024-08-14)

## [1.14.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.13.0...v2-1.14.0) (2024-08-13)


### Features

* Add example Go stack ([#273](https://github.com/DataDog/datadog-cdk-constructs/issues/273)) ([71f5f4e](https://github.com/DataDog/datadog-cdk-constructs/commit/71f5f4e71235fa5af819563feb24c9703f4487a9))
* Support Go ([#267](https://github.com/DataDog/datadog-cdk-constructs/issues/267)) ([12874d5](https://github.com/DataDog/datadog-cdk-constructs/commit/12874d50f8da0f2597ca3d2c56c1963dc850bc45))


### Bug Fixes

* add path to Go module name ([#269](https://github.com/DataDog/datadog-cdk-constructs/issues/269)) ([5bce51e](https://github.com/DataDog/datadog-cdk-constructs/commit/5bce51ed3d2526f4208a6e7fb43f2a070b5a06b8))
* Ensure ASM does not apply when the extension is not present ([#258](https://github.com/DataDog/datadog-cdk-constructs/issues/258)) ([6cef564](https://github.com/DataDog/datadog-cdk-constructs/commit/6cef5640d788fc9f931697e379b4bf04d1b52db0))
* Move Go module to another repo ([#274](https://github.com/DataDog/datadog-cdk-constructs/issues/274)) ([fa63451](https://github.com/DataDog/datadog-cdk-constructs/commit/fa63451cd6fed43543a623e70ca7272da52445bf))
* Remove Go package from current repo ([#276](https://github.com/DataDog/datadog-cdk-constructs/issues/276)) ([8d0f92f](https://github.com/DataDog/datadog-cdk-constructs/commit/8d0f92f33b4e7da6abc8b667fa2ed26f6b5b691c))

## [1.13.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.12.0...v2-1.13.0) (2024-03-28)


### Features

* support .NET 8 runtime ([#256](https://github.com/DataDog/datadog-cdk-constructs/issues/256)) ([d6093b5](https://github.com/DataDog/datadog-cdk-constructs/commit/d6093b5b6cd667d84e002969b1f0cfa2f65c6e60))

## [1.12.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.11.0...v2-1.12.0) (2024-02-02)


### Features

* Java doesn't have an arm layer, also clean up some code ([#246](https://github.com/DataDog/datadog-cdk-constructs/issues/246)) ([73a9b7b](https://github.com/DataDog/datadog-cdk-constructs/commit/73a9b7b98790628cbb982eb1b56dfaa21c3e326e))

## [1.11.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.10.0...v2-1.11.0) (2024-01-02)

## [1.10.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.9.0...v2-1.10.0) (2023-12-06)


### Features

* support `.NET` runtimes ([#236](https://github.com/DataDog/datadog-cdk-constructs/issues/236)) ([62c45a9](https://github.com/DataDog/datadog-cdk-constructs/commit/62c45a9880ae3e77eb1270608fe74d9771eb21f7))
* Support java21 ([#235](https://github.com/DataDog/datadog-cdk-constructs/issues/235)) ([69038b6](https://github.com/DataDog/datadog-cdk-constructs/commit/69038b62477e433ac367b8cc0a513ea716c99629))

## [1.9.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.8.2...v2-1.9.0) (2023-10-19)

### [1.8.2](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.8.1...v2-1.8.2) (2023-10-18)

### [1.8.1](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.8.0...v2-1.8.1) (2023-10-02)


### Features

* ASM for Lambda configuration ([#212](https://github.com/DataDog/datadog-cdk-constructs/issues/212)) ([7d6327b](https://github.com/DataDog/datadog-cdk-constructs/commit/7d6327b21e718217fd4646da952267027f13ce0b))

## [1.8.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.7.4...v2-1.8.0) (2023-08-29)

### [1.7.4](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.7.3...v2-1.7.4) (2023-07-05)

### [1.7.3](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.7.1...v2-1.7.3) (2023-06-13)

### [1.7.1](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.7.0...v2-1.7.1) (2023-05-18)


### Bug Fixes

* auto grant secret read permissions python package bug ([#181](https://github.com/DataDog/datadog-cdk-constructs/issues/181)) ([dec8ead](https://github.com/DataDog/datadog-cdk-constructs/commit/dec8ead28d8c8f262508d9896159a746b0fc7dd1))

## [1.7.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.6.1...v2-1.7.0) (2023-05-17)


### Features

* add `redirectHandler` option ([#176](https://github.com/DataDog/datadog-cdk-constructs/issues/176)) ([4173cc4](https://github.com/DataDog/datadog-cdk-constructs/commit/4173cc40165d789b3abd62f277664bc11de6e4c5))
* add java17 in runtimeLookup ([#177](https://github.com/DataDog/datadog-cdk-constructs/issues/177)) ([ae3bb8b](https://github.com/DataDog/datadog-cdk-constructs/commit/ae3bb8b323e0d9843a968ebac7ce187b7956f3df))

### [1.6.1](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.6.0...v2-1.6.1) (2023-04-25)

## [1.6.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.5.0...v2-1.6.0) (2023-04-19)


### Features

* add `CODEOWNERS` ([#162](https://github.com/DataDog/datadog-cdk-constructs/issues/162)) ([b5edabe](https://github.com/DataDog/datadog-cdk-constructs/commit/b5edabe7eaf855d001c19f1c8fb2709dc85f63bd))
* python 3.10 support ([#170](https://github.com/DataDog/datadog-cdk-constructs/issues/170)) ([a79a4c9](https://github.com/DataDog/datadog-cdk-constructs/commit/a79a4c96b2424e664575ea52fc2df5e4a504e1a1))


### Bug Fixes

* grammar error for `apmFlushDeadline` description ([#161](https://github.com/DataDog/datadog-cdk-constructs/issues/161)) ([552d7ac](https://github.com/DataDog/datadog-cdk-constructs/commit/552d7ace2e0c9082e758690766a69dc6dc7dee82))

## [1.5.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.4.0...v2-1.5.0) (2023-03-30)

## [1.4.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.3.0...v2-1.4.0) (2023-02-14)

## [1.3.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.2.0...v2-1.3.0) (2023-02-01)


### Features

* bump lambda python alpha ([#143](https://github.com/DataDog/datadog-cdk-constructs/issues/143)) ([fe5be40](https://github.com/DataDog/datadog-cdk-constructs/commit/fe5be40973587d23de68dea7179f70f0ddc979ee))

## [1.2.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.1.0...v2-1.2.0) (2022-12-16)

## [1.1.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-1.0.0...v2-1.1.0) (2022-12-16)


### Features

* add node 18 ([#132](https://github.com/DataDog/datadog-cdk-constructs/issues/132)) ([ae79f98](https://github.com/DataDog/datadog-cdk-constructs/commit/ae79f9865719ef0ef0f4ac88c326acca0099e721))
* allow xray traces to be merged ([#127](https://github.com/DataDog/datadog-cdk-constructs/issues/127)) ([b44d00a](https://github.com/DataDog/datadog-cdk-constructs/commit/b44d00ac14197fbdc3f6757d2236b1c9929e2e89))


### Bug Fixes

* isARM object comparison ([#123](https://github.com/DataDog/datadog-cdk-constructs/issues/123)) ([5deb1c6](https://github.com/DataDog/datadog-cdk-constructs/commit/5deb1c61e3166a859e3baf91009138010dde32cb))

## [1.0.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.6...v2-1.0.0) (2022-10-11)

## [1.0.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.6...v2-1.0.0) (2022-10-11)

### [0.3.6](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.5...v2-0.3.6) (2022-09-28)

### [0.3.5](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.4...v2-0.3.5) (2022-08-02)


### Bug Fixes

* ensure addLayers=false prevents layers being added ([#116](https://github.com/DataDog/datadog-cdk-constructs/issues/116)) ([3d3d88e](https://github.com/DataDog/datadog-cdk-constructs/commit/3d3d88e44bcd9db0d31c04bd5d42df5507cc8c95))

### [0.3.4](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.3...v2-0.3.4) (2022-07-20)

### [0.3.3](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.2...v2-0.3.3) (2022-06-13)

### [0.3.2](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.1...v2-0.3.2) (2022-05-18)

### [0.3.1](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.3.0...v2-0.3.1) (2022-05-02)

## [0.3.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.2.0...v2-0.3.0) (2022-04-25)

## [0.2.0](https://github.com/DataDog/datadog-cdk-constructs/compare/v2-0.1.0...v2-0.2.0) (2022-02-25)

## 0.1.0 (2022-02-03)
