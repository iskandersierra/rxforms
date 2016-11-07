"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");

import { createElementConfig, createFieldConfig, createGroupConfig } from "./configs";

describe("createFieldConfig", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof createFieldConfig).toBe("function"));
  }); //    Sanity checks

}); //    createFieldConfig

describe("createGroupConfig", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof createGroupConfig).toBe("function"));
  }); //    Sanity checks

}); //    createGroupConfig

describe("createElementConfig", () => {
  describe("Sanity checks", () => {
    it("it should be a function",
      () => expect(typeof createElementConfig).toBe("function"));
  }); //    Sanity checks

}); //    createElementConfig
