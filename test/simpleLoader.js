import {default as chai, expect} from "chai";
// import * as dust from "dustjs-linkedin";
import {default as glob} from "glob";
import * as dust from "../src";
import * as fs from "fs";
import {default as asPromised} from "chai-as-promised"
chai.use(asPromised);


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

describe("simple inputs should match simple outputs", function() {
  it('should be empty', function(){
    let template = "{@renderScript /}";
    let output = "";
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should be empty if it is not depended on', function(){
    let template = '{@bundleScript bundle="vendor" src="one.js"/}{@renderScript /}';
    let output = "";
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should output script if it is loaded', function(){
    let template = '{@bundleScript bundle="vendor" src="one.js"/}{@loadBundle bundle="vendor"/}{@renderScript /}';
    let output = '<script>$script(["one.js"],"vendor");</script>';
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should accept json array for bundleScript', function(){
    let template = '{@bundleScript bundle="vendor"}["one.js"]{/bundleScript}{@loadBundle bundle="vendor"/}{@renderScript /}';
    let output = '<script>$script(["one.js"],"vendor");</script>';
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should output script if it is used by script', function(){
    let template = [
      '{@bundleScript bundle="vendor" src="one.js"/}',
      '{@scriptjs dependsOn="vendor"}{/scriptjs}',
      '{@renderScript /}'
    ].join("");
    let output = [
      '<script>',
      '$script(["one.js"],"vendor");',
      '$script.ready("vendor",function(){});',
      '</script>'
    ].join("");
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
  it('should output script if it is used by script', function(){
    let template = [
      '{@bundleScript bundle="one" src="one.js"/}',
      '{@scriptjs dependsOn="one"}{/scriptjs}',
      '{@renderScript /}'
    ].join("");
    let output = [
      '<script>',
      '$script(["one.js"],"one");',
      '$script.ready("one",function(){});',
      '</script>'
    ].join("");
    return expect(matcher(template, {}, output)).to.eventually.equal(output);
  })
});
