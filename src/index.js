import {default as DepGraphNode} from "./graph";
import {default as debugLog} from "debug";
import {default as dust} from "dustjs-helpers";

const log = debugLog("dust-scriptjs-helper:index");
const globalKey = "scriptsBlock"
const globalKeyBundleless = "scriptsBlockBundleless"

function logWithLevel(level, ...args) {
  dust.log(args.join(" "), level);
  log(...args);
}

function debug(...args) {
  logWithLevel("DEBUG", ...args);
}

function error(chunk, helper, ...args) {
  var newargs = ["@"+helper+":"].concat(args);
  logWithLevel("ERROR", ...newargs)
  chunk.setError(args.join(" "));
}

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
  var bundle = context.resolve(params.bundle);
  var src;
  if ( !params.src ) {
    src = context.resolve(bodies.block);
    if ( !src || !src.length) {
      error(chunk, "bundleScript", "Either src or a body has to be provided");
      return chunk;
    }
    try {
      src = JSON.parse(src);
    } catch(e) {
      error(chunk, "bundleScript", "src has to be a valid json array");
      return chunk;
    }
    if ( !Array.isArray(src)) {
      error(chunk, "bundleScript", "body has to be an array");
      return chunk;
    }
  } else {
    src = context.resolve(params.src);
  }
  //TODO check if src is array
  var node = graph[bundle] = graph[bundle] || new DepGraphNode(bundle, []);
  if ( Array.isArray(src)) {
    node.data = node.data.concat(src);
  } else {
      node.data.push(src);
  }

  return chunk;
}

dust.helpers.bundleDepends = function(chunk, context, bodies, params) {
  var graph = getGraph(context);
  var bundle = context.resolve(params.bundle);
  var dependsOn = context.resolve(params.on);
  var newcontext = context.push({__deps:[]});
  if ( bodies.block) {
    var body = newcontext.resolve(bodies.block);
  }
  if ( !bundle || !(dependsOn || newcontext.stack.head.__deps.length) ) {
    error(chunk, "bundleDepends", "bundleDepends helper has to have 'bundle' parameter at dependencies defined either by 'on' parameter or @dependsOn helper");
    return chunk;
  }
  var deps = newcontext.stack.head.__deps;
  if ( dependsOn) {
    deps.push(dependsOn);
  }
  bundle = graph[bundle] = graph[bundle] || new DepGraphNode(bundle, []);
  var tDependsOn;
  for ( var i = 0; i < deps.length; i++ ) {
    tDependsOn = deps[i];
    tDependsOn = graph[tDependsOn] = graph[tDependsOn] || new DepGraphNode(tDependsOn, []);
    bundle.addOut(tDependsOn);
  }
  return chunk;
}

dust.helpers.dependsOn = function(chunk, context, bodies, params) {
  if ( !context.stack.head.__deps ) {
    error(chunk, "dependsOn", "dependsOn can only be called within bundleDepends or script tag");
    return chunk;
  }
  if (!params.bundle) {
    error(chunk, "dependsOn", "dependsOn has to contain 'bundle' parameter");
    return chunk;
  }
  var bundle = context.resolve(params.bundle);

  context.stack.head.__deps.push(bundle);
  return chunk;
}

dust.helpers.loadBundle = function(chunk, context, bodies, params) {
  // loadBundles has to be rendered, so add its dependencies to renderables
  var bundle = context.resolve(params.bundle);
  var scriptDep = getScriptDepGlobal(context);
  scriptDep.__renderable = scriptDep.__renderable || [];
  scriptDep.__renderable.push(bundle);
  return chunk;
}

dust.helpers.scriptjs = function(chunk, context, bodies, params) {
  var dependsOn = context.resolve(params.dependsOn);
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
  var body = newcontext.resolve(bodies.block);
  var node = graph[scriptId] = graph[scriptId] || new DepGraphNode(scriptId, {type:"script", body});

  var deps = newcontext.stack.head.__deps;
  if ( dependsOn ) {
    deps.push(dependsOn);
  }
  if ( deps.length ) {
    var tDependsOn;
    for ( var i = 0; i < deps.length; i++ ) {
      tDependsOn = deps[i];
      debug("script dependency added", scriptId, tDependsOn);
      tDependsOn = graph[tDependsOn] = graph[tDependsOn] || new DepGraphNode(tDependsOn, []);
      node.addOut(tDependsOn);
    }
  }
  return chunk;
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
      return chunk;
  }
  return chunk.map((chunk) => {
    function pathRender(path){
      // TODO, flatten the paths
      for ( var i = path.length-1; i >= 0; i-- ) {
        // if dep has length, then print ready
        var el = path[i];
        // debug("rendering", path[i]);
        if ( el[1].length ) { // it is dependent on another script, flatten them?
          renderReadyScript(chunk, el);
        } else if ( el[0].data.type === "script" ){
          renderScript(chunk, el);
        } else {
          renderModuleLoader(chunk, el);
        }
      }
      // chunk.map
      // debug("path", path);
    }
    // debug("we have reached here");
    chunk.write("<script>");
      // debug("rendering", scriptDep.__renderable[i]);
      // reverse the __renderable map, since pathRender does it in reverse
    var nodes = [];
    for ( var i = scriptDep.__renderable.length-1; i >= 0; i-- ) {
      nodes.push(graph[scriptDep.__renderable[i]]);
    }
    DepGraphNode.breadth(nodes, 'out', pathRender);

    // graph[scriptDep.__renderable[i]].breadth('out', pathRender ,visited);
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
