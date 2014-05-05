;/**
 * Created by ronaldronson on 4/3/14.
 */
(function (global, Cl, undefined) {
    "use strict";

    Cl.controller('index', ['mediator'], function ($scope, $mediator) {
        var pull = '', current = '', isDot = false;
        $mediator.subscribe('change', function (data) {
            /** design limitation */
            if (current.length > 19) { return; }

            pull += data.value;
            current += data.value;

            $mediator.publish('show', {value: current});
        }).subscribe('operation', function (data) {
            if ('.' === data.value) {
                if (isDot) { return; }
                isDot = true;
                current = data.value;
            } else {
                current = '';
            }

            pull += data.value;
            $mediator.publish('show', {value: current});
        }).subscribe('result', function () {
            /*jslint eval:true */
            pull = current = eval(pull); //@TODO remove eval!
            $mediator.publish('show', {value: current});
        }).subscribe('clear', function () {
            current = pull = '';
            isDot = false;
            $mediator.publish('show', {value: current});
        });
    });
}(this, this.Cl));