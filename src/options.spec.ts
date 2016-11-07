"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");

import { defaultCreateOptions, fields } from "./index";

describe("defaultCreateOptions", () => {
    describe("Sanity chacks", () => {
        it("it should be a function",
            () => expect(typeof defaultCreateOptions).toBe("function"));
    }); //    Sanity chacks

    describe("Given the default create options", () => {
        const options = defaultCreateOptions();
        it("it should be as expected",
            () => expect(options).toEqual({}));
    }); //    Given the default create options
}); //    defaultCreateOptions

describe("fields", () => {
    describe("Sanity checks", () => {
        it("it should be a object",
            () => expect(typeof fields).toBe("object"));
    }); //    Sanity checks

    describe("custom", () => {
        describe("Sanity checks", () => {
            it("it should be a function",
                () => expect(typeof fields.custom).toBe("function"));
        }); //    Sanity checks

        describe("Given a custom field with default values", () => {
            const f = fields.custom("My field");
            it("it should have kind field", () => expect(f.kind).toBe("field"));
            it("it should have type string", () => expect(f.type).toBe("string"));
            it("it should have expected title", () => expect(f.title).toBe("My field"));
            it("it should have undefined default value", () => expect(f.defaultValue).not.toBeDefined());
            it("it should have undefined validator", () => expect(f.validator).not.toBeDefined());
            it("it should have undefined isEmpty", () => expect(f.isEmpty).not.toBeDefined());
            it("it should have undefined areEquals", () => expect(f.areEquals).not.toBeDefined());
            it("it should have undefined coerce", () => expect(f.coerce).not.toBeDefined());
        }); //    Given a custom field with default values

        describe("Given a custom field with custom values", () => {
            const validator = jest.fn();
            const isEmpty = jest.fn();
            const areEquals = jest.fn();
            const coerce = jest.fn();
            const f = fields.custom("My field", {
                type: "email", defaultValue: "john@example.com", validator, isEmpty, areEquals, coerce,
            });
            it("it should have kind field", () => expect(f.kind).toBe("field"));
            it("it should have type email", () => expect(f.type).toBe("email"));
            it("it should have expected title", () => expect(f.title).toBe("My field"));
            it("it should have undefined default value", () => expect(f.defaultValue).toBe("john@example.com"));
            it("it should have undefined validator", () => expect(f.validator).toBe(validator));
            it("it should have undefined isEmpty", () => expect(f.isEmpty).toBe(isEmpty));
            it("it should have undefined areEquals", () => expect(f.areEquals).toBe(areEquals));
            it("it should have undefined coerce", () => expect(f.coerce).toBe(coerce));
        }); //    Given a custom field with default values
    }); //    custom

    describe("group", () => {
        describe("Sanity checks", () => {
            it("it should be a function",
                () => expect(typeof fields.group).toBe("function"));
        }); //    Sanity checks

        const field1 = fields.custom("Title#1");
        const field2 = fields.custom("Title#2");
        describe("Given a group with default validator", () => {
            const group = fields.group("Personal data", { field1, field2 });
            it("it should have kind group", () => expect(group.kind).toBe("group"));
            it("it should have given title", () => expect(group.title).toBe("Personal data"));
            it("it should have given fields", () => expect(group.children).toEqual({ field1, field2 }));
            it("it should have undefined validator", () => expect(group.validator).not.toBeDefined());
        }); //    Given a group with default validator

        describe("Given a group with custom validator", () => {
            const validator = jest.fn();
            const group = fields.group("Personal data", { field1, field2 }, { validator });
            it("it should have defined validator", () => expect(group.validator).toBeDefined());
        }); //    Given a group with default validator
    }); //    group

    describe("string", () => {
        describe("Sanity checks", () => {
            it("it should be a function",
                () => expect(typeof fields.string).toBe("function"));
        }); //    Sanity checks

        describe("Given a string field with default values", () => {
            const f = fields.string("My field");
            it("it should have kind field", () => expect(f.kind).toBe("field"));
            it("it should have type string", () => expect(f.type).toBe("string"));
            it("it should have expected title", () => expect(f.title).toBe("My field"));
            it("it should have undefined default value", () => expect(f.defaultValue).not.toBeDefined());
            it("it should have undefined validator", () => expect(f.validator).not.toBeDefined());
            it("it should have undefined isEmpty", () => expect(f.isEmpty).toBeDefined());
            it("it should have undefined areEquals", () => expect(f.areEquals).toBeDefined());
            it("it should have undefined coerce", () => expect(f.coerce).toBeDefined());
        }); //    Given a string field with default values

        describe("Given a string field with custom values", () => {
            const validator = jest.fn();
            const isEmpty = jest.fn();
            const areEquals = jest.fn();
            const coerce = jest.fn();
            const f = fields.string("My field", {
                defaultValue: "john", validator, isEmpty, areEquals, coerce,
            });
            it("it should have kind field", () => expect(f.kind).toBe("field"));
            it("it should have type string", () => expect(f.type).toBe("string"));
            it("it should have expected title", () => expect(f.title).toBe("My field"));
            it("it should have undefined default value", () => expect(f.defaultValue).toBe("john"));
            it("it should have undefined validator", () => expect(f.validator).toBe(validator));
            it("it should have undefined isEmpty", () => expect(f.isEmpty).toBe(isEmpty));
            it("it should have undefined areEquals", () => expect(f.areEquals).toBe(areEquals));
            it("it should have undefined coerce", () => expect(f.coerce).toBe(coerce));
        }); //    Given a string field with default values
    }); //    string
}); //    fields
