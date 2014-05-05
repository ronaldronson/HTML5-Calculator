;/**
 * Created by ronaldronson on 4/3/14.
 */
(function (global, Cl, undefined) {
    "use strict";

    Cl.model('screen', function ($scope, $el) {
        var $mediator = $scope.$parent.deps.mediator;

        $mediator.subscribe('show', function (data) {
            $el.innerHTML = "" + data.value;
        });
    });
}(this, this.Cl));