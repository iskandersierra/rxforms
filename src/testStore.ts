"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");
import { Observable } from "rxjs/Observable";

export const testStore = (
  describe: (msg: string, runner: () => void) => void,
  it: (msg: string, runner: () => any | Promise<any>) => void,
) => <TStore, TState>(
  create: () => TStore,
  extract: (store: TStore) => Observable<TState>,
  take: ("first" | "last" | number),
  expectations: {
    message: string;
    expectation?: (state: TState, store: TStore) => void;
  }[],
  options?: {
    timeout?: number;
    timeoutMode?: "error" | "stop";
    presetup?: (store: TStore) => void;
    setup?: (store: TStore) => void;
  },
  ...messages: string[]) => {
    const {
      timeout = undefined,
      timeoutMode = "error",
      presetup = undefined,
      setup = undefined,
    } = options || {};
    const runTest = () => {
      expectations.forEach(exp => {
        it(exp.message, () => {
          const store = create();
          let state$ = extract(store);
          if (presetup) { presetup(store); }
          if (timeout) {
            if (timeoutMode === "stop") {
              state$ = state$.takeUntil(Observable.interval(timeout || 100));
            } else {
              state$ = state$.timeout(timeout || 100);
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
          if (exp.expectation) {
            promise = promise.then(state => exp.expectation(state, store));
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
