import { Validator } from "rxvalidation";
import {
  IsFieldValueEmpty, CoerceFieldValue, AreEqualsFieldValues, ChildrenOf,
  FormFieldOptions, FormGroupOptions, FormElementOptionsVariants,
  CreateConfigOptions,
  CreateStoreOptions,
} from "./interfaces";

export const defaultCreateOptions: CreateStoreOptions = {};

export function field(
  title: string,
  type: string = "text",
  defaultValue: any = undefined,
  validator: Validator | undefined = undefined,
  isEmpty: IsFieldValueEmpty | undefined = undefined,
  areEquals: AreEqualsFieldValues | undefined = undefined,
  coerce: CoerceFieldValue | undefined = undefined,
): FormFieldOptions {
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

export function group(
  title: string,
  children: ChildrenOf<FormElementOptionsVariants>,
  validator: Validator | undefined = undefined,
): FormGroupOptions {
  return {
    kind: "group",
    title,
    validator,
    children,
  };
}
