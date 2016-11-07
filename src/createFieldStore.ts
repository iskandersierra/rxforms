import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/empty";
import "rxjs/add/observable/of";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publishLast";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/withLatestFrom";
import { Validator, ValidationResult, successResult } from "rxvalidation";

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
import { createFieldConfig, createGroupConfig } from "./configs";
import { emptyEvent, typedEvent, letValue, connectLastOf, applyEffects } from "./internals";
import { form } from "./form";

export function createFieldStore(
  options: FormFieldOptions,
  createOptions?: CreateStoreOptions,
  ...effects: ((store: FormFieldStore) => void)[]
): FormFieldStore {

  // EVENTS

  const [reset$, reset] = emptyEvent();
  const [focus$, focus] = emptyEvent();
  const [blur$, blur] = emptyEvent();
  const [update$, update] = typedEvent<any>();

  // DERIVED STATES

  const [config$, startConfig] = connectLastOf(Observable.of(createFieldConfig(options, createOptions)));

  // DERIVED STATES

  const value$ = Observable.merge(
    config$.map(config => config.defaultValue),
    reset$.withLatestFrom(config$, (_, config) => config.defaultValue),
    update$.withLatestFrom(config$, (value, config) => config.coerce(value)),
  )
    .distinctUntilChanged();

  const isDirty$ = value$
    .withLatestFrom(config$, (value, config) => !config.areEquals(value, config.defaultValue))
    .distinctUntilChanged();

  const hasFocus$ = Observable.merge(
    config$.map(config => false),
    focus$.map(() => true),
    blur$.map(() => false),
  )
    .distinctUntilChanged();

  const isTouched$ = Observable.merge<(isTouched: boolean) => boolean>(
    config$.map(config => (): boolean => false),
    hasFocus$.map(hasFocus => hasFocus ? () => true : (isTouched: boolean) => isTouched),
    isDirty$.map(isDirty => isDirty ? () => true : (isTouched: boolean) => isTouched),
    reset$.map(() => (): boolean => false),
  )
    .scan((isTouched, reducer) => reducer(isTouched), false)
    .startWith(false)
    .distinctUntilChanged();

  const isValid$ = Observable.of<boolean>(true);
  const isInvalid$ = Observable.of<boolean>(false);
  const validation$ = Observable.of<ValidationResult>(successResult());
  const isPending$ = Observable.of<boolean>(false);

  const validationState$ = Observable.combineLatest(
    isValid$, isInvalid$, validation$, isPending$,
    (isValid, isInvalid, validation, isPending) => ({ isValid, isInvalid, validation, isPending }));

  const state$ = Observable.combineLatest(
    value$,
    validationState$,
    isDirty$,
    isTouched$,
    hasFocus$,
    (value, { isValid, isInvalid, validation, isPending }, isDirty, isTouched, hasFocus): FormFieldState => ({
      kind: "field",
      value, isValid, isInvalid, validation, isPending, isDirty, isTouched, hasFocus,
      reset, focus, blur, update,
    })
  );

  /* STORE */

  const store: FormFieldStore = {
    kind: "field",
    config$,

    value$,
    isValid$,
    isInvalid$,
    validation$,
    isPending$,
    isDirty$,
    isTouched$,
    hasFocus$,
    state$,

    reset$, reset,
    focus$, focus,
    blur$, blur,
    update$, update,
  };

  /* EFFECTS */

  applyEffects(store, ...effects);

  startConfig();

  return store;
}
