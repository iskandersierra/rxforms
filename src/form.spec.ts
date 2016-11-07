"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");

import { form } from "./index";

describe("form", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof form).toBe("function"));
  }); //    Sanity checks

}); //    form