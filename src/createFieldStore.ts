import * as assign from "object-assign";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/empty";
import "rxjs/add/observable/of";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publishLast";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/switchMap";
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

interface CoreState {
  readonly value: any;
  readonly validation: ValidationResult;
  readonly isPristine: boolean;
  readonly isUntouched: boolean;
  readonly hasFocus: boolean;
}

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

  // HOT CONFIG STREAM

  const [config$, startConfig] = connectLastOf(Observable.of(createFieldConfig(options, createOptions)));

  // REDUCERS

  const onReset = (config: FormFieldConfig) =>
    (state: CoreState): CoreState => assign({}, state, {
      value: config.defaultValue,
      isPristine: true,
      isUntouched: true,
    });

  const onUpdate = (value: any, config: FormFieldConfig) =>
    (state: CoreState) => {
      const val = config.coerce(value);
      const isPristine = config.isPristineWhenDefaultValue ? config.areEquals(config.defaultValue, val) : false;
      return assign({}, state, {
        value: val,
        isPristine,
        isUntouched: false,
      });
    };

  const onFocus = (state: CoreState) => assign({}, state, {
    hasFocus: true,
  });

  const onBlur = (state: CoreState) => assign({}, state, {
    hasFocus: false,
    isUntouched: false,
  });

  // STATE

  const getCoreState$ =
    (config: FormFieldConfig, initState: CoreState) =>
      Observable.merge<(initState: CoreState) => CoreState>(
        reset$.map(() => onReset(config)),
        focus$.map(() => onFocus),
        blur$.map(() => onBlur),
        update$.map((value: any) => onUpdate(value, config)),
      )
        .scan((state, reduce) => reduce(state), initState)
        .startWith(initState);

  const coreState$ = config$.first()
    .switchMap(config => getCoreState$(config, {
      value: config.defaultValue,
      validation: successResult(),
      isPristine: true,
      isUntouched: true,
      hasFocus: config.focusOnLoad,
    } as CoreState))
    .distinctUntilChanged();

  const state$: Observable<FormFieldState> =
    coreState$.map(state => ({
      // CORE
      value: state.value,
      validation: state.validation,
      isPristine: state.isPristine,
      isUntouched: state.isUntouched,
      hasFocus: state.hasFocus,
      // DERIVED
      isDirty: !state.isPristine,
      isTouched: !state.isUntouched,
      isValid: state.validation.isSuccess,
      isInvalid: state.validation.isError,
      isPending: state.validation.isInconclusive,
      errors: state.validation,
      // COMMANDS
      reset, focus, blur, update,
    }));

  // const value$ = Observable.merge<(value: any) => any>(
  //   config$.map(config => (value: any) => value),
  //   reset$.withLatestFrom(config$, (_, config) => (_2: any) => config.defaultValue),
  //   update$.withLatestFrom(config$, (value, config) => (_: any) => config.coerce(value)),
  // )
  //   .scan((value, reduce) => reduce(value), initConfig.defaultValue)
  //   .distinctUntilChanged();

  // const isDirty$ = Observable.merge<(isDirty: boolean) => boolean>(
  //   config$.map(config => (isDirty: boolean) => isDirty),
  //   value$.withLatestFrom(config$, (value, config) =>
  //     (isDirty: boolean) => config.validateAlways || !config.areEquals(value, config.defaultValue))
  // )
  //   .scan((value, reduce) => reduce(value), initConfig.validateAlways)
  //   .distinctUntilChanged();

  // const hasFocus$ = Observable.merge<(hasFocus: boolean) => boolean>(
  //   config$.map(config => (hasFocus: boolean): boolean => hasFocus),
  //   focus$.map(() => (hasFocus: boolean): boolean => true),
  //   blur$.map(() => (hasFocus: boolean): boolean => false),
  // )
  //   .scan((value, reduce) => reduce(value), initConfig.focusOnLoad)
  //   .distinctUntilChanged();

  // const isTouched$ = Observable.merge<(isTouched: boolean) => boolean>(
  //   config$.map(config => (isTouched: boolean) => isTouched),
  //   blur$.map(() => (isTouched: boolean): boolean => true),
  //   update$.map((value: any) => (isTouched: boolean): boolean => true),
  //   reset$.map(() => (isTouched: boolean): boolean => false),
  // )
  //   .scan((isTouched, reducer) => reducer(isTouched), false)
  //   .distinctUntilChanged();

  // const isValid$ = Observable.of<boolean>(true);
  // const isInvalid$ = Observable.of<boolean>(false);
  // const validation$ = Observable.of<ValidationResult>(successResult());
  // const errors$ = validation$;
  // const isPending$ = Observable.of<boolean>(false);

  // const validationState$ = Observable.combineLatest(
  //   isValid$, isInvalid$, validation$, errors$, isPending$,
  //   (isValid, isInvalid, validation, errors, isPending) => ({ isValid, isInvalid, validation, errors, isPending }));

  // const state$ = Observable.combineLatest(
  //   value$,
  //   validationState$,
  //   isDirty$,
  //   isTouched$,
  //   hasFocus$,
  //   (value, { isValid, isInvalid, validation, errors, isPending }, isDirty, isTouched, hasFocus): FormFieldState => ({
  //     kind: "field",
  //     value, isValid, isInvalid, validation, errors, isPending,
  //     isDirty, isPristine: !isDirty, isTouched, isUntouched: !isTouched, hasFocus,
  //     reset, focus, blur, update,
  //   })
  // );

  /* STORE */

  const store: FormFieldStore = {
    kind: "field",
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
