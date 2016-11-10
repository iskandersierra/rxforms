"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");
import {
  Validator, ValidationResult, ofBoolValidator,
  successResult, messageResult, inconclusiveResult, errorResult,
  success, error, message, inconclusive,
  collect, compose, delay, startWith, startInconclusive,
} from "rxvalidation";

import { createFieldStore } from "./createFieldStore";
import {
  fields, FormFieldStore, FormFieldState, FormFieldOptions, CommonOptions,
} from "./index";
import { fieldStoreTesting } from "./testStore";
const { testEmptyEvent, testTypedEvent, testState } = fieldStoreTesting;

describe("createFieldStore", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof createFieldStore).toBe("function"));
  }); //    Sanity checks

  describe("Events", () => {
    testEmptyEvent("blur");
    testEmptyEvent("focus");
    testEmptyEvent("reset");
    testTypedEvent("update", "hello");
  }); //    Test that events are connected to corresponding functions

  describe("Core state", () => {
    describe("Given a Field Store", () => {
      testState({
        tests: {
          blur: { test: s => s.blur },
          focus: { test: s => s.focus },
          update: { test: s => s.update },
          reset: { test: s => s.reset },
          value: { test: "" },
          isDirty: { test: false },
          isPristine: { test: true },
          hasFocus: { test: false },
          isTouched: { test: false },
          isUntouched: { test: true },
          isValid: { test: true },
          isInvalid: { test: false },
          isPending: { test: false },
          validation: { test: successResult() },
          errors: { test: successResult() },
          config: { test: (c, st, sr) => expect(c).toBeDefined() },
        },
      },
        "When no event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: true },
          isTouched: { test: false },
        },
        options: { focusOnLoad: true },
      },
        "When no event has been emited and focusOnLoad is set",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: false },
          isTouched: { test: false },
        },
        setup: store => store.reset(),
      },
        "When event reset() has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: true },
          isTouched: { test: false },
        },
        setup: store => store.reset(),
        options: { focusOnLoad: true },
      },
        "When event reset() has been emited and focusOnLoad is set",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: true },
          isTouched: { test: false },
        },
        setup: store => store.focus(),
      },
        "When event focus() has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: false },
          isTouched: { test: false },
        },
        setup: store => store.blur(),
      },
        "When event blur() has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: true },
          isTouched: { test: false },
        },
        setup: store => store.focus(),
        options: { focusOnLoad: true },
      },
        "When event focus() has been emited and focusOnLoad is set",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: false },
          isTouched: { test: true },
        },
        setup: store => store.blur(),
        options: { focusOnLoad: true },
      },
        "When event blur() has been emited and focusOnLoad is set",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: false },
          isTouched: { test: true },
        },
        setup: store => { store.focus(); store.blur(); },
      },
        "When event focus() + blur() has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          hasFocus: { test: true },
          isTouched: { test: true },
        },
        setup: store => { store.blur(); store.focus(); },
        options: { focusOnLoad: true },
      },
        "When event blur() + focus() has been emited and focusOnLoad is set",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          isTouched: { test: false },
        },
        setup: store => { store.update(""); },
      },
        "When event update(default) has been emited",
      );

      testState({
        tests: {
          value: { test: "", message: "value should be coerced to empty string" },
          isDirty: { test: false },
          isTouched: { test: false },
        },
        setup: store => { store.update(null); },
      },
        "When event update(null) has been emited",
      );

      testState({
        tests: {
          value: { test: "x" },
          isDirty: { test: true },
          isTouched: { test: true },
        },
        setup: store => { store.update("x"); },
      },
        "When event update(x) has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: true },
          isTouched: { test: true },
        },
        setup: store => { store.update("x"); store.update(null); },
      },
        "When event update(x) + update(default) has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          isTouched: { test: true },
        },
        setup: store => { store.update("x"); store.update(null); },
        options: { setPristineWhenUpdateDefaultValue: true },
      },
        "When event update(x) + update(default) has been emited while setPristineWhenUpdateDefaultValue is true",
      );

      testState({
        tests: {
          value: { test: "" },
          isDirty: { test: false },
          isTouched: { test: false },
        },
        setup: store => { store.update("x"); store.reset(); },
      },
        "When event update(x) + reset() has been emited",
      );

    });
  }); //    Core state

  describe("Validation", () => {
    const isRequired: Validator = ofBoolValidator("Is required")((v: string) => !!v);
    const isQuickRequired: Validator = delay(20)(isRequired);
    const isDelayedRequired: Validator = delay(250)(isRequired);

    describe("Given a Field Store with no validation", () => {
      testState({
        tests: {
          value: { test: "x" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        setup: store => store.update("x"),
        timeout: 100,
      },
        "When update(x) event has been emited",
      );
    }); //    Given a Field Store with no validation

    describe("Given a Field Store with an immediate 'isRequired' validation", () => {
      testState({
        tests: {
          value: { test: "" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        options: { validator: isRequired },
        timeout: 100,
      },
        "When no event has been emited",
      );

      testState({
        tests: {
          value: { test: "x" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        setup: store => store.update("x"),
        options: { validator: isRequired },
        timeout: 100,
      },
        "When update(x) event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        setup: store => { store.focus(); store.blur(); },
        options: { validator: isRequired },
        timeout: 100,
      },
        "When focus() + blur() event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: errorResult("Is required"), message: "validation should be an error result" },
        },
        setup: store => { store.focus(); store.blur(); },
        options: { validator: isRequired, validateWhenPristine: true },
        timeout: 100,
      },
        "When focus() + blur() event has been emited while validateWhenPristine is true",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: errorResult("Is required"), message: "validation should be an error result" },
        },
        setup: store => { store.update("x"); store.update(null); },
        options: { validator: isRequired },
        timeout: 100,
      },
        "When update(x) + update(default) event has been emited",
      );
    }); //    Given a Field Store with no validation

    describe("Given a Field Store with a shortly delayed 'isRequired' validation", () => {
      testState({
        tests: {
          value: { test: "" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        options: { validator: isQuickRequired },
        timeout: 100,
      },
        "When no event has been emited",
      );

      testState({
        tests: {
          value: { test: "x" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        setup: store => store.update("x"),
        options: { validator: isQuickRequired },
        timeout: 100,
      },
        "When update(x) event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        setup: store => { store.focus(); store.blur(); },
        options: { validator: isQuickRequired },
        timeout: 100,
      },
        "When focus() + blur() event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: errorResult("Is required"), message: "validation should be an error result" },
        },
        setup: store => { store.focus(); store.blur(); },
        options: { validator: isQuickRequired, validateWhenPristine: true },
        timeout: 100,
      },
        "When focus() + blur() event has been emited while validateWhenPristine is true",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: errorResult("Is required"), message: "validation should be an error result" },
        },
        setup: store => { store.update("x"); store.update(null); },
        options: { validator: isQuickRequired },
        timeout: 100,
      },
        "When update(x) + update(default) event has been emited",
      );
    }); //    Given a Field Store with no validation

    describe("Given a Field Store with a too delayed 'isRequired' validation", () => {
      testState({
        tests: {
          value: { test: "" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        options: { validator: isDelayedRequired },
        timeout: 100,
      },
        "When no event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        options: { validator: isDelayedRequired, validateWhenPristine: true },
        timeout: 100,
      },
        "When no event has been emited while validateWhenPristine is true",
      );

      testState({
        tests: {
          value: { test: "x" },
          validation: { test: inconclusiveResult(), message: "validation should be a inconclusive result" },
        },
        setup: store => store.update("x"),
        options: { validator: isDelayedRequired },
        timeout: 100,
      },
        "When update(x) event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: successResult(), message: "validation should be a success result" },
        },
        setup: store => { store.focus(); store.blur(); },
        options: { validator: isDelayedRequired },
        timeout: 100,
      },
        "When focus() + blur() event has been emited",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: inconclusiveResult(), message: "validation should be an inconclusive result" },
        },
        setup: store => { store.focus(); store.blur(); },
        options: { validator: isDelayedRequired, validateWhenPristine: true },
        timeout: 100,
      },
        "When focus() + blur() event has been emited while validateWhenPristine is true",
      );

      testState({
        tests: {
          value: { test: "" },
          validation: { test: inconclusiveResult(), message: "validation should be an inconclusive result" },
        },
        setup: store => { store.update("x"); store.update(null); },
        options: { validator: isDelayedRequired },
        timeout: 100,
      },
        "When update(x) + update(default) event has been emited",
      );
    }); //    Given a Field Store with no validation
  }); //    Validation

  /*
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

    const isDelayedRequired: Validator = delay(200)(isRequired);
    testValidation("none events", isDelayedRequired, () => { return; }, successResult(), "success");
    testValidation("validating pristine and none events", isDelayedRequired, () => { return; },
      successResult(), "success", o => { o.validateWhenPristine = true; });
    testValidation("update(x)", isDelayedRequired, s => { s.update("x"); }, inconclusiveResult(), "inconclusive");
    testValidation("update(x) + reset", isDelayedRequired, s => { s.update("x"); s.reset(); },
      successResult(), "success");
    testValidation("update(x) + update(default)", isDelayedRequired, s => { s.update("x"); s.update(""); },
      inconclusiveResult(), "inconclusive");
  }); //    value
  */
}); //    createFieldStore
