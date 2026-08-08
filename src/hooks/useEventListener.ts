import { useEffect, useRef } from "react";

type EventMapFor<Target extends EventTarget> = Target extends Window
  ? WindowEventMap
  : Target extends Document
    ? DocumentEventMap
    : Target extends HTMLElement
      ? HTMLElementEventMap
      : Target extends SVGElement
        ? SVGElementEventMap
        : Record<string, Event>;

type EventFor<
  Target extends EventTarget,
  EventName extends string,
> = EventName extends keyof EventMapFor<Target>
  ? EventMapFor<Target>[EventName]
  : Event;

/**
 * Adds a typed DOM event listener that always calls the latest handler.
 *
 * @typeParam Target - Event target type.
 * @typeParam EventName - Event name type.
 * @param target - Target to attach to, or null to skip.
 * @param eventName - DOM event name.
 * @param listener - Handler called when the event fires.
 * @param options - Optional listener options.
 * @returns Nothing.
 */
export const useEventListener = <
  Target extends EventTarget,
  EventName extends string,
>(
  target: Target | null | undefined,
  eventName: EventName,
  listener: (event: EventFor<Target, EventName>) => void,
  options?: boolean | AddEventListenerOptions,
): void => {
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    if (!target) {
      return;
    }

    const handleEvent = (event: Event) => {
      listenerRef.current(event as EventFor<Target, EventName>);
    };

    target.addEventListener(eventName, handleEvent, options);
    return () => target.removeEventListener(eventName, handleEvent, options);
  }, [eventName, options, target]);
};
