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

import { createGroupStore } from "./createGroupStore";
import { fields, FormFieldStore, FormFieldOptions, CommonOptions } from "./index";
import { testStoreJest } from "./testStore";

describe("createGroupStore", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof createGroupStore).toBe("function"));
  }); //    Sanity checks

}); //    createGroupStore
