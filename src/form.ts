import {
  IsFieldValueEmpty, CoerceFieldValue, AreEqualsFieldValues,
  ReadonlyChildrenOf,
  FormElementOptions, FormFieldOptions, FormGroupOptions, FormElementOptionsVariants,
  CreateConfigOptions,
  FormElementConfig, FormFieldConfig, FormGroupConfig, FormElementConfigVariants,
  CreateStoreOptions,
  FormFieldState, FormGroupState,
  FormElementStore, FormFieldStore, FormGroupStore, FormElementStoreVariants,
} from "./interfaces";
import { createFieldStore } from "./createFieldStore";
import { createGroupStore } from "./createGroupStore";

export function form(
  options: FormElementOptionsVariants,
  createOptions?: CreateStoreOptions,
  ...effects: ((store: FormElementStoreVariants) => void)[]
): FormElementStoreVariants {
  switch (options.kind) {
    case "field": return createFieldStore(options, createOptions, ...effects);
    default: return createGroupStore(options, createOptions, ...effects);
  }
}
