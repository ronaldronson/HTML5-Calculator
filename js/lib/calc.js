;/**
 * Created by ronaldronson on 4/3/14.
 */
/*jslint browser:true nomen:true */
(function (global, undefined) {
    "use strict";
    var Deps, opt = {
        model: 'md',
        dataName: 'cl',
        application: 'app',
        controller: 'ctrl',
        selector: '[data-cl]',
        evPrefix: 'on',
        paramsSeparator: ',',
        valuesSeparator: ':'
    };

    /** helper "protected" functions */

    /**
     * Convert data params to plain object.
     *
     * @param data
     * @returns {Object}
     * @private
     */
    function _dataToObj(data) {
        return data.split(opt.paramsSeparator)
            .map(function (val) {
                return val.trim();
            }).map(function (val) {
                var data = val.split(opt.valuesSeparator);
                return {
                    name: data[0].trim(),
                    value: data[1].trim()
                };
            }).reduce(function (pre, cur) {
                pre[cur.name] = cur.value;
                return pre;
            }, {});
    }

    /**
     * Get collection of DOM elements.
     *
     * @param what string
     * @param where
     * @returns {Array}
     * @private
     */
    function _find(what, where) {
        return [].slice.call((where || global.document).querySelectorAll(what || opt.selector));
    }

    /**
     * Filter DOM elements by data type.
     *
     * @param what array
     * @param type string
     * @returns {Array}
     * @private
     */
    function _filterByType(what, type) {
        var regexp = new RegExp(type + '\\s?:');
        return what.filter(function (el) {
            return !!~el.dataset[opt.dataName].search(regexp);
        });
    }

    /**
     * Build namespace.
     *
     * @param namespace string
     * @param root object
     * @returns {Object}
     * @private
     */
    function _namespace(namespace, root) {
        return namespace.split('.').reduce(function (pre, cur) {
            return pre[cur] = (pre[cur] || {});
        }, root || global);
    }

    /**
     * Merge properties from one object to other.
     *
     * @param what object donor
     * @param where object recipient
     * @param override bool
     * @returns {Object}
     * @private
     */
    function _merge(what, where, override) {
        return Object.keys(what).reduce(function (pre, cur) {
            pre[cur] = !!override ? what[pre] : (pre[cur] || what[pre]);
            return pre;
        }, where);
    }

    /**
     * Get dependencies by name.
     *
     * @param list array
     * @returns {Array|*}
     * @private
     */
    function _getDeps(list) {
        return list.map(function (name) {
            return Deps[name] ? new Deps[name]() : {};
        });
    }

    /**
     * Walk on each node to process data.
     *
     * @param where object context
     * @param type string
     * @param fn function
     * @returns {Array}
     * @private
     */
    function _walkOnNodes(where, type, fn) {
        return _filterByType(_find(opt.selector, where), type).map(function (el) {
            return fn(el, _dataToObj(el.dataset[opt.dataName]));
        });
    }

    /**
     * Empty funcion
     *
     * @private
     */
    function _noop() {}

    /**
     * Walk on data, assign handlers.
     *
     * @param data object
     * @param $scope object
     * @param $el DOMElement
     * @returns {*}
     * @private
     */
    function _lookForHandlers(data, $scope, $el) {
        return Object.keys(data).filter(function (name) {
            return 0 === name.indexOf(opt.evPrefix);
        }).forEach(function (name) {
            var e = name.replace(opt.evPrefix, '').toLowerCase();
            $el.addEventListener(e, $scope[data[name]] || _noop);
        });
    }

    /**
     * Dependencies container
     */
    Deps = (function () {

        /**
         * Mediator constructor
         *
         * @constructor
         */
        function Mediator() {
            this.events = {};
        }

        /**
         * Subscribe on event.
         *
         * @param name string
         * @param who function
         * @returns {Mediator}
         */
        Mediator.prototype.subscribe = function (name, who) {
            var event = this.events[name] = (this.events[name] || []);
            event.push(who);
            return this;
        };

        /**
         * Publish event.
         *
         * @param name string
         * @param data object
         * @returns {Mediator}
         */
        Mediator.prototype.publish = function (name, data) {
            [].concat(this.events[name])
                .concat(this.events['*'])
                .filter(function (el) { return !!el; })
                .forEach(function (fn) { fn(data, name); });

            return this;
        };

        return {
            mediator: Mediator
        };
    }());

    /**
     * Calculator constructor
     *
     * @constructor
     */
    function CL() {
        this.$scope = { apps: {}, controllers: {}, models: {} };
    }

    /**
     * Init function
     *
     * search for apps
     * in each app search for controllers
     * in each controller each for module
     */
    CL.prototype.init = function () {
        var self = this;

        _walkOnNodes(null, opt.application, function (el, data) {
            var appScope = {$parent: {$scope: self.$scope}, data: data};
            _walkOnNodes(el, opt.controller, function (el, data) {
                var params, ctrlScope, ctrlDeps, namedDepts;

                params = self.$scope.controllers[data[opt.controller]];

                if (!params) { return false; }

                ctrlScope = {$parent: {$scope: appScope}, data: data};
                ctrlDeps = _getDeps(params.deps);
                namedDepts = params.deps.reduce(function (pre, cur, i) {
                    pre[cur] = ctrlDeps[i];
                    return pre;
                }, {});

                ctrlDeps.unshift(ctrlScope);
                params.fn.apply(ctrlScope, ctrlDeps);
                _lookForHandlers(data, ctrlScope, el);

                _walkOnNodes(el, opt.model, function (el, data) {
                    var params = self.$scope.models[data[opt.model]], modelScope, deps;

                    if (!params) { return false; }

                    deps = _getDeps(params.deps);
                    modelScope = {
                        $parent: {$scope: ctrlScope, deps: namedDepts},
                        data: data,
                        $el: el
                    };

                    deps.unshift(el);
                    deps.unshift(modelScope);
                    params.fn.apply(modelScope, deps);
                    _lookForHandlers(data, modelScope, el);
                });
            });
        });
    };

    /**
     * Register controller in system.
     *
     * @param name string
     * @param deps array
     * @param fn function
     * @returns {CL}
     */
    CL.prototype.controller = function (name, deps, fn) {
        if ("function" === typeof deps) {
            fn = deps;
            deps = [];
        }

        this.$scope.controllers[name] = {deps: deps, fn: fn};
        return this;
    };

    /**
     * Register model in system.
     *
     * @param name
     * @param deps
     * @param fn
     * @returns {CL}
     */
    CL.prototype.model = function (name, deps, fn) {
        if ("function" === typeof deps) {
            fn = deps;
            deps = [];
        }

        this.$scope.models[name] = {deps: deps, fn: fn};
        return this;
    };

    /**  Global accessed obj */
    global.Cl = new CL();
}(this));
