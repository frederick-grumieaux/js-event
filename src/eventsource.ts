export class EventSource<T> {

    subscriptions: onEvent<T>[] = [];

    constructor() {
        this.fire = this.fire.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.expose = this.expose.bind(this);
    }

    fire(event: T, source: unknown, throwExceptions = false) {
        if (!event) return;
        if (!source) return;

        let errors: EventError<T>[] = [];

        for (let handler of this.subscriptions)
            try { handler(event, source); }
            catch (e) { errors.push({ subscription: handler, error: e}); }

        if (throwExceptions && errors.length > 0)
            throw new AggregatedEventError(event, source, errors);
    }

    subscribe(callback: onEvent<T>) {
        if (this.subscriptions.every(handler => handler !== callback))
            this.subscriptions.push(callback);

        return () => this.unsubscribe(callback);
    }

    unsubscribe(callback: onEvent<T>) {
        this.subscriptions = this.subscriptions.filter(x => x !== callback)
    }

    expose() : EventHandler<T> {
        return {
            subscribe: this.subscribe,
            unsubscribe: this.unsubscribe,
        }
    }
}

export type onEvent<T> = (event: T, source: unknown) => void;
export type EventError<T> = { subscription: onEvent<T>, error: any }
export type EventHandler<T> = {
    subscribe: (callback: onEvent<T>) => () => void;
    unsubscribe: (callback: onEvent<T>) => void;
}
export class AggregatedEventError<T> {
    errors: EventError<T>[]
    source: any;
    event: T;

    constructor(event: T, source: any, failures: EventError<T>[]) {
        this.source = source;
        this.event = event;
        this.errors = failures;
    }
}

