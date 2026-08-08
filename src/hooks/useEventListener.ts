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
