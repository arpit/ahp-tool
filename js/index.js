const goalInput = document.getElementById("goal");
const criteriaInputs = document.querySelectorAll('#criteria_taginput input[type="text"]');
const itemInputs = document.querySelectorAll('#items_taginput input[type="text"]');
const pairwiseInputs = document.querySelectorAll('.pairwisetable input');

let updateCriteriaTable = function(input) {
  let classToUpdate = "." + input.target.id;
  let value = input.target.value;

  document.querySelectorAll(classToUpdate).forEach(function(heading) {
    heading.innerHTML = value;
  });

  saveInputValue(input.target)
  updateCriteriaActiveClass(getIndexFromId(input.target.id));
  refreshCriteriaVisibility();
}

let updateItemTables = function(input) {
  let querySelectorToUpdate = "th." + input.target.id;
  let value = input.target.value;

  document.querySelectorAll(querySelectorToUpdate).forEach(function(heading) {
    heading.innerHTML = value;
  });

  saveInputValue(input.target)
  updateItemActiveClass(getIndexFromId(input.target.id));
  refreshItemVisibility();
}

/* Begin Enable / Disable (checkbox toggles whether a criterion/option counts) */

let getIndexFromId = function(id) {
  return parseInt(id.replace(/^\D+/, ''), 10);
}

let isCriteriaEnabled = function(idx) {
  let box = document.getElementById('criteria' + idx + '_enabled');
  return !box || box.checked;
}

let isItemEnabled = function(idx) {
  let box = document.getElementById('item' + idx + '_enabled');
  return !box || box.checked;
}

let updateCriteriaActiveClass = function(idx) {
  let input = document.getElementById('criteria' + idx);
  let activeClass = 'active_crit' + idx;
  let shouldBeActive = !!input.value && isCriteriaEnabled(idx);
  document.getElementById('pairwise_criteria').classList.toggle(activeClass, shouldBeActive);
  document.getElementById('pairwise_items').classList.toggle(activeClass, shouldBeActive);
}

let updateItemActiveClass = function(idx) {
  let input = document.getElementById('item' + idx);
  let activeClass = 'active_item' + idx;
  let shouldBeActive = !!input.value && isItemEnabled(idx);
  document.getElementById('pairwise_items').classList.toggle(activeClass, shouldBeActive);
}

let saveEnabledState = function(prefix, idx) {
  let box = document.getElementById(prefix + idx + '_enabled');
  let key = 'ahp.' + prefix + idx + '.enabled';
  if (box.checked) {
    localStorage.removeItem(key); // enabled is the default; only persist the exception
  } else {
    localStorage.setItem(key, '0');
  }
}

let loadEnabledState = function(prefix, idx) {
  let box = document.getElementById(prefix + idx + '_enabled');
  box.checked = localStorage.getItem('ahp.' + prefix + idx + '.enabled') !== '0';
}

let bindEnableCheckbox = function(box, prefix) {
  box.addEventListener('change', function() {
    let idx = parseInt(box.dataset.index, 10);
    let tagItem = box.closest('.tag-item');
    tagItem.classList.toggle('is-disabled', !box.checked);
    saveEnabledState(prefix, idx);
    if (prefix === 'criteria') {
      updateCriteriaActiveClass(idx);
    } else {
      updateItemActiveClass(idx);
    }
  });
}

/* End Enable / Disable */

/* Begin Tag Input (add/remove criteria & options as chips) */

let getCriteriaCount = function() {
  let n = 0;
  while (n < 8 && document.getElementById('criteria' + n).value) n++;
  return n;
}

let getItemCount = function() {
  let n = 0;
  while (n < 8 && document.getElementById('item' + n).value) n++;
  return n;
}

let refreshTagGroup = function(prefix, count, placeholder) {
  for (let i = 0; i < 8; i++) {
    let input = document.getElementById(prefix + i);
    let tagItem = input.closest('.tag-item');
    let checkbox = tagItem.querySelector('.tag-enable');
    let editBtn = tagItem.querySelector('.tag-edit');
    let removeBtn = tagItem.querySelector('.tag-remove');

    if (i < count) {
      tagItem.classList.remove('is-hidden');
      tagItem.classList.add('is-chip');
      tagItem.classList.toggle('is-disabled', !checkbox.checked);
      editBtn.classList.remove('is-hidden');
      removeBtn.classList.remove('is-hidden');
      input.placeholder = '';
    } else if (i === count) {
      tagItem.classList.remove('is-hidden');
      tagItem.classList.remove('is-chip');
      tagItem.classList.remove('is-disabled');
      editBtn.classList.add('is-hidden');
      removeBtn.classList.add('is-hidden');
      input.placeholder = placeholder;
    } else {
      tagItem.classList.add('is-hidden');
    }

    input.size = Math.max((input.value || input.placeholder || '').length, 6);
  }
}

