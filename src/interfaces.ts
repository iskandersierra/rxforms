import { Observable } from "rxjs/Observable";
import { Validator, ValidationResult } from "rxvalidation";

export type IsFieldValueEmpty =
  (value: any) => boolean;

export type CoerceFieldValue =
  (value: any) => any;

export type AreEqualsFieldValues =
  (value: any, oldValue: any) => boolean;

export interface ChildrenOf<T> {
  [name: string]: T;
}

export interface ReadonlyChildrenOf<T> {
  readonly[name: string]: T;
}

/* OPTIONS */

export interface FormElementOptions {
  title: string;
  validator?: Validator;
}

export interface FormFieldOptions extends FormElementOptions {
  kind: "field";
  type: string;
  defaultValue?: any;
  validateWhenPristine?: boolean;
  setPristineWhenUpdateDefaultValue?: boolean;
  debounceValidation?: number;
  debounceValueForValidation?: number;
  focusOnLoad?: boolean;
  isEmpty?: IsFieldValueEmpty;
  coerce?: CoerceFieldValue;
  areEquals?: AreEqualsFieldValues;
}

export interface FormGroupOptions extends FormElementOptions {
  kind: "group";
  children: ChildrenOf<FormElementOptionsVariants>;
}

export type FormElementOptionsVariants = FormFieldOptions | FormGroupOptions;

/* CONFIGS */

export interface CreateConfigOptions {

}

export interface FormElementConfig {
  readonly title: string;
  readonly validator: Validator;
}

export interface FormFieldConfig extends FormElementConfig {
  readonly kind: "field";
  readonly type: string;
  readonly defaultValue: any;
  readonly validateWhenPristine: boolean;
  readonly setPristineWhenUpdateDefaultValue: boolean;
  readonly debounceValidation: number | undefined;
  readonly debounceValueForValidation: number | undefined;
  readonly focusOnLoad: boolean;
  readonly isEmpty: IsFieldValueEmpty;
  readonly coerce: CoerceFieldValue;
  readonly areEquals: AreEqualsFieldValues;
}

export interface FormGroupConfig extends FormElementConfig {
  readonly kind: "group";
  readonly children: ReadonlyChildrenOf<FormElementConfigVariants>;
}

export type FormElementConfigVariants = FormFieldConfig | FormGroupConfig;

/* STATES */

export interface FormElementState {
  readonly config: FormElementConfig;
  readonly value: any;

  // Validation
  readonly isValid: boolean;
  readonly isInvalid: boolean;
  readonly validation: ValidationResult;
  readonly errors: ValidationResult;
  readonly isPending: boolean;

  // Status
  readonly isDirty: boolean;
  readonly isPristine: boolean;
  readonly isTouched: boolean;
  readonly isUntouched: boolean;
  readonly hasFocus: boolean;

  reset(): void;
}

export interface FormFieldState extends FormElementState {
  readonly kind: "field";
  readonly config: FormFieldConfig;

  focus(): void;
  blur(): void;
  update(value: any): void;
}

export interface FormGroupState extends FormElementState {
  readonly kind: "group";
  readonly config: FormFieldConfig;

  readonly children: ReadonlyChildrenOf<FormElementState>;
}

export type FormElementStateVariants = FormFieldState | FormGroupState;

/* STORES */

export interface CreateStoreOptions extends CreateConfigOptions {

}

export interface FormElementStore {
  readonly state$: Observable<FormElementStateVariants>;

  readonly reset$: Observable<void>;

  reset(): void;
}

export interface FormFieldStore extends FormElementStore {
  readonly kind: "field";

  readonly state$: Observable<FormFieldState>;

  readonly focus$: Observable<void>;
  readonly blur$: Observable<void>;
  readonly update$: Observable<any>;

  focus(): void;
  blur(): void;
  update(value: any): void;
}

export interface FormGroupStore extends FormElementStore {
  readonly kind: "group";

  readonly state$: Observable<FormGroupState>;
}

export type FormElementStoreVariants = FormFieldStore | FormGroupStore;
