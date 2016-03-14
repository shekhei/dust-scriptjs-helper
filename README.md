# A set of helpers for using [script.js](http://github.com/ded/script.js) as async dependency loader with [dust.js](http://github.com/linkedin/dustjs)


## What does it do?

Basically it helps you build your script.js code, and if any depended bundle is not requested, it will not be built. It builds a very simple graph internally and is used to build the code

### Not loading of unnecessary bundles

The following code is very much similar to the above code, except, the final set of script only depends on bundle("two") and as you can see the final result is much shorter(since bundle three is not loaded, bundle one is not needed)

```html
<!doctype html>
<head>
</head>
<body>
<!-- you must first include script.js on your own -->
<!-- now you can add your dependencies -->
{@bundleScript bundle="one" src="one.js"/}
{@bundleScript bundle="two" src="two.js"/}
{@bundleScript bundle="three" src="three.js"/}
{@bundleDepends bundle="three"}
{@dependsOn bundle="one"/}
{@dependsOn bundle="two"/}
{/bundleDepends}
{@scriptjs}
{@dependsOn bundle="two"/}
{/scriptjs}
<!-- please include renderScript as late as possible, this is where the script code will be rendered -->
{@renderScript /}
</body>
</html>
```

#### output
```html
<!doctype html>
<head>
</head>
<body>
<script>
$script(["two.js"],"two");
$script.ready("two",function(){
});
</script>
</body>
</html>
```

### Not repeating the code if possible(still improving)

Here, two scripts depends on "one" and "three", and "three" depends on "one" and "two", although "one" is included by two different sets, but $script() is only called for bundle "one" once.

```html
<!doctype html>
<head>
</head>
<body>
<!-- you must first include script.js on your own -->
<!-- now you can add your dependencies -->
{@bundleScript bundle="one" src="one.js"/}
{@bundleScript bundle="two" src="two.js"/}
{@bundleScript bundle="three" src="three.js"/}
{@bundleDepends bundle="three"}
{@dependsOn bundle="one"/}
{@dependsOn bundle="two"/}
{/bundleDepends}
{@scriptjs}
{@dependsOn bundle="three"/}
{/scriptjs}
{@scriptjs dependsOn="one"/}
{/scriptjs}
<!-- please include renderScript as late as possible, this is where the script code will be rendered -->
{@renderScript /}
</body>
</html>
```

#### output
```html
<!doctype html>
<head>
</head>
<body>
<script>
$script(["one.js"],"one");
$script(["two.js"],"two");
$script.ready(["one","two"],function(){
  $script(["three.js"],"three");
});
$script.ready("three", function(){
})
$script.ready("one", function(){
})
</script>
</body>
</html>
```

## Usage

### installation
```sh
npm install --save dust-scriptjs-helper
```

### nodejs usage
```javascript
import {* as dust} from "dust-scriptjs-helper" // this is the decorated dust object with dustjs-helpers
```

### example

#### dustjs code
```html
<!doctype html>
<head>
</head>
<body>
<!-- you must first include script.js on your own -->
<!-- now you can add your dependencies -->
{@bundleScript bundle="one" src="one.js"/}
{@bundleScript bundle="two" src="two.js"/}
{@bundleScript bundle="three" src="three.js"/}
{@bundleDepends bundle="three"}
{@dependsOn bundle="one"/}
{@dependsOn bundle="two"/}
{/bundleDepends}
{@scriptjs}
{@dependsOn bundle="two"/}
{@dependsOn bundle="three"/}
{/scriptjs}
<!-- please include renderScript as late as possible, this is where the script code will be rendered -->
{@renderScript /}
</body>
</html>
```

#### output(or something similar, it is not prettified right now)
```html
<!doctype html>
<head>
</head>
<body>
<script>
<!-- the unused bundles are not included -->
$script(["one.js"],"one");
$script(["two.js"],"two");
$script.ready(["one","two"], function(){
  $script(["three.js"],"three");
})
$script.ready(["two","three"],function(){
});
</script>
</body>
</html>
```

### helper list

Helper name | Use
------------ | ----------
bundleScript | defining script in a bundle
bundleDepends | defining bundle dependencies
dependsOn | To be used with \@scriptjs and \@bundleDepends for defining script or bundle dependency
scriptjs | for a block of code encapculated within a $script.ready
loadBundle | if you want to explicitly load a bundle, for example some global.js kinda things that you wanna load even if it is not depended
renderScript | place this at where you want to render the scripts, unfortunately this has to be placed after all the above definitions, so, best right before </body>

#### \@bundleScript
```
{@bundleScript src="src.js" bundle="bundlename"/}
<!-- or you can do this -->
{@bundleScript bundle="bundlename"}
["src1.js","src2.js"]
{/bundleScript}
```

#### \@dependsOn
```
{@dependsOn bundle="bundlename"/}
```

#### \@bundleDepends
```
{@bundleDepends bundle="bundlename" on="bundlename2"/}
<!-- or below -->
{@bundleDepends bundle="bundlename"}
{@dependsOn bundle="bundlename2"/}
{@dependsOn bundle="bundlename3"/}
{/bundleDepends}
```

#### \@scriptjs
```
{@scriptjs dependsOn="bundlename2"}
console.log('abc');
somecodeyouwannado();
//basically all your javascript code that depends on bundlename2
{/scriptjs}
<!-- or below -->
{@scriptjs}
{@dependsOn bundle="bundlename2"/}
{@dependsOn bundle="bundlename3"/}
console.log('abc');
somecodeyouwannado();
//basically all your javascript code that depends on bundlename2 and bundlename3
{/scriptjs}
```

#### \@loadBundle
```
{@loadBundle bundle="bundle"/}
```
#### \@renderScript
```
{@renderScript/}
```
