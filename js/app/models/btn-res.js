;/**
 * Created by ronaldronson on 4/3/14.
 */
(function (global, Cl, undefined) {
    "use strict";

    Cl.model('btn-res', function ($scope, $el) {
        var $mediator = $scope.$parent.deps.mediator;

        $scope.show = function () {
            $mediator.publish('result', {value: ''});
        };
    });
}(this, this.Cl));