let refreshCriteriaVisibility = function() {
  refreshTagGroup('criteria', getCriteriaCount(), '+ Add criterion');
}

let refreshItemVisibility = function() {
  refreshTagGroup('item', getItemCount(), '+ Add option');
}

// Compacts an n x n matrix of <input> cells by removing row/column k and
// shifting everything after it up/left by one; the vacated last row/column
// is reset back to the blank template (diagonal = 1, everything else empty).
let compactMatrix = function(n, k, getCell, setCell) {
  if (k < 0 || k >= n) return;

  let order = [];
  for (let i = 0; i < n; i++) {
    if (i !== k) order.push(i);
  }

  let compacted = order.map(function(row) {
    return order.map(function(col) {
      return getCell(row, col);
    });
  });

  for (let i = 0; i < order.length; i++) {
    for (let j = 0; j < order.length; j++) {
      setCell(i, j, compacted[i][j]);
    }
  }

  let last = n - 1;
  for (let j = 0; j < n; j++) {
    setCell(last, j, j === last ? '1' : '');
    setCell(j, last, j === last ? '1' : '');
  }
}

let copyItemSection = function(fromIdx, toIdx) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      document.getElementById('c' + toIdx + '_item' + r + 'v' + c).value =
        document.getElementById('c' + fromIdx + '_item' + r + 'v' + c).value;
    }
  }
}

let resetItemSection = function(idx) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      document.getElementById('c' + idx + '_item' + r + 'v' + c).value = (r === c) ? '1' : '';
    }
  }
}

let persistAllPairwiseCells = function() {
  document.querySelectorAll('.pairwisetable input[type="text"]').forEach(saveInputValue);
  criteriaInputs.forEach(saveInputValue);
  itemInputs.forEach(saveInputValue);
}

let removeCriteria = function(k) {
  let n = getCriteriaCount();
  if (k < 0 || k >= n) return;

  compactMatrix(n, k,
    function(r, c) { return document.getElementById('criteria' + r + 'v' + c).value; },
    function(r, c, v) { document.getElementById('criteria' + r + 'v' + c).value = v; }
  );

  for (let i = k; i < n - 1; i++) {
    copyItemSection(i + 1, i);
  }
  resetItemSection(n - 1);

  for (let i = k; i < n - 1; i++) {
    document.getElementById('criteria' + i).value = document.getElementById('criteria' + (i + 1)).value;
    document.getElementById('criteria' + i + '_enabled').checked = document.getElementById('criteria' + (i + 1) + '_enabled').checked;
  }
  document.getElementById('criteria' + (n - 1)).value = '';
  document.getElementById('criteria' + (n - 1) + '_enabled').checked = true;

  for (let i = k; i < n; i++) {
    updateCriteriaTable({ target: document.getElementById('criteria' + i), type: 'blur' });
    saveEnabledState('criteria', i);
  }

  persistAllPairwiseCells();
  clearPairwiseStyleClasses();
}

let removeItem = function(m) {
  let n = getItemCount();
  if (m < 0 || m >= n) return;

  for (let g = 0; g < 8; g++) {
    compactMatrix(n, m,
      function(r, c) { return document.getElementById('c' + g + '_item' + r + 'v' + c).value; },
      function(r, c, v) { document.getElementById('c' + g + '_item' + r + 'v' + c).value = v; }
    );
  }

  for (let i = m; i < n - 1; i++) {
    document.getElementById('item' + i).value = document.getElementById('item' + (i + 1)).value;
    document.getElementById('item' + i + '_enabled').checked = document.getElementById('item' + (i + 1) + '_enabled').checked;
  }
  document.getElementById('item' + (n - 1)).value = '';
  document.getElementById('item' + (n - 1) + '_enabled').checked = true;

  for (let i = m; i < n; i++) {
    updateItemTables({ target: document.getElementById('item' + i), type: 'blur' });
    saveEnabledState('item', i);
  }

  persistAllPairwiseCells();
  clearPairwiseStyleClasses();
}

