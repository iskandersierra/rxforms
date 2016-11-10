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
  validateWhenPristine?: boolean;
  setPristineWhenUpdateDefaultValue?: boolean;
  debounceValidation?: number;
  debounceValueForValidation?: number;
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
    validateWhenPristine = false,
    setPristineWhenUpdateDefaultValue = false,
    debounceValidation = undefined,
    debounceValueForValidation = undefined,
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
    validateWhenPristine,
    setPristineWhenUpdateDefaultValue,
    debounceValidation,
    debounceValueForValidation,
    validator,
    isEmpty,
    areEquals,
    coerce,
  };
}

function group(
  title: string,
  children: ChildrenOf<FormElementOptionsVariants>,
  options?: {
    validator?: Validator;
    validateWhenPristine?: boolean;
    debounceValidation?: number;
    debounceValueForValidation?: number;
  }
): FormGroupOptions {
  const {
    validator = undefined,
    validateWhenPristine = false,
    debounceValidation = undefined,
    debounceValueForValidation = undefined,
  } = options || {};
  return {
    kind: "group",
    title,
    validator,
    validateWhenPristine,
    debounceValidation,
    debounceValueForValidation,
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
    validateWhenPristine = false,
    setPristineWhenUpdateDefaultValue = false,
    debounceValidation = undefined,
    debounceValueForValidation = undefined,
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
    validateWhenPristine,
    setPristineWhenUpdateDefaultValue,
    debounceValidation,
    debounceValueForValidation,
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
