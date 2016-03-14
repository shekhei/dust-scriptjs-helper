import {default as chai, expect} from "chai";
// import * as dust from "dustjs-linkedin";
// import * as dust from "dustjs-helpers";
import {default as glob} from "glob";
import * as dust from "../dist";
import * as fs from "fs";
import {default as asPromised} from "chai-as-promised"
chai.use(asPromised);

// consider using some js engine emulators to test this perhaps

function matcher(template, context, output) {
  var compiled = dust.compile(template);
  var tmpl = dust.loadSource(compiled);
  return new Promise((res, rej)=>{
      dust.render(tmpl, context, (err, out) => {
          if ( err ) {
            return rej(err);
          }
          res(out)
      })
  })
}

describe("complex cases", function() {
  it('dual dependencies', function(){
    let template = [
      '{@bundleScript bundle="one" src="one.js"/}',
      '{@bundleScript bundle="two" src="two.js"/}',
      '{@bundleScript bundle="three" src="three.js"/}',
      '{@bundleDepends bundle="three"}',
      '{@dependsOn bundle="one"/}',
      '{@dependsOn bundle="two"/}',
      '{/bundleDepends}',
      '{@loadBundle bundle="three"/}',
      '{@renderScript /}'
    ].join("");
    let output = [
      '<script>',
      '$script(["two.js"],"two");',
      '$script(["one.js"],"one");',
      '$script.ready(["one","two"],function(){',
      '$script(["three.js"],"three");',
      '});',
      '</script>'
    ].join("");
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should output only partial of the graph if not included', function(){
    let template = [
      '{@bundleScript bundle="one" src="one.js"/}',
      '{@bundleScript bundle="two" src="two.js"/}',
      '{@bundleScript bundle="three" src="three.js"/}',
      '{@bundleDepends bundle="three"}',
      '{@dependsOn bundle="one"/}',
      '{@dependsOn bundle="two"/}',
      '{/bundleDepends}',
      '{@loadBundle bundle="two"/}',
      '{@renderScript /}'
    ].join("");
    let output = [
      '<script>',
      '$script(["two.js"],"two");',
      // '$script(["one.js"],"one");',
      // '$script.ready(["one","two"],function(){',
      // '$script(["three.js"],"three");',
      // '});',
      '</script>'
    ].join("");
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should output only partial of the graph if not included', function(){
    let template = [
      '{@bundleScript bundle="one" src="one.js"/}',
      '{@bundleScript bundle="two" src="two.js"/}',
      '{@bundleScript bundle="three" src="three.js"/}',
      '{@bundleDepends bundle="three"}',
      '{@dependsOn bundle="one"/}',
      // '{@dependsOn bundle="two"/}',
      '{/bundleDepends}',
      '{@loadBundle bundle="three"/}',
      '{@renderScript /}'
    ].join("");
    let output = [
      '<script>',
      // '$script(["two.js"],"two");',
      '$script(["one.js"],"one");',
      '$script.ready("one",function(){',
      '$script(["three.js"],"three");',
      '});',
      '</script>'
    ].join("");
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should output only partial of the graph and no repeats', function(){
    let template = [
      '{@bundleScript bundle="one" src="one.js"/}',
      '{@bundleScript bundle="two" src="two.js"/}',
      '{@bundleScript bundle="three" src="three.js"/}',
      '{@bundleDepends bundle="three"}',
      '{@dependsOn bundle="one"/}',
      '{@dependsOn bundle="two"/}',
      '{/bundleDepends}',
      '{@loadBundle bundle="three"/}',
      '{@scriptjs dependsOn="two"}{/scriptjs}',
      '{@renderScript /}'
    ].join("");
    let output = [
      '<script>',
      '$script(["two.js"],"two");',
      '$script(["one.js"],"one");',
      '$script.ready(["one","two"],function(){',
      '$script(["three.js"],"three");',
      '});',
      '$script.ready("two",function(){',
      '});',
      '</script>'
    ].join("");
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })

  it('should allow dependsOn helper in script tags and not load the once not depended on', function(){
    let template = [
      '{@bundleScript bundle="one" src="one.js"/}',
      '{@bundleScript bundle="two" src="two.js"/}',
      '{@bundleScript bundle="three" src="three.js"/}',
      '{@bundleDepends bundle="three"}',
      '{@dependsOn bundle="one"/}',
      '{@dependsOn bundle="two"/}',
      '{/bundleDepends}',
      '{@scriptjs}',
      '{@dependsOn bundle="two"/}',
      '{/scriptjs}',
      '{@renderScript /}'
    ].join("");
    let output = [
      '<script>',
      '$script(["two.js"],"two");',
      '$script.ready("two",function(){',
      '});',
      '</script>'
    ].join("");
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  // TODO flatten the traversed paths
  // it('should output only what is needed with similar dependencies packed in one', function(){
  //   let template = [
  //     '{@bundleScript bundle="one" src="one.js"/}',
  //     '{@bundleScript bundle="two" src="two.js"/}',
  //     '{@bundleDepends bundle="two" on="one"/}',
  //     '{@bundleScript bundle="three" src="three.js"/}',
  //     '{@bundleDepends bundle="three"}',
  //     '{@dependsOn bundle="one"/}',
  //     '{/bundleDepends}',
  //     '{@loadBundle bundle="three"/}',
  //     '{@scriptjs dependsOn="two"}{/scriptjs}',
  //     '{@renderScript /}'
  //   ].join("");
  //   let output = [
  //     '<script>',
  //     '$script(["one.js"],"one");',
  //     '$script.ready("one",function(){',
  //     '$script(["two.js"],"two");',
  //     '$script(["three.js"],"three");',
  //     '});',
  //     '$script.ready("two",function(){',
  //     '});',
  //     '</script>'
  //   ].join("");
  //   return expect(matcher(template, {}, output)).to.eventually.equal(output);
  // })
});