let bindTagInput = function(input, prefix) {
  input.addEventListener('input', function() {
    input.size = Math.max(input.value.length, 6);
  });
  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      let idx = parseInt(input.id.replace(prefix, ''), 10);
      input.blur();
      let next = document.getElementById(prefix + (idx + 1));
      if (next) {
        setTimeout(function() { next.focus(); }, 0);
      }
    }
  });
}

let editTagViaPrompt = function(prefix, idx, label) {
  let input = document.getElementById(prefix + idx);
  let newValue = window.prompt('Edit ' + label, input.value);
  if (newValue === null) return; // cancelled

  newValue = newValue.trim();
  if (!newValue) return; // ignore blanking out via prompt; use the remove button instead

  input.value = newValue;
  input.dispatchEvent(new Event('blur', { bubbles: true }));
}

document.querySelectorAll('#criteria_taginput .tag-edit').forEach(function(btn) {
  btn.addEventListener('click', function() {
    editTagViaPrompt('criteria', parseInt(btn.dataset.index, 10), 'criterion');
  });
});

document.querySelectorAll('#items_taginput .tag-edit').forEach(function(btn) {
  btn.addEventListener('click', function() {
    editTagViaPrompt('item', parseInt(btn.dataset.index, 10), 'option');
  });
});

document.querySelectorAll('#criteria_taginput .tag-remove').forEach(function(btn) {
  btn.addEventListener('click', function() {
    removeCriteria(parseInt(btn.dataset.index, 10));
    refreshCriteriaVisibility();
  });
});

document.querySelectorAll('#items_taginput .tag-remove').forEach(function(btn) {
  btn.addEventListener('click', function() {
    removeItem(parseInt(btn.dataset.index, 10));
    refreshItemVisibility();
  });
});

document.querySelectorAll('#criteria_taginput .tag-enable').forEach(function(box) {
  bindEnableCheckbox(box, 'criteria');
});

document.querySelectorAll('#items_taginput .tag-enable').forEach(function(box) {
  bindEnableCheckbox(box, 'item');
});

/* End Tag Input */

let getRelatedInputId = function(activeInputId) {
  let type = activeInputId.substring(0, activeInputId.length-3);
  let indexes = activeInputId.slice(-3).split('v');
  return type + indexes[1] + 'v' + indexes[0];
}

let valueHasForwardSlash = function(value) {
  return value.indexOf('/') !== -1;
}

let clearPairwiseStyleClasses = function(input) {
  // remove all winner, loser & equal_weight classes
  document.querySelectorAll('.winner').forEach(function(node) {
    node.classList.remove('winner');
  });
  document.querySelectorAll('.loser').forEach(function(node) {
    node.classList.remove('loser');
  });
  document.querySelectorAll('.equal_weight').forEach(function(node) {
    node.classList.remove('equal_weight');
  });
  document.querySelectorAll('.related').forEach(function(node) {
    node.classList.remove('related');
  });
}

let getPairwiseInputRow = function(id) {
  // Item Form: c0_item2v0
  // Criteria Form: criteria2v0
  return parseInt(id.substr(-3, 1));
};

let getPairwiseInputColumn = function(id) {
  // Item Form: c0_item2v0
  // Criteria Form: criteria2v0
  return parseInt(id.substr(-1));
};

let getItemSectionId = function(id) {
  // Item Form: c0_item2v0
  // section ID: c0_items
  return id.substr(0,7) + 's';
};

let getItemSectionNumber = function(id) {
  // Item Form: c0_item2v0
  // section ID: c0_items
  return id.substr(1,1);
};


let inputIsCriteria = function(input) {
  return input.id.indexOf('criteria') === 0;
}

let styleRow = function(input, className) {
  let rowIndex = getPairwiseInputRow(input.id);
  if (inputIsCriteria(input)) {
    // input = #criteria0v1
    // row = tr.crit0 th.criteria0
    let row = document.querySelector('tr.crit' + rowIndex);
    row.classList.add(className);
  } else {
    // input = c0_item0v1
    // row = tr.item0
    let row = document.querySelector('tr.crit' + rowIndex);
    let section = getItemSectionId(input.id);
    document.querySelector('#' + section + ' tr.item' + rowIndex).classList.add(className);
  }
}

