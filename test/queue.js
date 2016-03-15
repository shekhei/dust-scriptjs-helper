import {default as chai, expect} from "chai";
import {default as asPromised} from "chai-as-promised"
import {default as Queue} from "../src/queue.js"
chai.use(asPromised);


describe("Queue", function() {
  it('should support basic opertions', function(done){
    var queue = new Queue();
    expect(queue.isEmpty()).to.be.true;
    queue.enqueue(1);
    expect(queue.length).to.eql(1);
    var val = queue.dequeue();
    expect(val).to.eql(1);
    done();
  })
  it('should support basic opertions', function(done){
    var arr = [1,2,3,4,5,6,7,8,9,9,9,9,9];
    var queue = new Queue();
    expect(queue.isEmpty()).to.be.true;
    for ( var i = 0; i < arr.length; i++ ) {
      queue.enqueue(arr[i]);
    }
    expect(queue.length).to.eql(arr.length);
    for ( var i = 0; i < arr.length; i++ ) {
      expect(queue.dequeue()).to.eql(arr[i]);
    }
    expect(queue.isEmpty()).to.be.true;
    done();
  })
  it('should support basic opertions in a different way', function(done){
    var arr = [1,2,3,4,5,6,7,8,9,9,9,9,9];
    var queue = new Queue();
    expect(queue.isEmpty()).to.be.true;
    for ( var i = 0; i < arr.length; i++ ) {
      queue.enqueue(arr[i]);
      expect(queue.length).to.eql(1);
      expect(queue.dequeue()).to.eql(arr[i]);
      expect(queue.length).to.eql(0);
    }

    expect(queue.isEmpty()).to.be.true;
    done();
  })

  it('should support slightly more complex case', function(done){
    var queue = new Queue();
    expect(queue.isEmpty()).to.be.true;
    queue.enqueue(1);
    expect(queue.dequeue()).to.eql(1);
    queue.enqueue(2);
    queue.enqueue(3);
    expect(queue.dequeue()).to.eql(2);
    queue.enqueue(4);
    expect(queue.dequeue()).to.eql(3);
    expect(queue.dequeue()).to.eql(4);

    expect(queue.isEmpty()).to.be.true;
    done();
  })

  it('should support enqueuing by an array', function(done){
    var queue = new Queue();
    expect(queue.isEmpty()).to.be.true;
    queue.enqueue(1);
    expect(queue.dequeue()).to.eql(1);
    queue.enqueue([2,3]);
    expect(queue.dequeue()).to.eql(2);
    queue.enqueue(4);
    expect(queue.dequeue()).to.eql(3);
    expect(queue.dequeue()).to.eql(4);

    expect(queue.isEmpty()).to.be.true;
    done();
  })
  it('dequeue beyond more than enqueued should just return undefined and operation as normal', function(done){
    var queue = new Queue();
    expect(queue.isEmpty()).to.be.true;
    expect(queue.dequeue()).to.eql(undefined);
    expect(queue.isEmpty()).to.be.true;
    expect(queue.dequeue()).to.eql(undefined);
    expect(queue.isEmpty()).to.be.true;
    queue.enqueue(1)
    expect(queue.isEmpty()).to.be.false
    expect(queue.length).to.eql(1);;
    expect(queue.dequeue()).to.eql(1);
    done();
  })
  // it('should output script if it is loaded', function(){
  //   let template = '{@bundleScript bundle="vendor" src="one.js"/}{@loadBundle bundle="vendor"/}{@renderScript /}';
  //   let output = '<script>$script(["one.js"],"vendor");</script>';
  //   return expect(matcher(template, {}, output)).to.eventually.equal(output);
  // })
});
