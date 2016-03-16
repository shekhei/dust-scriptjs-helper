import {default as Queue } from "./queue";
import {default as debugLog} from "debug";

const debug = debugLog("dust-scriptjs-helper:graph");
export default class DepGraphNode {
  // static id() {
  //   if ( DepGraphNode.id === undefined ) {
  //     DepGraphNode.id = 0;
  //   }
  //   return ++DepGraphNode.id;
  // }
  // please ensure id is unique, this is not going to be checked right now
  constructor(id, data) {
    // gets depended on
    this.in = [];
    // depends on
    this.out = [];
    this.data = data;
    this._id = id;
  }
  addOut(node) {
    this.out.push(node);
    node.in.push(this);
  }
  get id() {
    return this._id;
  }
  breadth(direction, fn, visited) {
    return DepGraphNode.breadth([this], direction, fn, visited);
  }
  static breadth(nodes, direction, fn, visited) {
    debug('starting breadth');
    if ( direction !== 'out' && direction !== 'in') {
      throw new Error("direction can only be in or out");
    }
    var queue = new Queue();
    if ( visited === undefined ) {
      visited = {}; // using a map, easier to handle for all the ids
    }
    for ( var i = 0; i < nodes.length; i++ ) {
      var node = nodes[i];
      debug("enqueuing", node._id, visited);
      if ( visited[node._id] !== true ) {
        queue.enqueue(node);
        visited[node._id] = true;
      }
    }
    var path = []; // this is to be used for building the script, lets hope the graphs doesnt get too large :P
    while ( !queue.isEmpty() ) {

      var self = queue.dequeue();
      debug("dequeuing", self.id, visited);
      // either in or out for direction
      // $script(['deps'], ()=> {buildBody()})
      var deps = [];
      var children = self[direction];
      // debug("traversing breadth", self.id, children, direction);
      for ( var i = 0; i < children.length; i++ ) {
        var child = children[i];
        deps.push(child.id)
        if ( visited[child.id] !== true ) {
          visited[child.id] = true;
          debug("enqueuing", child.id, visited);
          queue.enqueue(child);
        }
      }
      path.push([self, deps]);
    }
    fn(path);
  }
}
