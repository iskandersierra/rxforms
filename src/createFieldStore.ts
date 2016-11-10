import * as assign from "object-assign";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/empty";
import "rxjs/add/observable/of";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publishLast";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/skip";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";
import { Validator, ValidationResult, successResult, success, startInconclusive } from "rxvalidation";

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

  // INTERNAL EVENTS

  const [setValidation$, setValidation] = typedEvent<ValidationResult>();

  // HOT CONFIG STREAM

  const [config$, startConfig] = connectLastOf(Observable.of(createFieldConfig(options, createOptions)));

  /* STATE */

  // CORE STATE
  interface CoreState {
    readonly config: FormFieldConfig;
    readonly hasFocus: boolean;
    readonly value: any;
    readonly isDirty: boolean;
    readonly isTouched: boolean;
  }

  const coreStateFactory$ =
    (conf: FormFieldConfig, init: CoreState) =>
      Observable.merge<(coreState: CoreState) => CoreState>(
        config$.skip(1).map(config => (state: CoreState) => {
          return assign({}, state, { config });
        }),

        // On focus hasFocus should get value true
        focus$.map(() => (state: CoreState) => {
          const hasFocus = true;
          return assign({}, state, { hasFocus });
        }),

        // On blur hasFocus should get value false
        blur$.map(() => (state: CoreState) => {
          const hasFocus = false;
          const isTouched = state.hasFocus ? true : state.isTouched;
          return assign({}, state, { hasFocus, isTouched });
        }),

        reset$.map(() => (state: CoreState) => {
          const isDirty = false;
          const isTouched = false;
          const value = state.config.defaultValue;
          return assign({}, state, { isTouched, isDirty, value });
        }),

        update$.map(newValue => (state: CoreState) => {
          const value = state.config.coerce(newValue);
          if (state.config.areEquals(state.value, value)) { return state; }
          const isDirty = state.config.setPristineWhenUpdateDefaultValue
            ? !state.config.areEquals(state.config.defaultValue, value)
            : true;
          const isTouched = state.isTouched || isDirty;
          return assign({}, state, { isTouched, isDirty, value });
        }),
      )
        .scan((coreState, reduce) => reduce(coreState), init)
        .startWith(init);

  const coreState$ = config$.first()
    .switchMap(config => coreStateFactory$(config, {
      config,
      hasFocus: config.focusOnLoad,
      isDirty: false,
      isTouched: false,
      value: config.defaultValue,
    }))
    .distinctUntilChanged();

  // VALIDATION
  const validation$ = config$
    .switchMap(config => coreState$
      .distinctUntilChanged((x, y) => x.isDirty === y.isDirty && x.isTouched === y.isTouched && x.value === y.value)
      .debounceTime(config.debounceValueForValidation || 0)
      .switchMap(({value, isDirty, isTouched}) => {
        if (!isTouched) { return success(value); }
        if (!isDirty && !config.validateWhenPristine) { return success(value); }
        return startInconclusive(config.validator)(value);
      })
      .debounceTime(config.debounceValidation || 0)
    );

  // STATE
  const state$ = Observable.combineLatest(
    coreState$, validation$,
    ({ config, hasFocus, value, isDirty, isTouched }, validation) => ({
      kind: "field" as "field",
      value,
      hasFocus,
      isDirty,
      isPristine: !isDirty,
      isTouched,
      isUntouched: !isTouched,
      isValid: validation.isSuccess,
      isInvalid: validation.isError,
      isPending: validation.isInconclusive,
      validation,
      errors: validation,
      config,
      reset, update, focus, blur,
    })
  );

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
