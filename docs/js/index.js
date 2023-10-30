'use strict';

(function () {
  function fetchCaseExamples() {
    return fetch('./assets/cases.json').then(function (resp) {
      return resp.json();
    });
  }

  function DemoVisualizeExperts() {

  }

  DemoVisualizeExperts.prototype.renderExpertDimensions = function(caseId) {

  }

  function DemoGenerateCases() {
    // The generated cases are static since it is released to the internet and we don't want to exhaust our API calls

  }

  DemoGeneratedCases.prototype.setInput = function () {

  }

  DemoGenerateCases.prototype.setDimension = function () {

  }

  DemoGenerateCases.prototype.setLevels = function () {

  }

  DemoGenerateCases.prototype.generate = function () {

  }

  DemoGenerateCases.prototype.reset = function () {

  }

  document.addEventListener('load', function () {
    // Do something here
  });
})();
