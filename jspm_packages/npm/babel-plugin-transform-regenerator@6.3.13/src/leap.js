/* */ 
"format cjs";
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

import assert from "assert";
import * as t from "babel-types";
import { inherits } from "util";

function Entry() {
  assert.ok(this instanceof Entry);
}

function FunctionEntry(returnLoc) {
  Entry.call(this);
  t.assertLiteral(returnLoc);
  this.returnLoc = returnLoc;
}

inherits(FunctionEntry, Entry);
exports.FunctionEntry = FunctionEntry;

function LoopEntry(breakLoc, continueLoc, label) {
  Entry.call(this);

  t.assertLiteral(breakLoc);
  t.assertLiteral(continueLoc);

  if (label) {
    t.assertIdentifier(label);
  } else {
    label = null;
  }

  this.breakLoc = breakLoc;
  this.continueLoc = continueLoc;
  this.label = label;
}

inherits(LoopEntry, Entry);
exports.LoopEntry = LoopEntry;

function SwitchEntry(breakLoc) {
  Entry.call(this);
  t.assertLiteral(breakLoc);
  this.breakLoc = breakLoc;
}

inherits(SwitchEntry, Entry);
exports.SwitchEntry = SwitchEntry;

function TryEntry(firstLoc, catchEntry, finallyEntry) {
  Entry.call(this);

  t.assertLiteral(firstLoc);

  if (catchEntry) {
    assert.ok(catchEntry instanceof CatchEntry);
  } else {
    catchEntry = null;
  }

  if (finallyEntry) {
    assert.ok(finallyEntry instanceof FinallyEntry);
  } else {
    finallyEntry = null;
  }

  // Have to have one or the other (or both).
  assert.ok(catchEntry || finallyEntry);

  this.firstLoc = firstLoc;
  this.catchEntry = catchEntry;
  this.finallyEntry = finallyEntry;
}

inherits(TryEntry, Entry);
exports.TryEntry = TryEntry;

function CatchEntry(firstLoc, paramId) {
  Entry.call(this);

  t.assertLiteral(firstLoc);
  t.assertIdentifier(paramId);

  this.firstLoc = firstLoc;
  this.paramId = paramId;
}

inherits(CatchEntry, Entry);
exports.CatchEntry = CatchEntry;

function FinallyEntry(firstLoc, afterLoc) {
  Entry.call(this);
  t.assertLiteral(firstLoc);
  t.assertLiteral(afterLoc);
  this.firstLoc = firstLoc;
  this.afterLoc = afterLoc;
}

inherits(FinallyEntry, Entry);
exports.FinallyEntry = FinallyEntry;

function LabeledEntry(breakLoc, label) {
  Entry.call(this);

  t.assertLiteral(breakLoc);
  t.assertIdentifier(label);

  this.breakLoc = breakLoc;
  this.label = label;
}

inherits(LabeledEntry, Entry);
exports.LabeledEntry = LabeledEntry;

function LeapManager(emitter) {
  assert.ok(this instanceof LeapManager);

  let Emitter = require("./emit").Emitter;
  assert.ok(emitter instanceof Emitter);

  this.emitter = emitter;
  this.entryStack = [new FunctionEntry(emitter.finalLoc)];
}

let LMp = LeapManager.prototype;
exports.LeapManager = LeapManager;

LMp.withEntry = function(entry, callback) {
  assert.ok(entry instanceof Entry);
  this.entryStack.push(entry);
  try {
    callback.call(this.emitter);
  } finally {
    let popped = this.entryStack.pop();
    assert.strictEqual(popped, entry);
  }
};

LMp._findLeapLocation = function(property, label) {
  for (let i = this.entryStack.length - 1; i >= 0; --i) {
    let entry = this.entryStack[i];
    let loc = entry[property];
    if (loc) {
      if (label) {
        if (entry.label &&
            entry.label.name === label.name) {
          return loc;
        }
      } else if (entry instanceof LabeledEntry) {
        // Ignore LabeledEntry entries unless we are actually breaking to
        // a label.
      } else {
        return loc;
      }
    }
  }

  return null;
};

LMp.getBreakLoc = function(label) {
  return this._findLeapLocation("breakLoc", label);
};

LMp.getContinueLoc = function(label) {
  return this._findLeapLocation("continueLoc", label);
};
