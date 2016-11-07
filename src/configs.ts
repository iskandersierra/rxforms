import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import { Validator, ValidationResult, successResult } from "rxvalidation";

import {
  IsFieldValueEmpty, CoerceFieldValue, AreEqualsFieldValues,
  ReadonlyChildrenOf,
  FormElementOptions, FormFieldOptions, FormGroupOptions, FormElementOptionsVariants,
  CreateConfigOptions,
  FormElementConfig, FormFieldConfig, FormGroupConfig, FormElementConfigVariants,
  CreateStoreOptions,
} from "./interfaces";
import { defaultCreateOptions } from "./options";

const validatorDefault: Validator = () => Observable.of(successResult());
const isEmptyDefault = (value: any) => !value;
const coerceDefault = (value: any) => value;
const areEqualDefault = (value: any, oldValue: any) => value === oldValue;

export function createFieldConfig(
  options: FormFieldOptions,
  createOptions?: CreateConfigOptions
): FormFieldConfig {
  const createOptionsOrDefault = createOptions || defaultCreateOptions();
  const {
    title = "field",
    type,
    validator = validatorDefault,
    defaultValue = undefined,
    isEmpty = isEmptyDefault,
    coerce = coerceDefault,
    areEquals = areEqualDefault,
  } = options;

  return {
    kind: "field",
    type,
    title,
    validator,
    defaultValue: coerce(defaultValue),
    isEmpty,
    coerce,
    areEquals,
  };
}

export function createGroupConfig(
  options: FormGroupOptions,
  createOptions?: CreateConfigOptions
): FormGroupConfig {
  const createOptionsOrDefault = createOptions || defaultCreateOptions();
  const {
    title = "group",
    validator = validatorDefault,
    children,
  } = options;

  let ch: ReadonlyChildrenOf<FormElementConfigVariants> = {};
  Object.keys(children).forEach(key => {
    (ch as any)[key] = createElementConfig(children[key], createOptions);
  });

  return {
    kind: "group",
    title,
    validator,
    children: ch,
  };
}

export function createElementConfig(
  options: FormElementOptionsVariants,
  createOptions?: CreateConfigOptions
): FormElementConfigVariants {
  switch (options.kind) {
    case "field":
      return createFieldConfig(options, createOptions);
    case "group":
      return createGroupConfig(options, createOptions);
    default:
      throw new Error("Unknown element kind");
  }
}
