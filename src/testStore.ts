"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/interval";
import "rxjs/add/observable/of";
import "rxjs/add/operator/first";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/last";
import "rxjs/add/operator/observeOn";
import "rxjs/add/operator/skip";
import "rxjs/add/operator/subscribeOn";
import "rxjs/add/operator/take";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/toPromise";
import { createFieldStore } from "./createFieldStore";
import {
  fields, FormFieldStore, FormFieldState, FormFieldOptions, CommonOptions,
} from "./index";

export interface StoreExpectation<TStore, TState> {
  message: string;
  test?: (state: TState, store: TStore) => any;
}

export interface StoreStateExpectation<TStore, TState, TValue> {
  message: string;
  test?: (value: TValue, state: TState, store: TStore) => any;
}

export const testStore = (
  describe: (msg: string, runner: () => void) => void,
  it: (msg: string, runner: () => any | Promise<any>) => void,
) => <TStore, TState>(
  opts: {
    create: () => TStore;
    extract: (store: TStore) => Observable<TState>;
    take: ("first" | "last" | number);
    tests: StoreExpectation<TStore, TState>[];
    timeout?: number;
    timeoutMode?: "error" | "stop";
    presetup?: (store: TStore) => void;
    setup?: (store: TStore) => void;
  },
  ...messages: string[]) => {
    const {
      create, extract, take,
      tests,
      timeout = undefined,
      timeoutMode = "error",
      presetup = undefined,
      setup = undefined, } = opts;
    const runTest = () => {
      tests.forEach(exp => {
        it(exp.message, () => {
          const store = create();
          let state$ = extract(store);
          if (presetup) { presetup(store); }
          if (timeout) {
            if (timeoutMode === "stop") {
              state$ = state$.takeUntil(Observable.interval(timeout));
            } else {
              state$ = state$.timeout(timeout);
            }
          }
          switch (take) {
            case "first": state$ = state$.first(); break;
            case "last": state$ = state$.last(); break;
            default:
              if (take >= 0) {
                state$ = state$.skip(take).first(); break;
              }
              break;
          }
          let promise = state$.toPromise();
          if (setup) { setup(store); }
          if (exp.test) {
            promise = promise.then(state => exp.test(state, store));
          }
          return promise;
        });
      });
    };
    const startTest = (index: number) => {
      if (!messages || index >= messages.length) {
        runTest();
      } else {
        describe(messages[index], () => {
          startTest(index + 1);
        });
      }
    };
    startTest(0);
  };


export const testStoreState = (
  describe: (msg: string, runner: () => void) => void,
  it: (msg: string, runner: () => any | Promise<any>) => void,
) => <TStore, TState>(
  opts: {
    create: () => TStore;
    extract: (store: TStore) => Observable<TState>;
    take: ("first" | "last" | number);
    tests: {
      [name: string]: StoreStateExpectation<TStore, TState, any>
    };
    timeout?: number;
    timeoutMode?: "error" | "stop";
    presetup?: (store: TStore) => void;
    setup?: (store: TStore) => void;
  },
  ...messages: string[]) => {
    const {
      create,
      extract,
      take,
      tests,
      timeout = undefined,
      timeoutMode = "error",
      presetup = undefined,
      setup = undefined,
    } = opts;
    const runTest = () => {
      Object.keys(tests).forEach(key => {
        const exp = tests[key];
        it(exp.message, () => {
          const store = create();
          let state$ = extract(store);
          if (presetup) { presetup(store); }
          if (timeout) {
            if (timeoutMode === "stop") {
              state$ = state$.takeUntil(Observable.interval(timeout));
            } else {
              state$ = state$.timeout(timeout);
            }
          }
          switch (take) {
            case "first": state$ = state$.first(); break;
            case "last": state$ = state$.last(); break;
            default:
              if (take >= 0) {
                state$ = state$.skip(take).first(); break;
              }
              break;
          }
          let promise = state$.toPromise();
          if (setup) { setup(store); }
          if (exp.test) {
            promise = promise.then(state => exp.test(state[key], state, store));
          }
          return promise;
        });
      });
    };
    const startTest = (index: number) => {
      if (!messages || index >= messages.length) {
        runTest();
      } else {
        describe(messages[index], () => {
          startTest(index + 1);
        });
      }
    };
    startTest(0);
  };

export const testStoreJest = testStore(describe, it);
export const testStoreStateJest = testStoreState(describe, it);

export const fieldStoreTesting = {
  testEmptyEvent: (name: string) => testStoreJest({
    create: () => createFieldStore(fields.string("Name")),
    extract: store => store[name + "$"] as Observable<void>,
    take: "first",
    tests: [{
      message: `${name}() should emit an event through ${name}$`,
    }],
    timeoutMode: "error",
    setup: store => store[name](),
  },
    `Test event ${name}`
  ),

  testTypedEvent: <T>(name: string, value: T) => testStoreJest({
    create: () => createFieldStore(fields.string("Name")),
    extract: store => store[name + "$"] as Observable<T>,
    take: "first",
    tests: [{
      message: `${name}(${value}) should emit an event through ${name}$ with given value`,
      test: state => { expect(state).toEqual(value); },
    }],
    timeoutMode: "error",
    setup: store => store[name](value),
  },
    `Test event ${name}`
  ),

  testState: (
    opts: {
      tests: {
        [name: string]: {
          test: any |
          ((store: FormFieldStore) => any) |
          ((state: FormFieldState, store: FormFieldStore) => any) |
          ((value: any, state: FormFieldState, store: FormFieldStore) => any);
          message?: string;
        },
      },
      create?: () => FormFieldStore;
      options?: CommonOptions<string>;
      setup?: (store: FormFieldStore) => void;
      timeout?: number;
    },
    ...messages: string[]
  ) => {
    const {
      tests,
      create,
      options,
      setup,
      timeout = 100,
    } = opts;

    let theTests = {};
    Object.keys(tests).forEach(key => {
      const { test, message } = tests[key];
      let test2: (value: any, state: FormFieldState, store: FormFieldStore) => any;
      let theTest: (value: any, state: FormFieldState, store: FormFieldStore) => any;
      let theMessage: string;
      if (typeof test === "function") {
        const length = test.length;
        theMessage = message || `state.${key} should be as expected`;
        switch (length) {
          case 1:
            test2 = (value, state, store) => test(store);
            break;
          case 2:
            test2 = (value, state, store) => test(state, store);
            break;
          default:
            test2 = (value, state, store) => test(value, state, store);
            break;
        }
        theTest = (value, state, store) => {
          const result = test2(value, state, store);
          if (result === undefined) { return; } // it is void
          if ("then" in result) { return result; } // it is a promise
          expect(value).toEqual(result); // it is a value to test by equality
        };
      } else {
        theMessage = message || `state.${key} should be equal to ${test}`;
        theTest = (value: any) => expect(value).toEqual(test);
      }
      theTests[key] = { message: theMessage, test: theTest };
    });

    testStoreStateJest({
      create: create || (() => createFieldStore(fields.string("Name", options))),
      extract: store => store.state$,
      tests: theTests,
      setup,
      take: "last",
      timeout,
      timeoutMode: "stop",
    }, ...messages);
  },
};
