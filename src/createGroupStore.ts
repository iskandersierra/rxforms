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

export function createGroupStore(
  options: FormGroupOptions,
  createOptions?: CreateStoreOptions,
  ...effects: ((store: FormGroupStore) => void)[]
): FormGroupStore {

}
