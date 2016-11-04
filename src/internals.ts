import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
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
