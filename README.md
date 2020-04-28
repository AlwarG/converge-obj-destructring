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
    prop2
  } = obj;
```
in the same block
<!--TRANSFORMS_END-->
**Note:**

if the cases like below

```
let obj = {
  prop1: 'property1',
  prop2: 'property2'
}

function updateProp2() {
  obj.prop2 = 'prop2';
}
function printProps() {
  let { prop1 } = obj;
  updateProp2();
  let { prop2 } = obj;
  console.log(prop1, prop2); // property1, prop2
}
```

After running this codemod printProps function will become 

```
function printProps() {
  let {
    prop1,
    prop2
  } = obj;
  updateProp2();
  console.log(prop1, prop2); // property1, property2
}
```

It will print `property1, property2` instead of `property1, prop2` because we are reading the prop2 value before updateProp2 function call. Kindly be aware before running this codemod.

## Contributing

### Installation

* clone the repo
* change into the repo directory
* `yarn`

### Running tests

* `yarn test`

### Update Documentation

* `yarn update-docs`