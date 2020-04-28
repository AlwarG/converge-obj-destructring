# converge-obj-destructuring


A collection of codemod's for converge-obj-destructuring.

## Usage

To run a specific codemod from this project, you would run the following:

```
npx converge-obj-destructuring <TRANSFORM NAME> path/of/files/ or/some**/*glob.js

# or

yarn global add converge-obj-destructuring
converge-obj-destructuring <TRANSFORM NAME> path/of/files/ or/some**/*glob.js
```

## Transforms

<!--TRANSFORMS_START-->
```
let { prop1 } = obj;
let { prop2 } = obj;
```

into this

```
let {
    prop1,
    prop1
  } = obj;
```
in the same block
<!--TRANSFORMS_END-->

## Contributing

### Installation

* clone the repo
* change into the repo directory
* `yarn`

### Running tests

* `yarn test`

### Update Documentation

* `yarn update-docs`