import { useState, useCallback, useRef, useEffect } from 'react'

import {
  CallbacksFor,
  Methods,
  StateFor,
  QueryCallbacksFor,
  QueryMethods,
  SubscriberAndCallbacksFor,
} from './use_methods'

type Actions<M extends Methods, Q extends QueryMethods | null> = {
  actions: CallbacksFor<M>
  query: QueryCallbacksFor<Q>
}

export type useCollector<M extends Methods, Q extends QueryMethods | null, C = any> = C extends null
  ? Actions<M, Q>
  : C & Actions<M, Q>

export function useCollector<M extends Methods, Q extends QueryMethods | null>(
  store: SubscriberAndCallbacksFor<M, Q>
): useCollector<M, Q>

export function useCollector<M extends Methods, Q extends QueryMethods | null, C>(
  store: SubscriberAndCallbacksFor<M, Q>,
  collector: (state: StateFor<M>, query: Q) => C
): useCollector<M, Q, C>

export function useCollector<M extends Methods, Q extends QueryMethods | null, C>(
  store: SubscriberAndCallbacksFor<M, Q>,
  collector?: any
) {
  const { subscribe, getState, actions, query } = store

  const initial = useRef(true)
  const collected = useRef<C | null>(null)
  const collectorRef = useRef(collector)
  collectorRef.current = collector

  const onCollect = useCallback(
    (collectedItem): useCollector<M, Q, C> => {
      return { ...collectedItem, actions, query }
    },
    [actions, query]
  )

  // Collect states for initial render
  if (initial.current && collector) {
    collected.current = collector(getState(), query)
    initial.current = false
  }

  const [renderCollected, setRenderCollected] = useState(onCollect(collected.current))

  // Collect states on state change
  useEffect(() => {
    let unsubscribe: any
    if (collectorRef.current) {
      unsubscribe = subscribe(
        (current) => collectorRef.current(current, query),
        (collectedItem: any) => {
          setRenderCollected(onCollect(collectedItem))
        }
      )
    }
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [onCollect, query, subscribe])

  return renderCollected
}