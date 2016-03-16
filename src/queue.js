import {default as debugLog} from "debug";

const debug = debugLog("dust-scriptjs-helper:queue");

export default class Queue {
  constructor(size) {
    if ( size === undefined ) {
      size = 3;
    }
    this.data = [];
    this.data.length = size;
    this.internalLength = 0;
    this.begin = 0;
    this.end = 0;
    this._length = 0;
  }
  enqueue(el) {
    debug("enqueuing el", el);
    if ( Array.isArray(el) ) {
      for ( var i = 0; i < el.length; i++ ) {
        this.enqueue(el[i]);
      }
      // optimise later
      return;
    }
    this._length++;
    debug("internal size grew to ", this._length);
    if ( this._length >= this.data.length ) {
      debug("internal size grew to ", this._length, "grew beyond internal structure size", this.data.length);
      this.data.length = Math.floor((this.data.length+1) *1.3);
      debug("growing internal structure to ", this.data.length);
    }
    if (this.end >= this.internalLength ) {
      this.internalLength = this.end+1;
    }
    this.data[this.end] = el;
    this.end++;
    if ( this.end >= this.data.length ) {
      this.end = 0;
    }
    debug("enqueue now the data looks like", this.data, "begins at", this.begin, "ends at", this.end, "and length is", this._length);
  }
  dequeue() {
    if ( this._length === 0 ) {
      return undefined;
    }
    var data = this.data[this.begin];
    this._length--;
    debug("dequeued", this.begin, data);
    this.begin++;
    if ( this.begin === this.end ) {
      this.begin = this.end;
      debug("dequeue now the data looks like", this.data, "begins at", this.begin, "ends at", this.end, "and length is", this._length);
      return data;
    }
    if ( this.begin >= this.internalLength ) { // cause it might have grown
      this.begin = 0;
    }
    // debug("dequeuing: now the data looks like", this.data, "and length is", this._length, "and it starts from", this.begin);
    debug("dequeue now the data looks like", this.data, "begins at", this.begin, "ends at", this.end, "and length is", this._length);
    return data;
  }
  isEmpty() {
    return this.length === 0;
  }
  get length() {
    return this._length;
  }
}
