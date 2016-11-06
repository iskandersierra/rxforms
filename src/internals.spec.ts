"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/interval";
import "rxjs/add/observable/of";
import "rxjs/add/operator/first";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/toArray";
import "rxjs/add/operator/toPromise";

import { applyEffects, connectLastOf, emptyEvent, letValue, typedEvent } from "./internals";

describe("applyEffects", () => {
  const store = {};

  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof applyEffects).toBe("function"));
  }); //    Sanity checks

  describe("Given no extra effects", () => {
    it("it should not fail",
      () => expect(() => applyEffects(store)).not.toThrow());
  }); //    Given no extra effects

  describe("Given some extra effects", () => {
    it("it should not fail",
      () => expect(() => applyEffects(store, jest.fn(), jest.fn())).not.toThrow());
    it("it should pass the store to every effect", () => {
      const effect1 = jest.fn();
      const effect2 = jest.fn();
      applyEffects(store, effect1, effect2);
      expect(effect1).toBeCalledWith(store);
      expect(effect2).toBeCalledWith(store);
    });
  }); //    Given no extra effects
}); //    createMessagesStore

describe("emptyEvent", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof emptyEvent).toBe("function"));
  }); //    Sanity checks

  describe("Given an empty event", () => {
    describe("When the event is inspected", () => {
      const [obs, emit] = emptyEvent();
      it("it should have an observable",
        () => expect(typeof obs).toBe("object"));
      it("it should have an emitter",
        () => expect(typeof emit).toBe("function"));
    }); //    When the event is inspected

    describe("When the event is emitted", () => {
      const [obs, emit] = emptyEvent();
      it("it should be emitted through the observable", () => {
        const promise = obs.first().timeout(10).toPromise();
        emit();
        return promise;
      });
    }); //    When an event is emitted
  }); //    Given an empty event
}); //    createMessagesStore

describe("typedEvent", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof typedEvent).toBe("function"));
  }); //    Sanity checks

  describe("Given an typed event", () => {
    describe("When the event is inspected", () => {
      const [obs, emit] = typedEvent<string>();
      it("it should have an observable",
        () => expect(typeof obs).toBe("object"));
      it("it should have an emitter",
        () => expect(typeof emit).toBe("function"));
    }); //    When the event is inspected

    describe("When the event is emitted", () => {
      const [obs, emit] = typedEvent();
      it("it should be emitted through the observable", () => {
        const promise = obs.first().timeout(10).toPromise();
        emit("hello");
        return promise.then(val => expect(val).toBe("hello"));
      });
    }); //    When an event is emitted
  }); //    Given an typed event
}); //    createMessagesStore

describe("connectLastOf", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof connectLastOf).toBe("function"));
  }); //    Sanity checks

  describe("Given an typed event", () => {
    describe("When the connectable is inspected", () => {
      const [obs, start] = connectLastOf(Observable.of("hello"));
      it("obs should be an observable",
        () => expect(typeof obs.subscribe).toBe("function"));
      it("start should be a function",
        () => expect(typeof start).toBe("function"));
    }); //    When the event is inspected

    describe("When the connectable is not started", () => {
      const [obs, start] = connectLastOf(Observable.of("hello"));
      it("it should not emit any value", () => {
        const promise = obs.takeUntil(Observable.interval(40)).toArray().toPromise();
        return promise.then(values => expect(values).toEqual(["hello"]));
      });
    }); //    When an event is emitted

    describe("When the connectable is started", () => {
      const [obs, start] = connectLastOf(Observable.of("hello"));
      it("it should not emit any value", () => {
        const promise = obs.takeUntil(Observable.interval(40)).toArray().toPromise();
        start();
        return promise.then(values => expect(values).toEqual(["hello!"]));
      });
    }); //    When an event is emitted
  }); //    Given an typed event
}); //    createMessagesStore

describe("letValue", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof letValue).toBe("function"));
  }); //    Sanity checks

  describe("When letValue is called", () => {
      it("it should call the given function with given value", () => {
        const fn = jest.fn();
        const result = letValue("hello", fn);
        expect(fn).toHaveBeenCalledWith("hello");
      });

      it("it should return the value given by the function", () => {
        const fn = jest.fn(() => "world");
        const result = letValue("hello", fn);
        expect(result).toBe("world");
      });
  });    // When letValue is called

});    // letValue
