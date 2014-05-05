;/**
 * Created by ronaldronson on 4/3/14.
 */
(function (global, Cl, undefined) {
    "use strict";

    Cl.model('btn-num', function ($scope) {
        var $mediator = $scope.$parent.deps.mediator,
            val = $scope.data.value;

        $scope.press = function () {
            $mediator.publish('change', {value: val});
        };
    });
}(this, this.Cl));