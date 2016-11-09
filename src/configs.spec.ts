"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");

import { createElementConfig, createFieldConfig, createGroupConfig } from "./configs";
import {
    fields,
    FormFieldOptions, FormGroupOptions, FormElementOptions, FormElementOptionsVariants,
    FormFieldConfig, FormGroupConfig, FormElementConfig, FormElementConfigVariants,
} from "./index";

describe("createFieldConfig", () => {
    describe("Sanity checks", () => {
        it("it should be a function",
            () => expect(typeof createFieldConfig).toBe("function"));
    }); //    Sanity checks

    describe("Given a default field options", () => {
        const options = fields.custom("A field");
        describe("When a config is created from it", () => {
            const config = createFieldConfig(options);
            it("it's kind should be field", () => expect(config.kind).toBe("field"));
            it("it's type should be string", () => expect(config.type).toBe("string"));
            it("it's title should be given title", () => expect(config.title).toBe("A field"));
            it("it's defaultValue should be undefined", () => expect(config.defaultValue).toBe(undefined));
            it("it's validateWhenPristine should be false", () => expect(config.validateWhenPristine).toBe(false));
            it("it's setPristineWhenUpdateDefaultValue should be false",
                () => expect(config.setPristineWhenUpdateDefaultValue).toBe(false));
            it("it's debounceValidation should be undefined",
                () => expect(config.debounceValidation).toBe(undefined));
            it("it's debounceValueForValidation should be undefined",
                () => expect(config.debounceValueForValidation).toBe(undefined));
            it("it's focusOnLoad should be false", () => expect(config.focusOnLoad).toBe(false));
            it("it's validator should be defined", () => expect(config.validator).toBeDefined());
            it("it's isEmpty should be defined", () => expect(config.isEmpty).toBeDefined());
            it("it's coerce should be defined", () => expect(config.coerce).toBeDefined());
            it("it's areEquals should be defined", () => expect(config.areEquals).toBeDefined());
        }); //    When a config is created from it
    }); //    Given a field options

    describe("Given a custom field options", () => {
        const validator = jest.fn();
        const isEmpty = jest.fn(a => !a);
        const coerce = jest.fn(v => v);
        const areEquals = jest.fn((a, b) => a === b);
        const options = fields.custom("A field", {
            type: "email",
            defaultValue: "john@example.com",
            validateWhenPristine: true,
            setPristineWhenUpdateDefaultValue: true,
            debounceValidation: 200,
            debounceValueForValidation: 500,
            focusOnLoad: true,
            validator, isEmpty, coerce, areEquals,
        });
        describe("When a config is created from it", () => {
            const config = createFieldConfig(options);
            it("it's kind should be field", () => expect(config.kind).toBe("field"));
            it("it's type should be email", () => expect(config.type).toBe("email"));
            it("it's title should be given title", () => expect(config.title).toBe("A field"));
            it("it's defaultValue should be given value", () => expect(config.defaultValue).toBe("john@example.com"));
            it("it's validateWhenPristine should be true", () => expect(config.validateWhenPristine).toBe(true));
            it("it's setPristineWhenUpdateDefaultValue should be true",
                () => expect(config.setPristineWhenUpdateDefaultValue).toBe(true));
            it("it's debounceValidation should be 500",
                () => expect(config.debounceValidation).toBe(200));
            it("it's debounceValueForValidation should be 500",
                () => expect(config.debounceValueForValidation).toBe(500));
            it("it's focusOnLoad should be true", () => expect(config.focusOnLoad).toBe(true));
            it("it's validator should be given value", () => expect(config.validator).toBe(validator));
            it("it's isEmpty should be given value", () => expect(config.isEmpty).toBe(isEmpty));
            it("it's coerce should be given value", () => expect(config.coerce).toBe(coerce));
            it("it's areEquals should be given value", () => expect(config.areEquals).toBe(areEquals));
        }); //    When a config is created from it
    }); //    Given a field options

}); //    createFieldConfig

describe("createGroupConfig", () => {
    describe("Sanity checks", () => {
        it("it should be a function",
            () => expect(typeof createGroupConfig).toBe("function"));
    }); //    Sanity checks

    describe("Given a default group options", () => {
        const children = {};
        const options = fields.group("A group", children);
        describe("When a config is created from it", () => {
            const config = createGroupConfig(options);
            it("it's kind should be group", () => expect(config.kind).toBe("group"));
            it("it's title should be given title", () => expect(config.title).toBe("A group"));
            it("it's children should be empty", () => expect(config.children).toEqual({}));
            it("it's validator should be defined", () => expect(config.validator).toBeDefined());
        }); //    When a config is created from it
    }); //    Given a groups options

    describe("Given a custom group options", () => {
        const validator = jest.fn();
        const children = {
            name: fields.string("Name"),
            age: fields.string("Age"),
        };
        const options = fields.group("A group", children, { validator });
        describe("When a config is created from it", () => {
            const config = createGroupConfig(options);
            it("it's kind should be group", () => expect(config.kind).toBe("group"));
            it("it's title should be given title", () => expect(config.title).toBe("A group"));
            it("it's children should have fields name and age",
                () => expect(Object.keys(config.children)).toEqual(["name", "age"]));
            it("it's validator should be given value", () => expect(config.validator).toBe(validator));
        }); //    When a config is created from it
    }); //    Given a groups options

}); //    createGroupConfig

describe("createElementConfig", () => {
    describe("Sanity checks", () => {
        it("it should be a function",
            () => expect(typeof createElementConfig).toBe("function"));
    }); //    Sanity checks

    describe("Given a field options", () => {
        const options = fields.custom("A field");
        describe("When a config is created from it", () => {
            const config = createElementConfig(options);
            it("it should be equal to config created with createFieldConfig",
                () => expect(config).toEqual(createFieldConfig(options)));
        }); //    When a config is created from it
    }); //    Given a field options

    describe("Given a field options", () => {
        const options = fields.custom("A field");
        describe("When a config is created from it", () => {
            const config = createElementConfig(options);
            it("it should be equal to config created with createFieldConfig",
                () => expect(config).toEqual(createFieldConfig(options)));
        }); //    When a config is created from it
    }); //    Given a field options

    describe("Given a group options", () => {
        const options = fields.group("A group", {});
        describe("When a config is created from it", () => {
            const config = createElementConfig(options);
            it("it should be equal to config created with createGroupConfig",
                () => expect(config).toEqual(createGroupConfig(options)));
        }); //    When a config is created from it
    }); //    Given a group options

}); //    createElementConfig
