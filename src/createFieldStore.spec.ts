"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/of";
import "rxjs/add/operator/first";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/observeOn";
import "rxjs/add/operator/subscribeOn";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/toPromise";

import { createFieldStore } from "./createFieldStore";
import { fields } from "./index";

describe("createFieldStore", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof createFieldStore).toBe("function"));
  }); //    Sanity checks

  describe("Events", () => {
    const testEmptyEvent = (name: string) =>
      describe(name + " event", () => {
        const store = createFieldStore(fields.string("Name"));
        const event: (() => void) = store[name];
        const event$: Observable<void> = store[name + "$"];
        it(`${name}() should emit an event through ${name}$`, () => {
          const promise = event$.first().timeout(40).toPromise();
          event();
          return promise;
        });
      });

    const testTypedEvent = <T>(name: string, value: T) =>
      describe(name + " event", () => {
        const store = createFieldStore(fields.string("Name"));
        const event: ((t: T) => void) = store[name];
        const event$: Observable<T> = store[name + "$"];
        it(`${name}() should emit an event through ${name}$`, () => {
          const promise = event$.first().timeout(40).toPromise();
          event(value);
          return promise.then(v => expect(v).toBe(value));
        });
      });

    testEmptyEvent("blur");
    testEmptyEvent("focus");
    testEmptyEvent("reset");
    testTypedEvent("update", "hello");
  }); //    Test that events are connected to corresponding functions

  describe("config$", () => {
    it("initially, config$ should have a value", () => {
      const store = createFieldStore(fields.string("Name"));
      return store.config$
        .first().timeout(40).toPromise()
        .then(config => expect(config).toBeDefined());
    });
  }); //    config

  describe("value$", () => {
    it("initially, value$ should have the default value", () => {
      const store = createFieldStore(fields.string("Name", { defaultValue: "hello" }));
      return store.value$
        .first().timeout(40).toPromise()
        .then(value => expect(value).toBe("hello"));
    });
  }); //    value$

  describe("isDirty$", () => {
    it("initially, isDirty$ should have value false", () => {
      const store = createFieldStore(fields.string("Name"));
      return store.isDirty$
        .first().timeout(40).toPromise()
        .then(value => expect(value).toBe(false));
    });
  }); //    isDirty$

  describe("hasFocus$", () => {
    it("initially, hasFocus$ should have value false", () => {
      const store = createFieldStore(fields.string("Name"));
      return store.hasFocus$
        .first().timeout(40).toPromise()
        .then(value => expect(value).toBe(false));
    });
  }); //    hasFocus$

  describe("isTouched$", () => {
    it("initially, isTouched$ should have value false", () => {
      const store = createFieldStore(fields.string("Name"));
      return store.isTouched$
        .first().timeout(40).toPromise()
        .then(value => expect(value).toBe(false));
    });
  }); //    isTouched$

  // describe("state$", () => {
  //   it("initially, state$ should have the expected value", () => {
  //     const store = createFieldStore(fields.string("Name"));
  //     return store.state$
  //       .first().timeout(40).toPromise()
  //       .then(value => expect(value).toEqual({}));
  //   });
  // }); //    state$
}); //    createFieldStore
