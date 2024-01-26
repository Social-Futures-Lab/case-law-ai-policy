'use strict';

function loadHTMLChart(id, caseName) {
  let htmlFilepath = "https://social.cs.washington.edu/case-law-ai-policy/assets/charts/" + caseName + ".html";
  $(id).load(htmlFilepath);
}

function boldNameAndAffiliation(id) {
  document.getElementById(id).style.fontWeight = 700;
  if (id === "king") {
    document.getElementsByClassName("independent")[0].style.fontWeight = 700;
  } else {
    document.getElementsByClassName("uw")[0].style.fontWeight = 700;
  }
}

function unboldNameAndAffiliation(id) {
  document.getElementById(id).style.fontWeight = 400;
  if (id === "king") {
    document.getElementsByClassName("independent")[0].style.fontWeight = 400;
  } else {
    document.getElementsByClassName("uw")[0].style.fontWeight = 400;
  }
}

function fetchDimensions(input_id) {
  return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/cases.json')
  .then(function (response) {
    return response.json();
  })
  .then (function (data) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].id === input_id) {
        let target = document.getElementById('dimensions-display');
        let dimensions = data[i].dimensions;
        let innerHTML = "";
        for (let j = 0; j < dimensions.length; j++) {
          let dimension = dimensions[j];
          let cardHTML = `<div class="card dimension-card" style="width: 18rem;"><div class="card-header">${dimension.description}</div><ul class="list-group list-group-flush"><li class="list-group-item"><span class="quote-text">${dimension.quote}</span></li></ul></div>`;
          innerHTML += cardHTML;
        }
        target.innerHTML = innerHTML;
        document.getElementById('dimensions-placeholder').style.display = "none";
      }
    }
  })
}

function revealDimensionSelector(input_id) {
  document.getElementById('generated-case').style.display = "none";
  document.getElementById('level-selector').style.display = "none";

  sessionStorage.setItem('selectedCaseID', input_id);
  return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/cases.json')
  .then(function (response) {
    return response.json();
  })
  .then (function (data) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].id === input_id) {
        let target = document.getElementById('dimension-selector');
        let dimensions = data[i].dimensions;
        let innerHTML = "<option selected>Select dimension</option>";
        for (let j = 0; j < dimensions.length; j++) {
          let dimension = dimensions[j];
          let formOptionHTML = `<option value=${j+1}>${dimension.description}</option>`;
          innerHTML += formOptionHTML;
        }
        target.innerHTML = innerHTML;
        document.getElementById('dimension-selector').style.display = "block";
      }
    }
  })
}

function revealLevelSelector() {
  document.getElementById('dimension-selector').addEventListener('change', function () {
    document.getElementById('generated-case').style.display = "none";
    let dimensionSelector = document.getElementById('dimension-selector');
    let selectedDimensionIndex = dimensionSelector.value;
    if (dimensionSelector.options[selectedDimensionIndex]) {
      sessionStorage.setItem('selectedDimension', dimensionSelector.options[selectedDimensionIndex].text);
      let target = document.getElementById('level-selector');

      return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/cases.json')
      .then(function (response) {
        return response.json();
      })
      .then (function (data) {
        let selectedCaseID = sessionStorage.getItem('selectedCaseID');
        let generatedAssets = data.find(x => x.id === selectedCaseID).dimensions[selectedDimensionIndex-1].generated
        let innerHTML = "<option selected>Select level</option>";
        for (let j = 0; j < generatedAssets.length; j++) {
          let level = generatedAssets[j].level;
          let formOptionHTML = `<option value=${j+1}>${level}</option>`;
          innerHTML += formOptionHTML;
        }
        target.innerHTML = innerHTML;
        document.getElementById('level-selector').style.display = "block";
      })

    } else {
      document.getElementById('level-selector').style.display = "none";
    }

  })
}

function generatedCaseSelector() {
  document.getElementById('level-selector').addEventListener('change', function () {
    let levelSelector = document.getElementById('level-selector');
    let selectedLevelIndex = levelSelector.value;
    let target = document.getElementById('generated-case');
    let targetWrapper = document.getElementsByClassName('chat-ui-wrapper')[1];
    if (levelSelector.options[selectedLevelIndex]) {
      target.innerHTML = "";

      return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/cases.json')
      .then(function (response) {
        return response.json();
      })
      .then (function (data) {
        let selectedCaseID = sessionStorage.getItem('selectedCaseID');
        let findCase = data.find(x => x.id === selectedCaseID)
        let selectedDimension = sessionStorage.getItem('selectedDimension');
        let findDimension = findCase.dimensions.find(x => x.description === selectedDimension);
        let generatedCase = findDimension.generated[selectedLevelIndex-1].response;
        target.style.display = "block";
        targetWrapper.style.display = "block";

        let i = 0;
        function typewriterEffect() {
          if (i < generatedCase.length) {
            target.innerHTML += generatedCase.charAt(i);
            i++;
            setTimeout(typewriterEffect, 0.1);
          }
        }

        setTimeout(() => { typewriterEffect(); }, 500);

        // target.innerHTML = generatedCase;
      })

    } else {
      target.style.display = "none";
      targetWrapper.style.display = "none";
    }


  })
}

function getResponseFromTemplate(templateID) {
  let caseSelector = document.getElementById('case-selector');
  // let selectedValue = caseSelector.value;
  // caseSelector.addEventListener('change', function () {
  //   sessionStorage.setItem('caseValueIndex', selectedValue);
  // });


  return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/response-explorer-data-example.json')
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
        let i = 0, isTag, text;
        // target.innerHTML = response;
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

    return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/response-explorer-data-example.json')
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

  return fetch('https://social.cs.washington.edu/case-law-ai-policy/assets/response-explorer-data-example.json')
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

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    let elementID = entry.target.id;
    const { width, height } = entry.contentRect;
    if (elementID === "case-select" || elementID === "case-select-p2") {
      let element = document.getElementById(elementID);
      if (width > 1200) {
        element.style.justifyContent = "center";
      } else {
        element.style.justifyContent = "flex-start";
      }
    }
    if (elementID === "dimensions-display") {
      if (width > 1000) {
        document.getElementById('dimensions-display').style.justifyContent = "center";
      } else {
        document.getElementById('dimensions-display').style.justifyContent = "flex-start";
      }
    }
  }
})


window.onload = function () {
  loadCaseOptions();
  revealCaseAndTemplates();

  resizeObserver.observe(document.getElementById('case-select'));
  resizeObserver.observe(document.getElementById('case-select-p2'));
  resizeObserver.observe(document.getElementById('dimensions-display'));
  sessionStorage.clear();
}


