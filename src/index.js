import {default as DepGraphNode} from "./graph";
import {default as debugLog} from "debug";
import {default as dust} from "dustjs-helpers";

const debug = debugLog("dust-scriptjs-helper:index");

const globalKey = "scriptsBlock"
const globalKeyBundleless = "scriptsBlockBundleless"

// {@bundleScript bundle="vendor" src="//cdn.bootcss.com/jquery/1.11.3/jquery.min.js"/}
// {@bundleScript bundle="vendor" src="//cdn.bootcss.com/hammer.js/2.0.4/hammer.min.js"/}
// {@bundleScript bundle="vendor" src="//cdn.bootcss.com/dustjs-linkedin/2.7.2/dust-core.min.js"/}
// {@bundleScript bundle="vendor" src="//cdn.bootcss.com/socket.io/1.3.6/socket.io.min.js"/}
// {@bundleScript bundle="vendor" src="//cdn.bootcss.com/moment.js/2.10.6/moment.min.js"/}
// {@bundleScript bundle="vendor" src="//cdn.bootcss.com/lodash.js/3.10.1/lodash.min.js"/}
// {@bundleScript bundle="vendor" src="//res.wx.qq.com/open/js/jweixin-1.1.0.js"/}
//
// {@bundleScript bundle="bundle" src="/vendor/jquery.hammer.js"/}
// {@bundleScript bundle="bundle" src="/global/javascripts/jquery.mobile.custom.min.js"/}
// {@bundleScript bundle="bundle" src="//cdn.bootcss.com/dustjs-helpers/1.7.3/dust-helpers.min.js"/}
//
// {@bundleDepends bundle="bundle" on="vendor"/}
// {@loadBundle bundle="bundle"/}
// {@script dependsOn="bundle"}
// {/script}

dust.helpers.bundleScript = function(chunk, context, bodies, params) {
  var graph = getGraph(context);
  var bundle = dust.helpers.tap(params.bundle, chunk, context);
  var src;
  if ( !params.src ) {
    src = JSON.parse(dust.helpers.tap(bodies.block, chunk, context));

  } else {
    src = dust.helpers.tap(params.src, chunk, context);
  }
  //TODO check if src is array
  var node = graph[bundle] = graph[bundle] || new DepGraphNode(bundle, []);
  if ( Array.isArray(src)) {
    node.data = node.data.concat(src);
  } else {
      node.data.push(src);
  }

  return chunk.write("");
}

dust.helpers.bundleDepends = function(chunk, context, bodies, params) {
  var graph = getGraph(context);
  var bundle = dust.helpers.tap(params.bundle, chunk, context);
  var dependsOn = dust.helpers.tap(params.on, chunk, context);
  var newcontext = context.push({__deps:[]});
  var body = dust.helpers.tap(bodies.block, chunk, newcontext);
  if ( !bundle || !(dependsOn || newcontext.stack.head.__deps.length) ) {
    throw "bundleDepends helper has to have 'bundle' parameter at dependencies defined either by 'on' parameter or @dependsOn helper";
  }
  var deps = newcontext.stack.head.__deps;
  if ( dependsOn) {
    deps.push(dependsOn);
  }
  bundle = graph[bundle] = graph[bundle] || new DepGraphNode(bundle, []);
  for ( var i = 0; i < deps.length; i++ ) {
    var dependsOn = deps[i];
    dependsOn = graph[dependsOn] = graph[dependsOn] || new DepGraphNode(dependsOn, []);
    bundle.addOut(dependsOn);
  }
  return chunk.write("");
}

dust.helpers.dependsOn = function(chunk, context, bodies, params) {
  if ( !context.stack.head.__deps ) {
    throw "dependsOn can only be called within bundleDepends or script tag";
  }
  var bundle = dust.helpers.tap(params.bundle, chunk, context);
  if ( !bundle ) {
    throw "dependsOn has to contain 'bundle' parameter";
  }

  context.stack.head.__deps.push(bundle);
  return chunk.write("");
}

