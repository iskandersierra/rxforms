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
import {
    Validator, ValidationResult, ofBoolValidator,
    successResult, messageResult, inconclusiveResult, errorResult,
    success, error, message, inconclusive,
    collect, compose, delay, startWith, startInconclusive,
} from "rxvalidation";

import { createFieldStore } from "./createFieldStore";
import { fields, FormFieldStore, FormFieldOptions, CommonOptions } from "./index";

const testStore = (
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

const testStoreJest = testStore(describe, it);

describe("createFieldStore", () => {
    describe("Sanity checks", () => {
        it("it should be a function",
            () => expect(typeof createFieldStore).toBe("function"));
    }); //    Sanity checks

    describe("Events", () => {
        const testEmptyEvent = (name: string) => testStoreJest(
            () => createFieldStore(fields.string("Name")),
            store => store[name + "$"] as Observable<void>,
            "first",
            [{
                message: `${name}() should emit an event through ${name}$`,
            }],
            {
                timeoutMode: "error",
                setup: store => store[name](),
            },
            `Test event ${name}`
        );

        const testTypedEvent = <T>(name: string, value: T) => testStoreJest(
            () => createFieldStore(fields.string("Name")),
            store => store[name + "$"] as Observable<T>,
            "first",
            [{
                message: `${name}(${value}) should emit an event through ${name}$ with given value`,
                expectation: state => { expect(state).toEqual(value); },
            }],
            {
                timeoutMode: "error",
                setup: store => store[name](value),
            },
            `Test event ${name}`
        );

        testEmptyEvent("blur");
        testEmptyEvent("focus");
        testEmptyEvent("reset");
        testTypedEvent("update", "hello");
    }); //    Test that events are connected to corresponding functions

    describe("Commands", () => {
        describe("Test initial state when no command has been issued", () => {
            const testInitState = (
                name: string,
                expecting: any | ((store: FormFieldStore) => any),
                expectedName?: string,
                options?: CommonOptions<string>,
                whenOptions?: string,
            ) => testStoreJest(
                () => createFieldStore(fields.string("Name", options)),
                store => store.state$,
                "first",
                [{
                    message: `innitially, ${whenOptions ? whenOptions + ", " : ""
                    }the state should have ${name} equal to ${expectedName ? expectedName : "expected value"}`,
                    expectation: (state, store) => {
                        if (typeof expecting === "function") {
                            expect(state[name]).toEqual(expecting(store));
                        } else {
                            expect(state[name]).toEqual(expecting);
                        }
                    },
                }],
                {
                    timeoutMode: "error",
                }
            );

            testInitState("blur", s => s.blur, "store's blur");
            testInitState("focus", s => s.focus, "store's focus");
            testInitState("update", s => s.update, "store's update");
            testInitState("reset", s => s.reset, "store's reset");
            testInitState("value", "", JSON.stringify(""));
            testInitState("isDirty", false, "false");
            testInitState("isPristine", true, "true");
            testInitState("hasFocus", false, "false");
            testInitState("isTouched", false, "false");
            testInitState("isUntouched", true, "true");
            testInitState("isValid", true, "true");
            testInitState("isInvalid", false, "false");
            testInitState("isPending", false, "false");
            testInitState("validation", successResult(), "success");
            testInitState("errors", successResult(), "success");

            testInitState("hasFocus", true, "true", { focusOnLoad: true }, "when focusOnLoad is set");
        }); //    Test initial state when no command has been issued
    }); //    Commands

    describe("hasFocus", () => {
        const testHasFocus = (
            events: string,
            focusOnLoad: boolean,
            apply: (store: FormFieldStore) => any,
            expectedHasFocus: boolean,
            log: boolean = false
        ) =>
            describe(`Given a store which has ${focusOnLoad ? "" : "not "}focus on load`, () => {
                describe(`When ${events} are emited`, () => {
                    it(`the state should ${(expectedHasFocus ? "" : "not ")}have focus at the end`, () => {
                        const store = createFieldStore(fields.string("Name", { defaultValue: "", focusOnLoad }),
                            {},
                            (s => { if (log) { s.state$.subscribe(console.info); } }),
                        );
                        const promise = store.state$
                            .takeUntil(Observable.interval(40))
                            .last().toPromise();
                        apply(store);
                        return promise.then(state => expect(state.hasFocus).toEqual(expectedHasFocus));
                    });
                }); //    When ${events} are emited
            }); //    Given a store with default value ${defaultValue}

        testHasFocus("none events", false, () => { return; }, false);
        testHasFocus("none events", true, () => { return; }, true);
        testHasFocus("focus", false, s => { s.focus(); }, true);
        testHasFocus("focus", true, s => { s.focus(); }, true);
        testHasFocus("blur", false, s => { s.blur(); }, false);
        testHasFocus("blur", true, s => { s.blur(); }, false);
        testHasFocus("reset", false, s => { s.reset(); }, false);
        testHasFocus("reset", true, s => { s.reset(); }, true);
        testHasFocus("update(x)", false, s => { s.update("x"); }, false);
        testHasFocus("update(x)", true, s => { s.update("x"); }, true);

    }); //    hasFocus

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

    describe("isDirty", () => {
        const testDirty = (
            events: string,
            setPristineWhenUpdateDefaultValue: boolean,
            apply: (store: FormFieldStore) => any,
            expectedDirty: boolean,
            log: boolean = false
        ) =>
            describe(`Given a store which is ${setPristineWhenUpdateDefaultValue
                ? "" : "not "}pristine when default value`, () => {
                    describe(`When ${events} are emited`, () => {
                        it(`the state should be ${(expectedDirty ? "dirty" : "pristine")} at the end`, () => {
                            const store = createFieldStore(
                                fields.string("Name", { defaultValue: "", setPristineWhenUpdateDefaultValue }),
                                {},
                                (s => { if (log) { s.state$.subscribe(console.info); } }),
                            );
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
        testDirty("update(default)", true, s => { s.update(""); }, false);
        testDirty("focus", false, s => { s.focus(); }, false);
        testDirty("blur", false, s => { s.blur(); }, false);
    }); //    isDirty / isPristine

    describe("isTouched", () => {
        const testTouched = (
            events: string,
            apply: (store: FormFieldStore) => any,
            expectedTouched: boolean,
            log: boolean = false
        ) =>
            describe(`Given a store`, () => {
                describe(`When ${events} are emited`, () => {
                    it(`the state should be ${(expectedTouched ? "touched" : "untouched")} at the end`, () => {
                        const store = createFieldStore(
                            fields.string("Name", { defaultValue: "" }),
                            {},
                            (s => { if (log) { s.state$.subscribe(console.info); } }),
                        );
                        const promise = store.state$
                            .takeUntil(Observable.interval(40))
                            .last().toPromise();
                        apply(store);
                        return promise.then(state => expect(state.isTouched).toEqual(expectedTouched));
                    });
                }); //    When ${events} are emited
            }); //    Given a store

        testTouched("none events", () => { return; }, false);
        testTouched("reset", s => { s.reset(); }, false);
        testTouched("update(abc)", s => { s.update("abc"); }, true);
        testTouched("update(default)", s => { s.update(""); }, true);
        testTouched("focus", s => { s.focus(); }, false);
        testTouched("blur", s => { s.blur(); }, false);
        testTouched("focus+blur", s => { s.focus(); s.blur(); }, true);
        testTouched("focus+blur+focus", s => { s.focus(); s.blur(); s.focus(); }, true);
    }); //    isTouched

    describe("validation", () => {
        const testValidation = (
            events: string,
            validator: Validator,
            apply: (store: FormFieldStore) => any,
            expected: ValidationResult,
            expectedName: string,
            setup?: (opts: FormFieldOptions) => any,
            log: boolean = false,
        ) =>
            describe(`Given a store with a validator`, () => {
                describe(`When ${events} are emited`, () => {
                    it(`the validation should be ${expectedName} at the end`, () => {
                        const options = fields.string("Name", { validator });
                        if (setup) { setup(options); }
                        const store = createFieldStore(options,
                            {},
                            (s => { if (log) { s.state$.subscribe(console.info); } }),
                        );
                        const promise = store.state$
                            .takeUntil(Observable.interval(40))
                            .last().toPromise();
                        apply(store);
                        return promise.then(state => expect(state.validation).toEqual(expected));
                    });
                }); //    When ${events} are emited
            }); //    Given a store with default value ${defaultValue}

        testValidation("none events", success, () => { return; }, successResult(), "success");
        testValidation("update(x)", success, s => { s.update("x"); }, successResult(), "success");
        testValidation("update + reset(x)", success, s => { s.reset(); s.update("x"); }, successResult(), "success");

        const isRequired: Validator = ofBoolValidator("Is required")((v: string) => !!v);
        testValidation("none events", isRequired, () => { return; }, successResult(), "success");
        testValidation("validating pristine and none events", isRequired, () => { return; },
            successResult(), "success", o => { o.validateWhenPristine = true; });
        testValidation("update(x)", isRequired, s => { s.update("x"); }, successResult(), "success");
        testValidation("update(x) + reset", isRequired, s => { s.update("x"); s.reset(); },
            successResult(), "success");
        testValidation("update(x) + update(default)", isRequired, s => { s.update("x"); s.update(""); },
            errorResult("Is required"), "error");

        const isDelayedRequired: Validator = delay(100)(isRequired);
        testValidation("none events", isDelayedRequired, () => { return; }, successResult(), "success");
        testValidation("validating pristine and none events", isDelayedRequired, () => { return; },
            successResult(), "success", o => { o.validateWhenPristine = true; });
        testValidation("update(x)", isDelayedRequired, s => { s.update("x"); }, inconclusiveResult(), "inconclusive");
        testValidation("update(x) + reset", isDelayedRequired, s => { s.update("x"); s.reset(); },
            successResult(), "success");
        testValidation("update(x) + update(default)", isDelayedRequired, s => { s.update("x"); s.update(""); },
            inconclusiveResult(), "inconclusive");
    }); //    value
}); //    createFieldStore
