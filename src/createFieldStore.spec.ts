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
import "rxjs/add/operator/subscribeOn";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/toPromise";
import { Validator, ValidationResult, successResult } from "rxvalidation";

import { createFieldStore } from "./createFieldStore";
import { fields, FormFieldStore, CommonOptions } from "./index";

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

    describe("Initial state", () => {
        const testInitState = (
            name: string, expected: any | ((s: FormFieldStore) => any),
            options?: CommonOptions<string>, whenOptions?: string
        ) =>
            it(`initially ${!!options ? whenOptions : ""}, state$ should have ${name} set to ${expected}`, () => {
                const store = createFieldStore(fields.string("Name", options));
                return store.state$
                    .first().timeout(40).toPromise()
                    .then(state => expect(state[name])
                        .toEqual(typeof expected === "function" ? expected(store) : expected));
            });

        testInitState("blur", s => s.blur);
        testInitState("focus", s => s.focus);
        testInitState("update", s => s.update);
        testInitState("reset", s => s.reset);
        testInitState("value", "");
        testInitState("isDirty", false);
        testInitState("isPristine", true);
        testInitState("hasFocus", false);
        testInitState("isTouched", false);
        testInitState("isUntouched", true);
        testInitState("isValid", true);
        testInitState("isInvalid", false);
        testInitState("isPending", false);
        testInitState("validation", successResult());
        testInitState("errors", successResult());

        testInitState("hasFocus", true, { focusOnLoad: true }, ", when focusOnLoad is set");
    }); //    Initial state

    describe("value", () => {
        const testValue = (
            events: string,
            defaultValue: any,
            apply: (store: FormFieldStore) => any,
            expected: any
        ) =>
            describe(`Given a store with default value ${defaultValue}`, () => {
                describe(`When ${events} are emited`, () => {
                    it(`the value should be ${expected} at the end`, () => {
                        const store = createFieldStore(fields.string("Name", { defaultValue }));
                        const promise = store.state$
                            .takeUntil(Observable.interval(40))
                            .last().toPromise();
                        apply(store);
                        return promise.then(state => expect(state.value).toEqual(expected));
                    });
                }); //    When ${events} are emited
            }); //    Given a store with default value ${defaultValue}

        testValue("none events", "hello", () => { return; }, "hello");
        testValue("reset()", "hello", s => { s.reset(); }, "hello");
        testValue("update(world)", "hello", s => { s.update("world"); }, "world");
        testValue("update(hello)", "hello", s => { s.update("hello"); }, "hello");
        testValue("focus()", "hello", s => { s.focus(); }, "hello");
        testValue("blur()", "hello", s => { s.blur(); }, "hello");
        testValue("update(world) + update(!!!)", "hello", s => { s.update("!!!"); }, "!!!");
    }); //    value

    describe("isDirty / isPristine", () => {
        const testDirty = (
            events: string,
            isPristineWhenDefaultValue: boolean,
            apply: (store: FormFieldStore) => any,
            expectedDirty: boolean
        ) =>
            describe(`Given a store which is ${isPristineWhenDefaultValue
                ? "" : "not "}pristine when default value`, () => {
                    describe(`When ${events} are emited`, () => {
                        it(`the state should be ${(expectedDirty ? "dirty" : "pristine")} at the end`, () => {
                            const store = createFieldStore(fields.string("Name", { isPristineWhenDefaultValue }));
                            const promise = store.state$
                                .takeUntil(Observable.interval(40))
                                .last().toPromise();
                            apply(store);
                            return promise.then(state => expect(state.isDirty).toEqual(expectedDirty));
                        });
                    }); //    When ${events} are emited
                }); //    Given a store with default value ${defaultValue}

        testDirty("none events", false, () => { return; }, false);
        testDirty("reset", false, s => { s.reset(); }, false);
        testDirty("update(abc)", false, s => { s.update("abc"); }, true);
        testDirty("update(default)", false, s => { s.update(""); }, true);
        testDirty("update(abc)", true, s => { s.update("abc"); }, true);
        testDirty("update(default)", true, s => { s.update(""); }, true);
    }); //    isDirty / isPristine
}); //    createFieldStore
