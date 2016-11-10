import * as assign from "object-assign";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/combineLatest";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publishLast";

export function emptyEvent(): [Observable<void>, () => void] {
  const subject$ = new Subject<void>();
  const obs$ = subject$.asObservable();
  const emit = () => subject$.next();
  return [obs$, emit];
};

export function typedEvent<T>(): [Observable<T>, (t: T) => void] {
  const subject$ = new Subject<T>();
  const obs$ = subject$.asObservable();
  const emit = (a: T) => subject$.next(a);
  return [obs$, emit];
};

export const letValue = <T>(value: T, fn: (val: T) => T) => fn(value);

export const connectLastOf = <T>(
  obs: Observable<T>
): [Observable<T>, () => void] => {
  const connectable$ = obs.publishLast();
  const obs$ = connectable$.map(x => x);
  const connect = () => { connectable$.connect(); };
  return [obs$, connect];
};

export function applyEffects<TStore>(
  store: TStore,
  ...effects: ((store: TStore) => void)[]
) {
  if (!!effects && effects.length > 0) {
    effects.forEach(effect => effect(store));
  }
}

// mapObject: { [key]: T } x (T => V) ==> { [key]: V }
export const mapObject = <T, V>(
  o: { [key: string]: T },
  f: (t: T) => V
): { [key: string]: V } =>
  Object.keys(o).reduce((r, k) => assign(r, { [k]: f(o[k]) }), {});

// someObject: { [key]: T } x (T x key => bool) ==> bool
export const someObject = <T>(
  o: { [key: string]: T },
  pred: (t: T, key: string) => boolean
): boolean =>
  ofObject(o).some(({ key, value }) => pred(value, key));

// everyObject: { [key]: T } x (T x key => bool) ==> bool
export const everyObject = <T>(
  o: { [key: string]: T },
  pred: (t: T, key: string) => boolean
): boolean =>
  ofObject(o).every(({ key, value }) => pred(value, key));

// reduceObject: { [key]: T } x (R x T x key => bool) x R ==> R
export const reduceObject = <T, R>(
  o: { [key: string]: T },
  red: (r: R, t: T, key: string) => R,
  seed: R,
): R =>
  ofObject(o).reduce((acc, { key, value }) => red(acc, value, key), seed);

// ofObject: { [key]: T } -> { key; value: T; }[]
export function ofObject<T>(o: { [key: string]: T }): { key: string; value: T; }[] {
  return Object.keys(o).map(key => ({ key, value: o[key] as T }));
}

// toObject: { key; value: T; }[] -> { [key]: T }
export function toObject<T>(pairs: { key: string; value: T; }[]): { [key: string]: T } {
  return pairs.reduce((o, p) => assign(o, { [p.key]: p.value }), {});
}

// mapObservable: { [key]: T } x (T => V$) ==> { [key]: V }$
export function mapObservable<T, V>(
  o: { [key: string]: T },
  f: (t: T) => Observable<V>
): Observable<{ [key: string]: V }> {
  // Step 0: { [key]: T }
  const step0 = o;

  // Step 1: { [key]: V$ }
  const step1 = mapObject(step0, f);

  // Step 2: { key, value: V$ }[]
  const step2 = ofObject(step1);

  // Step 3: { key, value: V }$ []
  const step3 = step2.map(({ key, value }) => value.map(v => ({ key, value: v })));

  // Step 4: { key, value: V }[] $
  const step4 = Observable.combineLatest(...step3, (...pairs) => pairs);

  // Step 5: { [key]: V } $
  const step5 = step4.map(toObject);

  return step5;
}
