;/**
 * Created by ronaldronson on 4/3/14.
 */
(function (global, Cl, undefined) {
    "use strict";

    Cl.model('btn-clr', function ($scope) {
        var $mediator = $scope.$parent.deps.mediator;

        $scope.clear = function () {
            $mediator.publish('clear', {value: ''});
        };
    });
}(this, this.Cl));