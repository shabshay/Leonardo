$traceurRuntime.options.symbols = true;
System.registerModule("src/leonardo/activator.drv.js", [], function() {
  "use strict";
  var __moduleName = "src/leonardo/activator.drv.js";
  function activatorDirective($compile) {
    return {
      restrict: 'A',
      link: function(scope, elem) {
        var el = angular.element('<div ng-click="activate()" class="leonardo-activator"></div>');
        var win = angular.element(['<div class="leonardo-window">', '<div class="leonardo-header">Leonardo Configuration</div>', '<window-body></window-body>', '</div>', '</div>'].join(''));
        $compile(el)(scope);
        $compile(win)(scope);
        elem.append(el);
        elem.append(win);
        win[0].addEventListener('webkitTransitionEnd', function() {
          if (!document.body.classList.contains('pull-top')) {
            document.body.classList.add("pull-top-closed");
          }
        }, false);
        scope.activate = function() {
          if (!document.body.classList.contains('pull-top')) {
            document.body.classList.add('pull-top');
            document.body.classList.remove('pull-top-closed');
          } else {
            document.body.classList.remove('pull-top');
          }
        };
      }
    };
  }
  var $__default = activatorDirective;
  return {get default() {
      return $__default;
    }};
});
$traceurRuntime.options.symbols = true;
System.registerModule("src/leonardo/configuration.srv.js", [], function() {
  "use strict";
  var __moduleName = "src/leonardo/configuration.srv.js";
  function configurationService($q, activeStatesStore, $httpBackend) {
    var states = [];
    var stateReq = {};
    var upsertOption = function(state, name, active) {
      var _states = getStatesFromStore();
      _states[$traceurRuntime.toProperty(state)] = {
        name: name,
        active: active
      };
      activeStatesStore.set('states', _states);
      return sync();
    };
    function getStatesFromStore() {
      return activeStatesStore.get('states') || {};
    }
    function fetchStates() {
      var activeStates = getStatesFromStore();
      var _states = states.map((function(state) {
        return angular.copy(state);
      }));
      _states.forEach(function(state) {
        var option = activeStates[$traceurRuntime.toProperty(state.name)];
        state.active = !!option && option.active;
        state.activeOption = !!option ? state.options.find((function(_option) {
          return _option.name === option.name;
        })) : state.options[0];
      });
      return $q.when(_states);
    }
    function deactivateAll() {
      var _states = getStatesFromStore();
      Object.keys(_states).forEach(function(stateKey) {
        _states[$traceurRuntime.toProperty(stateKey)].active = false;
      });
      activeStatesStore.set('states', _states);
      return sync();
    }
    function findStateOption(name) {
      return fetchStates().then(function(states) {
        return states.find((function(state) {
          return state.name === name;
        })).activeOption;
      });
    }
    function sync() {
      return fetchStates().then(function(states) {
        var defer = $q.defer();
        var promise = defer.promise;
        defer.resolve();
        states.forEach(function(state) {
          promise = promise.then(function() {
            return findStateOption(state.name).then(function(option) {
              if (state.active) {
                stateReq[$traceurRuntime.toProperty(state.name)].respond(function() {
                  return [option.status, option.data];
                });
              } else {
                stateReq[$traceurRuntime.toProperty(state.name)].passThrough();
              }
            });
          });
        });
        return promise;
      });
    }
    var initialized = fetchStates().then(function() {
      (states || []).forEach(function(state) {
        stateReq[$traceurRuntime.toProperty(state.name)] = $httpBackend.when(state.verb || 'GET', new RegExp(state.url));
      });
    });
    return {
      states: states,
      initialize: function() {
        return initialized.then(sync);
      },
      active_states_option: [],
      upsertOption: upsertOption,
      fetchStates: fetchStates,
      getState: function(name) {
        return fetchStates().then(function(states) {
          var state = states.find((function(state) {
            return state.name === name;
          }));
          return (state && state.active && findStateOption(name)) || $q.when(null);
        });
      },
      upsert: function($__1) {
        var $__3,
            $__4,
            $__5;
        var $__2 = $__1,
            verb = $__2.verb,
            state = $__2.state,
            name = $__2.name,
            url = $__2.url,
            status = ($__3 = $__2.status) === void 0 ? 200 : $__3,
            data = ($__4 = $__2.data) === void 0 ? {} : $__4,
            delay = ($__5 = $__2.delay) === void 0 ? 0 : $__5;
        var defaultState = {};
        var defaultOption = {};
        if (!state) {
          console.log("cannot upsert - state is mandatory");
          return ;
        }
        var stateItem = states.find((function(_state) {
          return _state.name === state;
        })) || defaultState;
        angular.extend(stateItem, {
          name: state,
          url: url || stateItem.url,
          verb: verb || stateItem.verb,
          options: stateItem.options || []
        });
        if (stateItem === defaultState) {
          states.push(stateItem);
        }
        var option = stateItem.options.find((function(_option) {
          return _option.name === name;
        })) || defaultOption;
        angular.extend(option, {
          name: name,
          status: status,
          data: data,
          delay: delay
        });
        if (option === defaultOption) {
          stateItem.options.push(option);
        }
      },
      upsertMany: function(items) {
        var $__0 = this;
        items.forEach((function(item) {
          return $__0.upsert(item);
        }));
      },
      deactivateAll: deactivateAll
    };
  }
  var $__default = configurationService;
  return {get default() {
      return $__default;
    }};
});
$traceurRuntime.options.symbols = true;
System.registerModule("src/leonardo/window-body.drv.js", [], function() {
  "use strict";
  var __moduleName = "src/leonardo/window-body.drv.js";
  function windowBodyDirective($http, configuration) {
    return {
      restrict: 'E',
      templateUrl: 'window-body.html',
      scope: true,
      replace: true,
      controller: function($scope) {
        $scope.selectedItem = 'activate';
        $scope.NothasUrl = function(option) {
          return !option.url;
        };
        $scope.hasUrl = function(option) {
          return !!option.url;
        };
        $scope.deactivate = function() {
          $scope.states.forEach(function(state) {
            state.active = false;
          });
          configuration.deactivateAll();
        };
        $scope.updateState = function(state) {
          console.log(("update state: " + state.name + " " + state.activeOption.name + " " + state.active));
          configuration.upsertOption(state.name, state.activeOption.name, state.active);
        };
        configuration.fetchStates().then(function(states) {
          $scope.states = states;
        });
      },
      link: function(scope) {
        scope.test = {
          url: '',
          value: undefined
        };
        scope.submit = function(url) {
          scope.test.value = undefined;
          scope.url = url;
          if (url) {
            $http.get(url).success(function(res) {
              scope.test.value = res;
            });
          }
        };
      }
    };
  }
  var $__default = windowBodyDirective;
  return {get default() {
      return $__default;
    }};
});
$traceurRuntime.options.symbols = true;
System.registerModule("src/leonardo/module.js", [], function() {
  "use strict";
  var __moduleName = "src/leonardo/module.js";
  var activatorDirective = System.get("src/leonardo/activator.drv.js").default;
  var configurationService = System.get("src/leonardo/configuration.srv.js").default;
  var windowBodyDirective = System.get("src/leonardo/window-body.drv.js").default;
  var $__default = angular.module('leonardo', ['leonardo.templates', 'angular-storage', 'ngMockE2E']).factory('configuration', configurationService).factory('activeStatesStore', function(store) {
    return store.getNamespacedStore('active_states');
  }).directive('activator', activatorDirective).directive('windowBody', windowBodyDirective);
  return {get default() {
      return $__default;
    }};
});
System.get("src/leonardo/module.js" + '');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9sZW9uYXJkby9hY3RpdmF0b3IuZHJ2LmpzIiwic3JjL2xlb25hcmRvL2NvbmZpZ3VyYXRpb24uc3J2LmpzIiwic3JjL2xlb25hcmRvL3dpbmRvdy1ib2R5LmRydi5qcyIsInNyYy9sZW9uYXJkby9tb2R1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkEsYyxRLFEsRSxLLEM7QSxLLGUsQSxpQyxHLEMsVSxBOztBLEEsSSxDLFksa0MsQztBQUFBLFNBQVMsbUJBQWlCLENBQUUsUUFBTztBQUNqQyxTQUFPO0FBQ0wsYUFBTyxDQUFHLElBQUU7QUFDWixTQUFHLENBQUcsVUFBUyxLQUFJLENBQUcsQ0FBQSxJQUFHO0FBQ3ZCLEFBQUksVUFBQSxDQUFBLEVBQUMsRUFBSSxDQUFBLE9BQU0sUUFBUSxBQUFDLENBQUMsOERBQTZELENBQUMsQ0FBQztBQUV4RixBQUFJLFVBQUEsQ0FBQSxHQUFFLEVBQUksQ0FBQSxPQUFNLFFBQVEsQUFBQyxDQUFDLENBQzFCLCtCQUE4QixDQUM1Qiw0REFBMEQsQ0FDeEQsOEJBQTRCLENBQzlCLFNBQU8sQ0FDVCxTQUFPLENBQ1AsS0FBSyxBQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUVYLGVBQU8sQUFBQyxDQUFDLEVBQUMsQ0FBQyxBQUFDLENBQUMsS0FBSSxDQUFDLENBQUM7QUFDbkIsZUFBTyxBQUFDLENBQUMsR0FBRSxDQUFDLEFBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQztBQUVwQixXQUFHLE9BQU8sQUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQ2YsV0FBRyxPQUFPLEFBQUMsQ0FBQyxHQUFFLENBQUMsQ0FBQztBQUVoQixVQUFFLENBQUUsQ0FBQSxDQUFDLGlCQUFpQixBQUFDLENBQUUscUJBQW9CLENBQUcsVUFBUyxBQUFELENBQUc7QUFDekQsYUFBSSxDQUFDLFFBQU8sS0FBSyxVQUFVLFNBQVMsQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFFO0FBQ2hELG1CQUFPLEtBQUssVUFBVSxJQUFJ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SUNBN0IsbUJBQWlCLEVBQXhCLENBQUEsTUFBSyxJQUFJLEFBQUMsaUNBQWtCO0lBQ3JCLHFCQUFtQixFQUQxQixDQUFBLE1BQUssSUFBSSxBQUFDLHFDQUFrQjtJQUVyQixvQkFBa0IsRUFGekIsQ0FBQSxNQUFLLElBQUksQUFBQyxtQ0FBa0I7QUFBNUIsQUFBSSxJQUFBLENBQUEsVUFBUyxFQUlFLENBQUEsT0FBTSxPQUFPLEFBQUMsQ0FBQyxVQUFTLENBQUcsRUFBQyxvQkFBbUIsQ0FBRyxrQkFBZ0IsQ0FBRyxZQUFVLENBQUMsQ0FBQyxRQUN2RixBQUFDLENBQUMsZUFBYyxDQUFHLHFCQUFtQixDQUFDLFFBQ3ZDLEFBQUMsQ0FBQyxtQkFBa0IsQ0FBRyxVQUFTLEtBQUksQ0FBRztBQUM1QyxTQUFPLENBQUEsS0FBSSxtQkFBbUIsQUFBQyxDQUFDLGVBQWMsQ0FBQyxDQUFDO0VBQ2xELENBQUMsVUFDUSxBQUFDLENBQUMsV0FBVSxDQUFHLG1CQUFpQixDQUFDLFVBQ2pDLEFBQUMsQ0FBQyxZQUFXLENBQUcsb0JBQWtCLENBQUMsQUFWYixDQUFBO0FBQWpDLFNBQUEsYUFBd0I7QUFBRSx1QkFBd0I7SUFBRSxFQUE3QjtBQUVqQixDQUZ3RCxDQUFDO0FBQS9ELEtBQUssSUFBSSxBQUFDLENBQUMsMEJBQW1CLEdBQUMsQ0FBQyxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy90c2h1c2hhbi9kZXYvTGVvbmFyZG8vdGVtcG91dE1DNDFOek00TkRrNE5USTJOakkxTXpNMS5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGFjdGl2YXRvckRpcmVjdGl2ZSgkY29tcGlsZSkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0pIHtcbiAgICAgIHZhciBlbCA9IGFuZ3VsYXIuZWxlbWVudCgnPGRpdiBuZy1jbGljaz1cImFjdGl2YXRlKClcIiBjbGFzcz1cImxlb25hcmRvLWFjdGl2YXRvclwiPjwvZGl2PicpO1xuXG4gICAgICB2YXIgd2luID0gYW5ndWxhci5lbGVtZW50KFtcbiAgICAgICc8ZGl2IGNsYXNzPVwibGVvbmFyZG8td2luZG93XCI+JyxcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJsZW9uYXJkby1oZWFkZXJcIj5MZW9uYXJkbyBDb25maWd1cmF0aW9uPC9kaXY+JyxcbiAgICAgICAgICAnPHdpbmRvdy1ib2R5Pjwvd2luZG93LWJvZHk+JyxcbiAgICAgICAgJzwvZGl2PicsXG4gICAgICAnPC9kaXY+J1xuICAgICAgXS5qb2luKCcnKSk7XG5cbiAgICAgICRjb21waWxlKGVsKShzY29wZSk7XG4gICAgICAkY29tcGlsZSh3aW4pKHNjb3BlKTtcblxuICAgICAgZWxlbS5hcHBlbmQoZWwpO1xuICAgICAgZWxlbS5hcHBlbmQod2luKTtcblxuICAgICAgd2luWzBdLmFkZEV2ZW50TGlzdGVuZXIoICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoJ3B1bGwtdG9wJykpe1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChcInB1bGwtdG9wLWNsb3NlZFwiKTtcbiAgICAgICAgfVxuICAgICAgfSwgZmFsc2UgKTtcblxuICAgICAgc2NvcGUuYWN0aXZhdGUgPSBmdW5jdGlvbigpe1xuICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKCdwdWxsLXRvcCcpKSB7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdwdWxsLXRvcCcpO1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgncHVsbC10b3AtY2xvc2VkJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdwdWxsLXRvcCcpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWN0aXZhdG9yRGlyZWN0aXZlIiwiZnVuY3Rpb24gY29uZmlndXJhdGlvblNlcnZpY2UoJHEsIGFjdGl2ZVN0YXRlc1N0b3JlLCAkaHR0cEJhY2tlbmQpIHtcbiAgdmFyIHN0YXRlcyA9IFtdO1xuICB2YXIgc3RhdGVSZXEgPSB7fTtcblxuICB2YXIgdXBzZXJ0T3B0aW9uID0gZnVuY3Rpb24oc3RhdGUsIG5hbWUsIGFjdGl2ZSkge1xuICAgIHZhciBfc3RhdGVzID0gZ2V0U3RhdGVzRnJvbVN0b3JlKCk7XG4gICAgX3N0YXRlc1tzdGF0ZV0gPSB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgYWN0aXZlOiBhY3RpdmVcbiAgICB9O1xuXG4gICAgYWN0aXZlU3RhdGVzU3RvcmUuc2V0KCdzdGF0ZXMnLCBfc3RhdGVzKTtcblxuICAgIHJldHVybiBzeW5jKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0U3RhdGVzRnJvbVN0b3JlKCl7XG4gICAgcmV0dXJuIGFjdGl2ZVN0YXRlc1N0b3JlLmdldCgnc3RhdGVzJykgfHwge307XG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaFN0YXRlcygpe1xuICAgIHZhciBhY3RpdmVTdGF0ZXMgPSBnZXRTdGF0ZXNGcm9tU3RvcmUoKTtcbiAgICB2YXIgX3N0YXRlcyA9IHN0YXRlcy5tYXAoc3RhdGUgPT4gYW5ndWxhci5jb3B5KHN0YXRlKSk7XG5cbiAgICBfc3RhdGVzLmZvckVhY2goZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgIGxldCBvcHRpb24gPSBhY3RpdmVTdGF0ZXNbc3RhdGUubmFtZV07XG4gICAgICBzdGF0ZS5hY3RpdmUgPSAhIW9wdGlvbiAmJiBvcHRpb24uYWN0aXZlO1xuICAgICAgc3RhdGUuYWN0aXZlT3B0aW9uID0gISFvcHRpb24gPyBzdGF0ZS5vcHRpb25zLmZpbmQoX29wdGlvbiA9PiBfb3B0aW9uLm5hbWUgPT09IG9wdGlvbi5uYW1lKSA6IHN0YXRlLm9wdGlvbnNbMF07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHEud2hlbihfc3RhdGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlYWN0aXZhdGVBbGwoKSB7XG4gICAgdmFyIF9zdGF0ZXMgPSBnZXRTdGF0ZXNGcm9tU3RvcmUoKTtcbiAgICBPYmplY3Qua2V5cyhfc3RhdGVzKS5mb3JFYWNoKGZ1bmN0aW9uKHN0YXRlS2V5KSB7XG4gICAgICBfc3RhdGVzW3N0YXRlS2V5XS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9KTtcbiAgICBhY3RpdmVTdGF0ZXNTdG9yZS5zZXQoJ3N0YXRlcycsIF9zdGF0ZXMpO1xuXG4gICAgcmV0dXJuIHN5bmMoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRTdGF0ZU9wdGlvbihuYW1lKXtcbiAgICByZXR1cm4gZmV0Y2hTdGF0ZXMoKS50aGVuKGZ1bmN0aW9uKHN0YXRlcyl7XG4gICAgICByZXR1cm4gc3RhdGVzLmZpbmQoc3RhdGUgPT4gc3RhdGUubmFtZSA9PT0gbmFtZSkuYWN0aXZlT3B0aW9uO1xuICAgIH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiBzeW5jKCl7XG4gICAgcmV0dXJuIGZldGNoU3RhdGVzKCkudGhlbihmdW5jdGlvbihzdGF0ZXMpIHtcbiAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcHJvbWlzZSA9IGRlZmVyLnByb21pc2U7XG4gICAgICBkZWZlci5yZXNvbHZlKCk7XG4gICAgICBzdGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcHJvbWlzZSA9IHByb21pc2UudGhlbihmdW5jdGlvbigpe1xuICAgICAgICAgIHJldHVybiBmaW5kU3RhdGVPcHRpb24oc3RhdGUubmFtZSkudGhlbihmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgc3RhdGVSZXFbc3RhdGUubmFtZV0ucmVzcG9uZChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy92YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIC8vJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gIGRlZmVycmVkLnJlc29sdmUoW29wdGlvbi5zdGF0dXMsIG9wdGlvbi5kYXRhXSk7XG4gICAgICAgICAgICAgICAgLy99LCBvcHRpb24uZGVsYXkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbb3B0aW9uLnN0YXR1cywgb3B0aW9uLmRhdGFdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBzdGF0ZVJlcVtzdGF0ZS5uYW1lXS5wYXNzVGhyb3VnaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9KTtcbiAgfVxuXG4gIHZhciBpbml0aWFsaXplZCA9IGZldGNoU3RhdGVzKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAoc3RhdGVzIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgc3RhdGVSZXFbc3RhdGUubmFtZV0gPSAkaHR0cEJhY2tlbmQud2hlbihzdGF0ZS52ZXJiIHx8ICdHRVQnLCBuZXcgUmVnRXhwKHN0YXRlLnVybCkpO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIC8vY29uZmlndXJlZCBzdGF0ZXMgdG9kbyBkb2NcbiAgICBzdGF0ZXM6IHN0YXRlcyxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIGluaXRpYWxpemVkLnRoZW4oc3luYyk7XG4gICAgfSxcbiAgICAvL3RvZG8gZG9jXG4gICAgYWN0aXZlX3N0YXRlc19vcHRpb246IFtdLFxuICAgIC8vdG9kbyBkb2NcbiAgICB1cHNlcnRPcHRpb246IHVwc2VydE9wdGlvbixcbiAgICAvL3RvZG8gZG9jXG4gICAgZmV0Y2hTdGF0ZXM6IGZldGNoU3RhdGVzLFxuICAgIGdldFN0YXRlOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHJldHVybiBmZXRjaFN0YXRlcygpLnRoZW4oZnVuY3Rpb24oc3RhdGVzKXtcbiAgICAgICAgdmFyIHN0YXRlID0gc3RhdGVzLmZpbmQoc3RhdGUgPT4gc3RhdGUubmFtZSA9PT0gbmFtZSk7XG4gICAgICAgIHJldHVybiAoc3RhdGUgJiYgc3RhdGUuYWN0aXZlICYmIGZpbmRTdGF0ZU9wdGlvbihuYW1lKSkgfHwgJHEud2hlbihudWxsKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgLy9pbnNlcnQgb3IgcmVwbGFjZSBhbiBvcHRpb24gYnkgaW5zZXJ0IG9yIHVwZGF0ZWluZyBhIHN0YXRlLlxuICAgIHVwc2VydDogZnVuY3Rpb24oeyB2ZXJiLCBzdGF0ZSwgbmFtZSwgdXJsLCBzdGF0dXMgPSAyMDAsIGRhdGEgPSB7fSwgZGVsYXkgPSAwfSl7XG4gICAgICB2YXIgZGVmYXVsdFN0YXRlID0ge307XG5cbiAgICAgIHZhciBkZWZhdWx0T3B0aW9uID0ge307XG5cbiAgICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjYW5ub3QgdXBzZXJ0IC0gc3RhdGUgaXMgbWFuZGF0b3J5XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBzdGF0ZUl0ZW0gPSBzdGF0ZXMuZmluZChfc3RhdGUgPT4gX3N0YXRlLm5hbWUgPT09IHN0YXRlKSB8fCBkZWZhdWx0U3RhdGU7XG5cbiAgICAgIGFuZ3VsYXIuZXh0ZW5kKHN0YXRlSXRlbSwge1xuICAgICAgICBuYW1lOiBzdGF0ZSxcbiAgICAgICAgdXJsOiB1cmwgfHwgc3RhdGVJdGVtLnVybCxcbiAgICAgICAgdmVyYjogdmVyYiB8fCBzdGF0ZUl0ZW0udmVyYixcbiAgICAgICAgb3B0aW9uczogc3RhdGVJdGVtLm9wdGlvbnMgfHwgW11cbiAgICAgIH0pO1xuXG5cbiAgICAgIGlmIChzdGF0ZUl0ZW0gPT09IGRlZmF1bHRTdGF0ZSkge1xuICAgICAgICBzdGF0ZXMucHVzaChzdGF0ZUl0ZW0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3B0aW9uID0gc3RhdGVJdGVtLm9wdGlvbnMuZmluZChfb3B0aW9uID0+IF9vcHRpb24ubmFtZSA9PT0gbmFtZSkgfHwgZGVmYXVsdE9wdGlvbjtcblxuICAgICAgYW5ndWxhci5leHRlbmQob3B0aW9uLCB7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICBkZWxheTogZGVsYXlcbiAgICAgIH0pO1xuXG4gICAgICBpZiAob3B0aW9uID09PSBkZWZhdWx0T3B0aW9uKSB7XG4gICAgICAgIHN0YXRlSXRlbS5vcHRpb25zLnB1c2gob3B0aW9uKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIC8vdG9kbyBkb2NcbiAgICB1cHNlcnRNYW55OiBmdW5jdGlvbihpdGVtcyl7XG4gICAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4gdGhpcy51cHNlcnQoaXRlbSkpO1xuICAgIH0sXG4gICAgZGVhY3RpdmF0ZUFsbDogZGVhY3RpdmF0ZUFsbFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjb25maWd1cmF0aW9uU2VydmljZTsiLCIvLyBUaGlzIElzIEEgSGVhZGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cblxuLy8gVGhpcyBpcyBhIG5vcm1hbCBjb21tZW50LCB0aGF0IHdpbGwgYmVjb21lIHBhcnQgb2YgdGhlXG4vLyBhbm5vdGF0aW9ucyBhZnRlciBydW5uaW5nIHRocm91Z2ggdGhlIERvY2NvIHRvb2wuIFVzZSB0aGlzXG4vLyBzcGFjZSB0byBkZXNjcmliZSB0aGUgZnVuY3Rpb24gb3Igb3RoZXIgY29kZSBqdXN0IGJlbG93XG4vLyB0aGlzIGNvbW1lbnQuIEZvciBleGFtcGxlOlxuLy9cbi8vIFRoZSBgRG9Tb21ldGhpbmdgIG1ldGhvZCBkb2VzIHNvbWV0aGluZyEgSXQgZG9lc24ndCB0YWtlIGFueVxuLy8gcGFyYW1ldGVycy4uLiBpdCBqdXN0IGRvZXMgc29tZXRoaW5nLlxuZnVuY3Rpb24gd2luZG93Qm9keURpcmVjdGl2ZSgkaHR0cCwgY29uZmlndXJhdGlvbikge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgdGVtcGxhdGVVcmw6ICd3aW5kb3ctYm9keS5odG1sJyxcbiAgICBzY29wZTogdHJ1ZSxcbiAgICByZXBsYWNlOiB0cnVlLFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSl7XG4gICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtID0gJ2FjdGl2YXRlJztcbiAgICAgICRzY29wZS5Ob3RoYXNVcmwgPSBmdW5jdGlvbihvcHRpb24pe1xuICAgICAgICByZXR1cm4gIW9wdGlvbi51cmw7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmhhc1VybCA9IGZ1bmN0aW9uKG9wdGlvbil7XG4gICAgICAgIHJldHVybiAhIW9wdGlvbi51cmw7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuc3RhdGVzLmZvckVhY2goZnVuY3Rpb24oc3RhdGUpe1xuICAgICAgICAgICAgc3RhdGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25maWd1cmF0aW9uLmRlYWN0aXZhdGVBbGwoKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS51cGRhdGVTdGF0ZSA9IGZ1bmN0aW9uKHN0YXRlKXtcbiAgICAgICAgY29uc29sZS5sb2coYHVwZGF0ZSBzdGF0ZTogJHtzdGF0ZS5uYW1lfSAke3N0YXRlLmFjdGl2ZU9wdGlvbi5uYW1lfSAke3N0YXRlLmFjdGl2ZX1gKTtcbiAgICAgICAgY29uZmlndXJhdGlvbi51cHNlcnRPcHRpb24oc3RhdGUubmFtZSwgc3RhdGUuYWN0aXZlT3B0aW9uLm5hbWUsIHN0YXRlLmFjdGl2ZSk7XG4gICAgICB9O1xuXG4gICAgICBjb25maWd1cmF0aW9uLmZldGNoU3RhdGVzKCkudGhlbihmdW5jdGlvbihzdGF0ZXMpe1xuICAgICAgICAkc2NvcGUuc3RhdGVzID0gc3RhdGVzO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSkge1xuICAgICAgc2NvcGUudGVzdCA9IHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgdmFsdWU6IHVuZGVmaW5lZFxuICAgICAgfTtcblxuICAgICAgc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24odXJsKXtcbiAgICAgICAgc2NvcGUudGVzdC52YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgc2NvcGUudXJsID0gdXJsO1xuICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgJGh0dHAuZ2V0KHVybCkuc3VjY2VzcyhmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICBzY29wZS50ZXN0LnZhbHVlID0gcmVzO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgd2luZG93Qm9keURpcmVjdGl2ZSIsImltcG9ydCBhY3RpdmF0b3JEaXJlY3RpdmUgZnJvbSAnLi9hY3RpdmF0b3IuZHJ2LmpzJztcbmltcG9ydCBjb25maWd1cmF0aW9uU2VydmljZSBmcm9tICcuL2NvbmZpZ3VyYXRpb24uc3J2LmpzJztcbmltcG9ydCB3aW5kb3dCb2R5RGlyZWN0aXZlIGZyb20gJy4vd2luZG93LWJvZHkuZHJ2LmpzJztcblxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoJ2xlb25hcmRvJywgWydsZW9uYXJkby50ZW1wbGF0ZXMnLCAnYW5ndWxhci1zdG9yYWdlJywgJ25nTW9ja0UyRSddKVxuICAuZmFjdG9yeSgnY29uZmlndXJhdGlvbicsIGNvbmZpZ3VyYXRpb25TZXJ2aWNlKVxuICAuZmFjdG9yeSgnYWN0aXZlU3RhdGVzU3RvcmUnLCBmdW5jdGlvbihzdG9yZSkge1xuICAgIHJldHVybiBzdG9yZS5nZXROYW1lc3BhY2VkU3RvcmUoJ2FjdGl2ZV9zdGF0ZXMnKTtcbiAgfSlcbiAgLmRpcmVjdGl2ZSgnYWN0aXZhdG9yJywgYWN0aXZhdG9yRGlyZWN0aXZlKVxuICAuZGlyZWN0aXZlKCd3aW5kb3dCb2R5Jywgd2luZG93Qm9keURpcmVjdGl2ZSk7XG5cbiJdfQ==
