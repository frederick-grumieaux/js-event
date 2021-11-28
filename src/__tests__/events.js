import { EventSource, AggregatedEventError } from "../eventsource";

describe("Event Source", () => {

    test("create and fire an event", () => {

        let testEvent = new EventSource();

        let counter = 0;

        let unsubscribe = testEvent.subscribe(() => counter++);

        testEvent.fire({}, {});
        expect(counter).toBe(1);

        testEvent.fire("Value", "test event");
        expect(counter).toBe(2);

        testEvent.fire({ value: 0 }, "TESTS");
        expect(counter).toBe(3);

        expect(testEvent.subscriptions.length).toEqual(1);
        expect(unsubscribe).not.toBeNull();

        unsubscribe();

        expect(testEvent.subscriptions.length).toEqual(0);

        testEvent.fire({}, {});
        expect(counter).toBe(3);
    })

    test("no errors when there are 0 subscriptions", () => {
        let testEvent = new EventSource();
        testEvent.fire({}, "Test Event");
    })

    test("multiple subscriptions", () => {
        let testEvent = new EventSource();
        let counter = 0;

        testEvent.subscribe(() => counter++);
        testEvent.subscribe(() => counter++);

        expect(testEvent.subscriptions.length).toBe(2);

        testEvent.fire("EVENT", "TEST EVENT");

        expect(counter).toBe(2);
    })

    test("catches exceptions", () => {
        var testEvent = new EventSource();
        let counter = 0;

        //subscribe 3 events; one of which will throw an error instead of incrementing the counter
        testEvent.expose().subscribe(() => counter++);
        testEvent.expose().subscribe(() => { throw "error"; });
        testEvent.expose().subscribe(() => counter++);

        try {
            testEvent.fire("TEST", "TEST EVENT", true);
        } catch (e) {
            expect(e instanceof AggregatedEventError).toBeTruthy();
            expect(e.errors.length).toBe(1);
            expect(e.source).toBe("TEST EVENT");
            expect(e.event).toBe("TEST");
            expect(e.errors[0].error).toBe("error");
            expect(typeof e.errors[0].subscription).toBe("function");
        };

        expect(counter).toBe(2);

        testEvent.fire("TEST-2", "TEST EVENT");

        expect(counter).toBe(4);
    })

    test("same subscription is added only once", () => {
        const source = new EventSource();
        
        function handler(e, s) {
            console.log("event", e, "source", s);
        }

        //first subscription: adds the event handler
        source.subscribe(handler);
        expect(source.subscriptions.length).toBe(1);

        //a second subscribtion of the same eventhandler is ignored
        source.subscribe(handler);
        expect(source.subscriptions.length).toBe(1);

        //removing the event handler is possible
        source.unsubscribe(handler);
        expect(source.subscriptions.length).toBe(0);
    })

    test("unsubscribing", () => {
        const source = new EventSource();

        function handler(e, s) { /*not called*/ }

        //You can subscribe and unsubscribe by passing in a function via the "expose()" methods
        source.expose().subscribe(handler);
        expect(source.subscriptions.length).toBe(1);

        source.expose().unsubscribe(handler);
        expect(source.subscriptions.length).toBe(0);

        //you can subscribe and unsubscribe by passing in a function directly.
        source.subscribe(handler);
        expect(source.subscriptions.length).toBe(1);

        source.unsubscribe(handler);
        expect(source.subscriptions.length).toBe(0);


        //You can unsubscribe by invoking the returned function of the subscribe call.
        var unsub = source.expose().subscribe(handler);
        expect(source.subscriptions.length).toBe(1);
        unsub();
        expect(source.subscriptions.length).toBe(0);

        var unsub = source.subscribe(handler);
        expect(source.subscriptions.length).toBe(1);
        unsub();
        expect(source.subscriptions.length).toBe(0);

        //calling the unsub function multiple times does not throw errors.
        unsub();
        expect(source.subscriptions.length).toBe(0);

    })

});