dust.helpers.loadBundle = function(chunk, context, bodies, params) {
  // loadBundles has to be rendered, so add its dependencies to renderables
  var bundle = dust.helpers.tap(params.bundle, chunk, context);
  var scriptDep = getScriptDepGlobal(context);
  scriptDep.__renderable = scriptDep.__renderable || [];
  scriptDep.__renderable.push(bundle);
  return chunk.write("");
}

dust.helpers.scriptjs = function(chunk, context, bodies, params) {
  var dependsOn = dust.helpers.tap(params.dependsOn, chunk, context);
  // scripts has to be rendered, so add its dependencies to renderables
  var scriptDep = getScriptDepGlobal(context);
  scriptDep.__renderable = scriptDep.__renderable || [];
  if ( scriptDep.__id === undefined ) {
    scriptDep.__id = 1;
  }
  var scriptId = "__script__"+(scriptDep.__id++);
  scriptDep.__renderable.push(scriptId);
  var graph = getGraph(context);
  var newcontext = context.push({__deps:[]});
  var body = dust.helpers.tap(bodies.block, chunk, newcontext);
  var node = graph[scriptId] = graph[scriptId] || new DepGraphNode(scriptId, {type:"script", body});

  var deps = newcontext.stack.head.__deps;
  if ( dependsOn ) {
    deps.push(dependsOn);
  }
  if ( deps.length ) {
    for ( var i = 0; i < deps.length; i++ ) {
      var dependsOn = deps[i];
      debug("script dependency added", scriptId, dependsOn);
      dependsOn = graph[dependsOn] = graph[dependsOn] || new DepGraphNode(dependsOn, []);
      node.addOut(dependsOn);
    }
  }
  return chunk.write("");
}
function getScriptDepGlobal(context) {
  var global = context.global[globalKey] = context.global[globalKey] || {};
  return global;
}
function getGraph(context) {
  var global = getScriptDepGlobal(context);
  var graph = global.graph = global.graph || {};
  return graph;
}
dust.helpers.renderScript = function(chunk, context, bodies, params) {
  var scriptDep = getScriptDepGlobal(context);
  var graph = getGraph(context);
  // debug("rendering script");
  if ( !(scriptDep.__renderable && scriptDep.__renderable.length) ) {
    // debug("non renderable");
      return chunk.write("");
  }
  var visited = {}; // this can help cache the previously visited nodes, so we dont end up going through them again
  return chunk.map((chunk) => {
    // debug("we have reached here");
    chunk.write("<script>");
    for ( var i = 0; i < scriptDep.__renderable.length; i++ ) {
      // debug("rendering", scriptDep.__renderable[i]);
      graph[scriptDep.__renderable[i]].breadth('out', (path)=>{
        // TODO, flatten the paths
        for ( var i = path.length-1; i >= 0; i-- ) {
          // if dep has length, then print ready
          var el = path[i];
          // debug("rendering", path[i]);
          if ( el[1].length ) {
            renderReadyScript(chunk, el);
          } else if ( el[0].data.type === "script" ){
            renderScript(chunk, el);
          } else {
            renderModuleLoader(chunk, el);
          }
        }
        // chunk.map
        // debug("path", path);
      },visited);
    }
    chunk.write("</script>");
    return chunk.end();
  });
}

function renderScript(chunk, el) {
  chunk.write(el[0].data.body);
}

function renderModuleLoader(chunk, el) {
  chunk.write("$script([");
  chunk.write(el[0].data.map((el)=>{return '"'+el+'"'}).join(","));
  chunk.write('],"'+el[0].id+'"');
  chunk.write(");")
}

function renderReadyScript(chunk, el) {
  chunk.write("$script.ready(");
  if ( el[1].length > 1 ) {chunk.write("[");}
  chunk.write(el[1].map((el)=>{return '"'+el+'"'}).join(","));
  if ( el[1].length > 1) {chunk.write("]");}
  chunk.write(",function(){")
  if ( el[0].data.type === "script" ){
    renderScript(chunk, el);
  } else {
    renderModuleLoader(chunk, el);
  }
  chunk.write("});");
}

export * from "dustjs-linkedin";
