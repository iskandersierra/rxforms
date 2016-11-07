import { Validator, success } from "rxvalidation";
import {
    IsFieldValueEmpty, CoerceFieldValue, AreEqualsFieldValues, ChildrenOf,
    FormFieldOptions, FormGroupOptions, FormElementOptionsVariants,
    CreateConfigOptions,
    CreateStoreOptions,
} from "./interfaces";

export const defaultCreateOptions = (): CreateStoreOptions => ({});

function custom(title: string, options?: {
    type?: string,
    defaultValue?: any,
    validator?: Validator,
    isEmpty?: IsFieldValueEmpty,
    areEquals?: AreEqualsFieldValues,
    coerce?: CoerceFieldValue,
}): FormFieldOptions {
    const {
        type = "string",
        defaultValue = undefined,
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

function string(title: string, options?: {
    defaultValue?: string,
    validator?: Validator,
    isEmpty?: ((s: string) => boolean),
    areEquals?: ((a: string, b: string) => boolean),
    coerce?: ((a: string) => string),
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
