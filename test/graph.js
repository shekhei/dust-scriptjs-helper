import {default as chai, expect} from "chai";
import {default as asPromised} from "chai-as-promised"
import {default as GraphNode} from "../src/graph.js"
chai.use(asPromised);


describe("Graph", function() {
  it('shouldnt walk extra nodes', function(done){
    let node = new GraphNode("1", "abc");
    node.breadth('out', (path)=>{
      expect(path.length).to.eql(1);
      expect(path[0][0]).to.eql(node);
    })
    node.breadth('in', (path)=>{
      expect(path.length).to.eql(1);
      expect(path[0][0]).to.eql(node);
    })
    done();
  })
  it('circular dependencies shouldnt fail', function(done){
    let node = new GraphNode("1", "abc");
    let node2 = new GraphNode("2", "abd");
    node.addOut(node2);
    node2.addOut(node);
    node.breadth('out', (path)=>{
      expect(path.length).to.eql(2);
      expect(path[0][0]).to.eql(node);
      expect(path[0][1]).to.eql(["2"]);
      expect(path[1][0]).to.eql(node2);
      expect(path[1][1]).to.eql(["1"]);
    })
    node.breadth('in', (path)=>{
      expect(path.length).to.eql(2);
      expect(path[0][0]).to.eql(node);
      expect(path[1][0]).to.eql(node2);
    })
    node2.breadth('out', (path)=>{
      expect(path.length).to.eql(2);
      expect(path[0][0]).to.eql(node2);
      expect(path[1][0]).to.eql(node);
    })
    node2.breadth('in', (path)=>{
      expect(path.length).to.eql(2);
      expect(path[0][0]).to.eql(node2);
      expect(path[1][0]).to.eql(node);
    })
    done();
  })
  it('a slightly more complex case', function(done){
    let node = new GraphNode("1", "abc");
    let node2 = new GraphNode("2", "abd");
    let node3 = new GraphNode("3", "abd");
    let node4 = new GraphNode("4", "abd");
    let node5 = new GraphNode("5", "abd");

    // 5 --> 1 --> 2 --> 4
    //       | --> 3 ----^
    node5.addOut(node);
    node.addOut(node2);
    node.addOut(node3);
    node2.addOut(node4);
    node3.addOut(node4);
    node.breadth('out', (path)=>{
      expect(path.length).to.eql(4);
      expect(path[0][0]).to.eql(node);
      expect(path[1][0]).to.eql(node2);
      expect(path[2][0]).to.eql(node3);
      expect(path[3][0]).to.eql(node4);
    })
    done();
  })
  it('when provided with visited list, shouldnt end up walking again', function(done){
    let node = new GraphNode("1", "abc");
    let node2 = new GraphNode("2", "abd");
    let node3 = new GraphNode("3", "abd");
    let node4 = new GraphNode("4", "abd");
    let node5 = new GraphNode("5", "abd");

    // 5 --> 1 --> 2 --> 4
    //       | --> 3 ----^
    node5.addOut(node);
    node.addOut(node2);
    node.addOut(node3);
    node2.addOut(node4);
    node3.addOut(node4);
    var visited = {};
    node2.breadth('in', (path)=>{
      expect(path.length).to.eql(3);
      expect(path[0][0]).to.eql(node2);
      expect(path[1][0]).to.eql(node);
      expect(path[2][0]).to.eql(node5);
    }, visited)
    node4.breadth('in', (path)=>{
      expect(path.length).to.eql(2);
      expect(path[0][0]).to.eql(node4);
      expect(path[1][0]).to.eql(node3);
    }, visited)
    done();
  })
});
