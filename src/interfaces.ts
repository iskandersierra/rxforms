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
  readonly value: any;
  // Validation
  readonly isValid: boolean;
  readonly isInvalid: boolean;
  readonly validation: ValidationResult;
  readonly isPending: boolean;
  // Status
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly hasFocus: boolean;

  reset(): void;
}

export interface FormFieldState extends FormElementState {
  readonly kind: "field";

  focus(): void;
  blur(): void;
  update(value: any): void;
}

export interface FormGroupState extends FormElementState {
  readonly kind: "group";

  readonly children: ReadonlyChildrenOf<FormElementState>;
}

export type FormElementStateVariants = FormFieldState | FormGroupState;

/* STORES */

export interface CreateStoreOptions extends CreateConfigOptions {

}

export interface FormElementStore {

  readonly config$: Observable<FormElementConfigVariants>;
  readonly state$: Observable<FormElementStateVariants>;

  readonly value$: Observable<any>;
  // Validation
  readonly isValid$: Observable<boolean>;
  readonly isInvalid$: Observable<boolean>;
  readonly validation$: Observable<ValidationResult>;
  readonly isPending$: Observable<boolean>;
  // Status
  readonly isDirty$: Observable<boolean>;
  readonly isTouched$: Observable<boolean>;
  readonly hasFocus$: Observable<boolean>;

  // Commands
  readonly reset$: Observable<void>;

  reset(): void;
}

export interface FormFieldStore extends FormElementStore {
  readonly kind: "field";
  readonly config$: Observable<FormFieldConfig>;
  readonly state$: Observable<FormFieldState>;

  // Commands
  readonly focus$: Observable<void>;
  readonly blur$: Observable<void>;
  readonly update$: Observable<any>;

  focus(): void;
  blur(): void;
  update(value: any): void;
}

export interface FormGroupStore extends FormElementStore {
  readonly kind: "group";
  readonly config$: Observable<FormGroupConfig>;
  readonly children$: Observable<ReadonlyChildrenOf<FormElementStoreVariants>>;
  readonly state$: Observable<FormGroupState>;
}

export type FormElementStoreVariants = FormFieldStore | FormGroupStore;
