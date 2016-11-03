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

export function createFieldStore(
  options: FormFieldOptions,
  createOptions?: CreateStoreOptions
): FormFieldStore {
  const config = createFieldConfig(options, createOptions);

  const resetSubject$ = new Subject<void>();
  const reset$ = resetSubject$.asObservable();
  const reset = () => resetSubject$.next();

  const focusSubject$ = new Subject<void>();
  const focus$ = focusSubject$.asObservable();
  const focus = () => focusSubject$.next();

  const blurSubject$ = new Subject<void>();
  const blur$ = blurSubject$.asObservable();
  const blur = () => blurSubject$.next();

  const updateSubject$ = new Subject<any>();
  const update$ = updateSubject$.asObservable();
  const update = (value: any) => updateSubject$.next(value);

  const connectableValue$ = Observable.merge(
    reset$.map(() => config.defaultValue),
    update$.map(value => config.coerce(value)),
  )
    .startWith(config.defaultValue)
    .distinctUntilChanged()
    .publishLast();
  const value$ = connectableValue$.map(e => e);

  const isDirty$ = value$
    .map(value => !config.areEquals(value, config.defaultValue))
    .distinctUntilChanged();

  const connectableHasFocus$ = Observable.merge(
    focus$.map(() => true),
    blur$.map(() => false),
  )
    .startWith(false)
    .distinctUntilChanged()
    .publishLast();
  const hasFocus$ = connectableHasFocus$.map(e => e);

  const connectableIsTouched$ = Observable.merge<(isTouched: boolean) => boolean>(
    reset$.map(() => () => false),
    hasFocus$.map(hasFocus => hasFocus ? () => true : (isTouched: boolean) => isTouched),
    isDirty$.map(isDirty => isDirty ? () => true : (isTouched: boolean) => isTouched),
  )
    .scan((isTouched, reducer) => reducer(isTouched), false)
    .startWith(false)
    .distinctUntilChanged()
    .publishLast();
  const isTouched$ = connectableIsTouched$.map(e => e);

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
      value,
      isValid,
      isInvalid,
      validation,
      isPending,
      isDirty,
      isTouched,
      hasFocus,
      reset,
      focus,
      blur,
      update,
    })
  );

  const start = () => {
    connectableValue$.connect();
    connectableHasFocus$.connect();
    connectableIsTouched$.connect();
  };

  return {
    kind: "field",
    config,

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

    start,
  };
}
