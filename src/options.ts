import { Validator, success } from "rxvalidation";
import {
  IsFieldValueEmpty, CoerceFieldValue, AreEqualsFieldValues, ChildrenOf,
  FormFieldOptions, FormGroupOptions, FormElementOptionsVariants,
  CreateConfigOptions,
  CreateStoreOptions,
} from "./interfaces";

export const defaultCreateOptions = (): CreateStoreOptions => ({});

export interface CommonOptions<T> {
  defaultValue?: T;
  validator?: Validator;
  validateAlways?: boolean;
  isPristineWhenDefaultValue?: boolean;
  focusOnLoad?: boolean;
  isEmpty?: ((s: T) => boolean);
  areEquals?: ((a: T, b: T) => boolean);
  coerce?: ((a: T) => T);
}

function custom(
  title: string,
  options?: CommonOptions<any> & {
    type?: string;
  }
): FormFieldOptions {
  const {
    type = "string",
    defaultValue = undefined,
    focusOnLoad = false,
    validateAlways = false,
    isPristineWhenDefaultValue = false,
    validator = undefined,
    isEmpty = undefined,
    areEquals = undefined,
    coerce = undefined,
  } = options || {};
  return {
    kind: "field",
    type,
    title,
    defaultValue,
    focusOnLoad,
    validateAlways,
    isPristineWhenDefaultValue,
    validator,
    isEmpty,
    areEquals,
    coerce,
  };
}

function group(
  title: string,
  children: ChildrenOf<FormElementOptionsVariants>,
  options?: { validator?: Validator }
): FormGroupOptions {
  const {
    validator = undefined,
  } = options || {};
  return {
    kind: "group",
    title,
    validator,
    children,
  };
}

function string(title: string, options?: CommonOptions<string> & {
  minLength?: number,
  maxLength?: number,
  regex?: RegExp,
  alphabet?: string,
}): FormFieldOptions {

  const isStringEmpty = (s: string) => s === "";
  const areStringEquals = (a: string, b: string) => a === b;
  const coerceString = (a: string) => !!a ? a : "";

  const {
    defaultValue = undefined,
    focusOnLoad = false,
    validateAlways = false,
    isPristineWhenDefaultValue = false,
    validator = undefined,
    isEmpty = isStringEmpty,
    areEquals = areStringEquals,
    coerce = coerceString,
    minLength = undefined,
    maxLength = undefined,
    regex = undefined,
    alphabet = undefined,
  } = options || {};

  return custom(title, {
    type: "string",
    defaultValue,
    focusOnLoad,
    validateAlways,
    isPristineWhenDefaultValue,
    validator,
    isEmpty,
    areEquals,
    coerce,
  });
}

export const fields = {
  custom,
  group,
  string,
};