let styleColumn = function(input, className) {
  let columnIndex = getPairwiseInputColumn(input.id);
  if (inputIsCriteria(input)) {
    // input = #criteria0v1
    // column item = thead th.crit1 or td.crit
    let heading = document.querySelector('th.crit' + columnIndex);
    heading.classList.add(className);
    let columnTDs = document.querySelectorAll('td.crit' + columnIndex);
    columnTDs.forEach(function(td) {
      td.classList.add(className);
    })
  } else {
    // input = c0_item0v1
    // column heading = #c0_items thead th.item1
    // column item = #c0_items td.item1
    let section = getItemSectionId(input.id);
    let heading = document.querySelector('#' + section + ' thead th.item' + columnIndex);
    heading.classList.add(className);
    let columnTDs = document.querySelectorAll('#' + section + ' td.item' + columnIndex);
    columnTDs.forEach(function(td) {
      td.classList.add(className);
    })
  }
}

let styleRowAsWinner = function(input) {
  styleRow(input, 'winner');
}

let styleRowAsLoser = function(input) {
  styleRow(input, 'loser');
}

let styleRowAsEqualWeight = function(input) {
  styleRow(input, 'equal_weight');
}

let styleColumnAsWinner = function(input) {
  styleColumn(input, 'winner');
}

let styleColumnAsLoser = function(input) {
  styleColumn(input, 'loser');
}

let styleColumnAsEqualWeight = function(input) {
  styleColumn(input, 'equal_weight');
}

let clearDescriptiveSentence = function(input) {
  updateDescriptiveSentence(input, true);
}

let updateDescriptiveSentence = function(input, clear) {
  let row = getPairwiseInputRow(input.id);
  let col = getPairwiseInputColumn(input.id);

  if (inputIsCriteria(input)) {
    let A = document.getElementById('criteria'+row).value;
    let B = document.getElementById('criteria'+col).value;
    let sentence = document.getElementById('pairwise_criteria_sentence');
    sentence.innerHTML = clear ? '' : 'Rate '+A+'\'s importance over '+B+' <small>(1=equal, 3=moderate, 5=strong, 9=extreme)</small>'
  } else {
    let item = getItemSectionNumber(input.id);
    let A = document.getElementById('item'+row).value;
    let B = document.getElementById('item'+col).value;
    let I = document.getElementById('criteria'+item).value;
    let sentence = document.getElementById('criteria'+item+'_sentence');
    sentence.innerHTML = clear ? '' : 'For '+I+' rate '+A+'\'s importance over '+B+' <small>(1=equal, 3=moderate, 5=strong, 9=extreme)</small>'
  }
}

let handlePair = function(event) {
  let activeInput = event.target;
  if (event.type == 'blur') {
    clearPairwiseStyleClasses();
    clearDescriptiveSentence(activeInput);
  } else {
    setTimeout(function() {
      let relatedInput = document.getElementById(getRelatedInputId(activeInput.id));
      let activeValue = activeInput.value;
      //let relatedValue = relatedInput.value;

      clearPairwiseStyleClasses();

      if (activeValue) {
        if ( activeInput.readOnly ) {
          // NOP
        } else if (valueHasForwardSlash(activeValue)) {
          relatedInput.value = activeValue.split('/')[1];
          styleRowAsLoser(activeInput);
          styleColumnAsWinner(activeInput);
        } else if (activeValue === "1") {
          relatedInput.value = '1';
          styleRowAsEqualWeight(activeInput);
          styleColumnAsEqualWeight(activeInput);
        } else {
          relatedInput.value = '1/' + activeValue;
          styleRowAsWinner(activeInput);
          styleColumnAsLoser(activeInput);
        }

        if (relatedInput) {
          relatedInput.classList.add('related');
        }
      }
      else {
        // Allow users to delete cell values
        relatedInput.value = '';
        clearPairwiseStyleClasses();
      }

      // Save the data!
      saveInputValue(activeInput);
      saveInputValue(relatedInput);

      updateDescriptiveSentence(activeInput);
    });
  }
}

let saveInputValue = function(input) {
  if ( input.readOnly ) {
    return;
  }

  if ( input.value ) {
    localStorage.setItem( "ahp."+input.id, input.value );
  }
  else {
    localStorage.removeItem( "ahp."+input.id );
  }
}

