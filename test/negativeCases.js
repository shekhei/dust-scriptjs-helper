import {default as chai, expect} from "chai";
// import * as dust from "dustjs-linkedin";
// import * as dust from "dustjs-helpers";
import {default as glob} from "glob";
import * as dust from "../src";
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

describe("negative case", function() {
  it('bundleScript', function(){
    var promises = [];
    let template = [
      '{@bundleScript bundle="one"/}',
    ].join("");
    promises.push(expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("Either src or a body has to be provided"));
    template = [
      '{@bundleScript bundle="one"}{}{/bundleScript}',
    ].join("");
    promises.push(expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("body has to be an array"));
    template = [
      '{@bundleScript bundle="one"}-{/bundleScript}',
    ].join("");
    promises.push(expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("src has to be a valid json array"));
    return promises;
  })
  it('bundleDepends', function(){
    var promises = [];
    let template = [
      '{@bundleScript bundle="one" src="abc"}[]{/bundleScript}',
      '{@bundleScript bundle="two" src="abc"}[]{/bundleScript}',
      '{@bundleDepends bundle="one"}{/bundleDepends}'
    ].join("");
    promises.push(expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("bundleDepends helper has to have 'bundle' parameter at dependencies defined either by 'on' parameter or @dependsOn helper"));
    template = [
      '{@bundleScript bundle="one" src="abc"}[]{/bundleScript}',
      '{@bundleScript bundle="two" src="abc"}[]{/bundleScript}',
      '{@bundleDepends on="one"}{/bundleDepends}'
    ].join("");
    promises.push(expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("bundleDepends helper has to have 'bundle' parameter at dependencies defined either by 'on' parameter or @dependsOn helper"));
    template = [
      '{@bundleScript bundle="one" src="abc"}[]{/bundleScript}',
      '{@bundleScript bundle="two" src="abc"}[]{/bundleScript}',
      '{@bundleDepends}{/bundleDepends}'
    ].join("");
    promises.push(expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("bundleDepends helper has to have 'bundle' parameter at dependencies defined either by 'on' parameter or @dependsOn helper"));
    return promises;
  })
  it('dependsOn shouldnt be allowed to be called outside @scriptjs or @bundleDepends', function(){
    var promises = [];
    let template = [
      '{@dependsOn/}',
    ].join("");
    return expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("dependsOn can only be called within bundleDepends or script tag");
  });
  //TODO find out why is the error seemingly eaten
  // it('dependsOn should be called without bundle param', function(){
  //   let template = [
  //     '{@bundleDepends bundle="one"}',
  //     '{@dependsOn/}',
  //     '{/bundleDepends}'
  //   ].join("");
  //   return matcher(template, {}, "").catch((e)=>{console.log(e.stack);})
  //   // return expect(matcher(template, {}, "")).to.eventually.be.rejectedWith("dependsOn has to contain 'bundle' parameter");
  // })
});
