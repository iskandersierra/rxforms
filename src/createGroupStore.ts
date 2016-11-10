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
import {
  Validator, ValidationResult, successResult, success,
  startInconclusive, compose, combineResults, collectResults,
} from "rxvalidation";

import {
  IsFieldValueEmpty, CoerceFieldValue, AreEqualsFieldValues,
  ReadonlyChildrenOf,
  FormElementOptions, FormFieldOptions, FormGroupOptions, FormElementOptionsVariants,
  CreateConfigOptions,
  FormElementConfig, FormFieldConfig, FormGroupConfig, FormElementConfigVariants,
  CreateStoreOptions,
  FormFieldState, FormGroupState, FormElementState, FormElementStateVariants,
  FormElementStore, FormFieldStore, FormGroupStore, FormElementStoreVariants,
} from "./interfaces";
import { createFieldConfig, createGroupConfig } from "./configs";
import { createFieldStore } from "./createFieldStore";
import {
  emptyEvent, typedEvent, letValue, connectLastOf, applyEffects, mapObservable, mapObject,
  someObject,
} from "./internals";
import { form } from "./form";

export function createGroupStore(
  options: FormGroupOptions,
  createOptions?: CreateStoreOptions,
  ...effects: ((store: FormGroupStore) => void)[]
): FormGroupStore {

  // EVENTS

  const [reset$, reset] = emptyEvent();

  // INTERNAL EVENTS

  const [setValidation$, setValidation] = typedEvent<ValidationResult>();

  // HOT CONFIG STREAM

  const [config$, startConfig] = connectLastOf(Observable.of(createGroupConfig(options, createOptions)));

  /* STATE */

  // CORE STATE
  interface CoreState {
    readonly config: FormGroupConfig;
    readonly children: ReadonlyChildrenOf<FormElementStoreVariants>;
  }

  const coreStateFactory$ =
    (conf: FormGroupConfig, init: CoreState) =>
      Observable.merge<(coreState: CoreState) => CoreState>(
        config$.skip(1).map(config => (state: CoreState) => {
          return assign({}, state, { config });
        }),
      )
        .scan((coreState, reduce) => reduce(coreState), init)
        .startWith(init);

  const coreState$ = config$.first()
    .switchMap(config => coreStateFactory$(config, {
      config,
      children: mapObject(config.children, conf =>
        (conf.kind === "field")
          ? createFieldStore(conf, createOptions)
          : createGroupStore(conf, createOptions),
      ),
    }))
    .distinctUntilChanged();

  // INNER STATE
  const innerState$ = coreState$
    .switchMap(core => {
      const fieldState$ = mapObservable<FormElementStoreVariants, FormElementStateVariants>(
        core.children, store => store.state$);
      const result = fieldState$.map(fs => ({
        config: core.config,
        hasFocus: someObject(fs, s => s.hasFocus),
        isDirty: someObject(fs, s => s.isDirty),
        isTouched: someObject(fs, s => s.isTouched),
        value: mapObject(fs, s => s.value),
        validation: combineResults(mapObject(fs, s => s.validation)),
      }));
      return result;
    });


  // VALIDATION
  const validation$ = config$
    .switchMap(config => innerState$
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
    innerState$, validation$,
    ({ config, hasFocus, value, isDirty, isTouched, validation }, groupValidation) => {
      const val = collectResults([validation, groupValidation]);
      return {
        kind: "group" as "group",
        value,
        hasFocus,
        isDirty,
        isPristine: !isDirty,
        isTouched,
        isUntouched: !isTouched,
        isValid: val.isSuccess,
        isInvalid: val.isError,
        isPending: val.isInconclusive,
        validation: val,
        errors: val,
        config,
        reset,
      } as FormGroupState;
    });

  /* STORE */

  const store: FormGroupStore = {
    kind: "group",
    state$,
    reset$, reset,
  };

  /* EFFECTS */

  applyEffects(store, ...effects);

  startConfig();

  return store;
}