let loadInputValue = function(input) {
  if ( input.readOnly ) {
    // No action
    return false;
  }

  let value = localStorage.getItem( "ahp."+input.id );

  if ( value ) {
    input.value = value;
  }

  return value ? true : false;
}

loadInputValue(goalInput);

goalInput.addEventListener('blur', function(event) {
  saveInputValue(event.target);
});

criteriaInputs.forEach(function(input) {
  let idx = getIndexFromId(input.id);
  loadEnabledState('criteria', idx);
  input.addEventListener('blur', updateCriteriaTable);
  bindTagInput(input, 'criteria');
  if ( loadInputValue(input) ) {
    updateCriteriaTable({'target':input, 'type':'blur'});
  }
});

itemInputs.forEach(function(input) {
  let idx = getIndexFromId(input.id);
  loadEnabledState('item', idx);
  input.addEventListener('blur', updateItemTables);
  bindTagInput(input, 'item');
  if ( loadInputValue(input) ) {
    updateItemTables({'target':input, 'type':'blur'});
  }
});

refreshCriteriaVisibility();
refreshItemVisibility();

pairwiseInputs.forEach(function(input) {
  input.addEventListener('keyup', handlePair);
  input.addEventListener('blur', handlePair);
  input.addEventListener('focus', handlePair);
  if ( loadInputValue(input) ) {
    handlePair({'target':input, 'type':'blur'});
  }
});

let safeName = function(s) {
  return s.replace(/\W/g, '_');
}

/* Begin Data Management */

let resetForm = function(event) {
  if ( confirm("Completely reset this form and LOSE all of your data?") ) {
    localStorage.clear();
    window.location = window.location.pathname;
  }
}
document.getElementById('datamgmt_reset').addEventListener('click', resetForm);

let exportForm = function(event) {
  document.getElementById("datamgmt").value = JSON.stringify(localStorage);
}
document.getElementById('datamgmt_export').addEventListener('click', exportForm);

let importForm = function(event) {
  try {
    let data = JSON.parse(document.getElementById("datamgmt").value);
    localStorage.clear(); // must follow parse function
    Object.keys(data).forEach(function (k) {
      localStorage.setItem(k, data[k]);
    });
    window.location = window.location.pathname;
  } catch (e) {
    alert("JSON string invalid: "+text.substring(1,32));
  }
}
document.getElementById('datamgmt_import').addEventListener('click', importForm);

// Provide data management textarea instructions that vanish when real content is pasted
const dataManagementHelpText = "paste your exported data here & click import";
function dataManagementRemoveHelpText() {
  let ta = document.getElementById("datamgmt");
  if ( ta.value == dataManagementHelpText ) {
    ta.value = '';
  } else if ( ta.value.length == 0 ) {
    ta.value = dataManagementHelpText;
  }
}
document.getElementById('datamgmt').addEventListener('focus', dataManagementRemoveHelpText);
document.getElementById('datamgmt').addEventListener('blur', dataManagementRemoveHelpText);
dataManagementRemoveHelpText();

/* End Data Management */

