'use strict';

function getResponseFromTemplate(templateID) {
  return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/response-explorer-data.json')
    .then(function (response) {
      return response.json();
    })
    .then (function (data) {


      let startTimeStamp = Date.now();
      sessionStorage.setItem('startTimeStamp', startTimeStamp);
      let target = document.getElementById('templated-response');
      target.innerHTML = "";
      document.getElementsByClassName('chat-ui-wrapper')[0].style.display = "block";
      target.style.display = "block";

      // find the case based on the selected case ID and response template based on the selected template ID
      let caseValueIndex = parseInt(sessionStorage.getItem('caseValueIndex'));
      let response = data[caseValueIndex-1].responses.find(x => x.template === templateID).response;

      if (templateID === "content-violation") {
        target.innerHTML = response;
      } else {
        response = marked.parse(response);
        let i = 0, isTag, text;

        function typewriterEffectFormatted() {
          let latestStartTime = parseInt(sessionStorage.getItem('startTimeStamp'));
          if (latestStartTime !== startTimeStamp) return;

          text = response.slice(0, ++i);
          if (text === response) return;

          target.innerHTML = text;

          var char = text.slice(-1);
          if( char === '<' ) isTag = true;
          if( char === '>' ) isTag = false;

          if (isTag) return typewriterEffectFormatted();
          setTimeout(typewriterEffectFormatted, 0.1);
        }

        setTimeout(() => { typewriterEffectFormatted();}, 500);
      }
    })


}

function revealCaseAndTemplates() {
  let caseSelector = document.getElementById('case-selector');
  let target = document.getElementById('selected-case');

  caseSelector.addEventListener('change', function () {
    document.getElementById('templated-response').innerHTML = "";
    let caseAndTemplates = document.getElementById('case-and-templates');
    caseAndTemplates.style.display = "block";
    let caseValueIndex = caseSelector.value;
    sessionStorage.setItem('caseValueIndex', caseValueIndex);

    return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/response-explorer-data.json')
    .then(function (response) {
      return response.json();
    })
    .then (function (data) {
      let selectedCase = data[caseValueIndex-1];
      let innerHTML = `<h5 class="card-title">Please select a case first!</h5>`
      if (selectedCase) {
        innerHTML = `<h5 class="card-title">${selectedCase.id}</h5><p class="card-text">${selectedCase.content}</p>`;
      }

      target.innerHTML = innerHTML;
    })
  });
}

function loadCaseOptions() {
  let target = document.getElementById('case-selector');

  return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/response-explorer-data.json')
  .then(function (response) {
    return response.json();
  })
  .then (function (data) {
    let innerHTML = "<option selected>Select a case...</option>";
    for (let i = 0; i < data.length; i++) {
      let id = data[i].id;
      let formOptionHTML = `<option value=${i+1}>${id}</option>`;
      innerHTML += formOptionHTML;
    }
    target.innerHTML = innerHTML;
  })
}


window.onload = function () {
  loadCaseOptions();
  revealCaseAndTemplates();
  sessionStorage.clear();
}