let runAHP = function(event) {
  let items = [];
  let criteria = [];
  let criteriaItemRank = {};
  let criteriaRank = [];

  // Only criteria/options that have a label AND are checked "in" count toward
  // the evaluation. Their DOM slot indexes (0-7) are not necessarily
  // contiguous once some are unchecked, so we track both the raw slot index
  // and its compacted position among the active set.
  let criteriaActiveIdx = [];
  let itemActiveIdx = [];

  for (let i = 0; i < 8; i++) {
    let input = document.getElementById('criteria' + i);
    if (input.value && isCriteriaEnabled(i)) {
      criteria.push(safeName(input.value));
      criteriaItemRank[safeName(input.value)] = [];
      criteriaActiveIdx.push(i);
    }
  }

  for (let i = 0; i < 8; i++) {
    let input = document.getElementById('item' + i);
    if (input.value && isItemEnabled(i)) {
      items.push(input.value);
      itemActiveIdx.push(i);
    }
  }

  let itemTotalCheck = items.length;
  let criteriaTotalCheck = criteria.length;

  let criteriaIndexToPos = {};
  criteriaActiveIdx.forEach(function(idx, pos) { criteriaIndexToPos[idx] = pos; });

  let itemIndexToPos = {};
  itemActiveIdx.forEach(function(idx, pos) { itemIndexToPos[idx] = pos; });

  let getPairwiseItemInputCriteriaGroupIndex = function(id) {
    // c0_item2v0
    return parseInt(id.substr(1, 1));
  };

  let getCriteriaKeyNameFromId = function(id) {
    return criteria[criteriaIndexToPos[getPairwiseItemInputCriteriaGroupIndex(id)]];
  };

  let isRowVisible = function(input) {
    let idxSet = inputIsCriteria(input) ? criteriaActiveIdx : itemActiveIdx;
    return idxSet.indexOf(getPairwiseInputRow(input.id)) !== -1;
  }

  let isColumnVisible = function(input) {
    let idxSet = inputIsCriteria(input) ? criteriaActiveIdx : itemActiveIdx;
    return idxSet.indexOf(getPairwiseInputColumn(input.id)) !== -1;
  }

  let isCriteriaGroupVisible = function(input) {
    return criteriaActiveIdx.indexOf(getPairwiseItemInputCriteriaGroupIndex(input.id)) !== -1;
  }

  let isValueTruthy = function(input) {
    return !!input.value;
  }

  let pushToCriteriaItemRank = function(input) {
    // not a pure function but it works... deal with it or make it better ;-)
    const value = eval(input.value); // ooh the hacks to make a fraction string a number!!!
    const id = input.id;
    const groupKey = getCriteriaKeyNameFromId(id);
    const rowIndex = itemIndexToPos[getPairwiseInputRow(id)];

    if(!criteriaItemRank[groupKey]) {
      // group does not exits, so create it
      criteriaItemRank[groupKey] = [];
    }
    if(!criteriaItemRank[groupKey][rowIndex]) {
      // row does not exist, so create it
      criteriaItemRank[groupKey][rowIndex] = []
    }

    criteriaItemRank[groupKey][rowIndex].push(value);
  }

  document.querySelectorAll('#pairwise_items input').forEach(function(input) {
    if(isCriteriaGroupVisible(input) && isRowVisible(input) && isColumnVisible(input) && isValueTruthy(input)) {
      pushToCriteriaItemRank(input);
    }
  });

  let criteriaRankRows = {};

  document.querySelectorAll('#pairwise_criteria input').forEach(function(input) {
    if (isRowVisible(input) && isColumnVisible(input) && isValueTruthy(input)) {
      let rowPos = criteriaIndexToPos[getPairwiseInputRow(input.id)];
      if (!criteriaRankRows[rowPos]) {
        criteriaRankRows[rowPos] = [];
      }
      criteriaRankRows[rowPos].push(eval(input.value)); // ooh the hacks to make a fraction string a number!!!
    }
  });

  for (let pos = 0; pos < criteriaTotalCheck; pos++) {
    criteriaRank.push(criteriaRankRows[pos] || []);
  }

  let applyTotalCriteriaClassName = function() {
    const criteriaContainer = document.getElementById('criteria');

    let getCriteriaClass = function(n) {
      return `total-criteria-${n}`;
    }

    for (let x = 1; x <= 8; x++) {
      criteriaContainer.classList.remove(getCriteriaClass(x));
    }

    criteriaContainer.classList.add(getCriteriaClass(criteriaTotalCheck));
  }

  applyTotalCriteriaClassName();

  let decision = window.runCalculation(items, criteria, criteriaItemRank, criteriaRank);

	new window.chartist.Bar('#criteria', {
	  labels: decision.criteria.labels,
	  series: decision.criteria.series
	}, {
	  stackBars: true,
	  horizontalBars: true,
	  reverseData: true,
	  axisY: {
	    offset: 100
	  }
	});

	new window.chartist.Bar('#rankings', {
	  labels: decision.rankings.labels,
	  series: decision.rankings.series,
	}, {
	  stackBars: true,
	  horizontalBars: true,
	  reverseData: true,
	  axisY: {
	    offset: 100
	  }
	});

  event.preventDefault();

  return false;
};

document.getElementById('calcbtn').addEventListener('click', runAHP);
document.getElementById('calcbtn').addEventListener('keypress', runAHP);

// Auto-loading prior state during page load triggers calls to handlePair()
// which uses setTimeout() to asynchronously configure the cells. The function
// clearPairwiseStyleClasses() needs to happen after all that activity
// to remove lingering dynamic styles intended for the user's visual focus.
setTimeout(clearPairwiseStyleClasses);
