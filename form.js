/**
 * Dynamic weekly menu form frontend.
 * Requires window.FORM_API_URL to be defined before this script loads.
 */
'use strict';

var _token = null;
var _planConfig = null;
var _menuOptions = null;
var _formConfig = null;
var _prefillData = null;
var _apiUrl = null;

function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }

function createEl(tag, attrs, children) {
  var n = document.createElement(tag);
  attrs = attrs || {};
  children = children || [];
  Object.keys(attrs).forEach(function(k) {
    if (k === 'className') n.className = attrs[k];
    else if (k === 'htmlFor') n.htmlFor = attrs[k];
    else n.setAttribute(k, attrs[k]);
  });
  children.forEach(function(c) {
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}

function getParam(name) {
  var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
}

function nameFromEmail(email) {
  var local = String(email || '').split('@')[0] || '';
  if (!local) return '';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(function(part) {
      return part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part;
    })
    .join(' ');
}

function parseIsoDate(iso) {
  var parts = String(iso || '').split('-');
  if (parts.length !== 3) return new Date();
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

function formatDeliveryDateLong(weekStart) {
  var d = parseIsoDate(weekStart);
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + d.getDate();
}

function switchScreen(id) {
  ['screen-loading', 'screen-error', 'screen-form', 'screen-success'].forEach(function(s) {
    var n = document.getElementById(s);
    if (n) n.classList.add('hidden');
  });
  var active = document.getElementById(id);
  if (active) active.classList.remove('hidden');
}

function showFatal(message) {
  var heading = document.getElementById('error-heading');
  var d = document.getElementById('error-detail');
  var contact = document.getElementById('error-contact');
  var tokenIssue = /token|expired|invalid link|missing token/i.test(String(message || ''));

  if (tokenIssue) {
    if (heading) heading.textContent = 'Invalid link';
    if (d) {
      d.textContent =
        'Please use the menu selection form link provided in your email before the weekly deadline. If you have any questions, please contact operations@jackiessupperclub.com';
    }
    if (contact) hide(contact);
  } else {
    if (heading) heading.textContent = 'Something went wrong';
    if (d) d.textContent = message;
    if (contact) show(contact);
  }

  switchScreen('screen-error');
}

function resolveApiUrl() {
  var apiParam = getParam('api');
  if (apiParam && /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(apiParam)) {
    return apiParam;
  }
  return window.FORM_API_URL || '';
}

function renderDinners() {
  var section = document.getElementById('section-dinners');
  section.innerHTML = '';

  for (var i = 1; i <= _planConfig.dinnerCount; i++) {
    var block = createEl('div', { className: 'dinner-block' });
    block.appendChild(createEl('h2', { className: 'section-heading' }, [
      'Dinner ' + i + ' ',
      createEl('span', { className: 'portion-hint' }, ['(' + _planConfig.portions + ' portions)'])
    ]));

    var sel = createEl('select', {
      id: 'field-dinner' + i,
      name: 'dinner' + i,
      className: 'select-input',
      required: 'required'
    }, [createEl('option', { value: '' }, ['- choose dinner -'])]);

    (_menuOptions.dinners || []).forEach(function(opt) {
      sel.appendChild(createEl('option', { value: opt.value }, [opt.label]));
    });

    block.appendChild(createEl('label', { className: 'field-label', htmlFor: 'field-dinner' + i }, ['Dinner selection *']));
    block.appendChild(sel);

    var radios = createEl('div', { className: 'radio-group' });
    (_formConfig.prepOptions || []).forEach(function(opt) {
      var id = 'dinner' + i + '-prep-' + opt.value;
      var radioAttrs = {
        type: 'radio',
        id: id,
        name: 'dinner' + i + 'Prep',
        value: opt.value,
        required: 'required'
      };
      if (opt.value === 'fully_cooked') {
        radioAttrs.checked = 'checked';
      }
      radios.appendChild(createEl('label', { className: 'radio-item', htmlFor: id }, [
        createEl('input', radioAttrs),
        ' ' + opt.label
      ]));
    });

    block.appendChild(createEl('p', { className: 'field-label' }, ['Prep preference *']));
    block.appendChild(radios);
    section.appendChild(block);
  }
}

function renderLunch() {
  var section = document.getElementById('section-lunch');
  section.innerHTML = '';
  if (!_planConfig.showLunch) {
    hide(section);
    return;
  }

  var radios = createEl('div', { className: 'radio-group', id: 'lunch-kit-radios' });
  (_formConfig.lunchKitOptions || []).forEach(function(opt) {
    var id = 'lunchkit-' + opt.value;
    radios.appendChild(createEl('label', { className: 'radio-item', htmlFor: id }, [
      createEl('input', { type: 'radio', id: id, name: 'lunchKit', value: opt.value, required: 'required' }),
      ' ' + opt.label
    ]));
  });

  section.appendChild(createEl('h2', { className: 'section-heading' }, ['Lunch kit']));
  section.appendChild(radios);

  var proteinWrap = createEl('div', { className: 'field-group hidden', id: 'plan-protein-wrap' });
  var proteinSel = createEl('select', { id: 'field-lunch-protein', name: 'lunchProtein', className: 'select-input' }, [
    createEl('option', { value: '' }, ['- choose protein -'])
  ]);
  (_menuOptions.proteins || []).forEach(function(opt) {
    proteinSel.appendChild(createEl('option', { value: opt.value }, [opt.label]));
  });
  proteinWrap.appendChild(createEl('label', { className: 'field-label', htmlFor: 'field-lunch-protein' }, ['Lunch protein *']));
  proteinWrap.appendChild(proteinSel);
  section.appendChild(proteinWrap);

  radios.addEventListener('change', function(e) {
    var needsProtein = e.target && e.target.name === 'lunchKit' &&
        (e.target.value === 'half' || e.target.value === 'salad');
    if (needsProtein) {
      show(proteinWrap);
      proteinSel.setAttribute('required', 'required');
    } else {
      hide(proteinWrap);
      proteinSel.removeAttribute('required');
      proteinSel.value = '';
    }
  });

  show(section);
}

function renderAddOns() {
  var list = document.getElementById('addon-dinner-list');
  list.innerHTML = '';

  (_menuOptions.dinners || []).forEach(function(opt) {
    var row = createEl('div', { className: 'addon-dinner-row' });
    var cbId = 'addon-check-' + opt.value;
    row.appendChild(createEl('label', { className: 'checkbox-item', htmlFor: cbId }, [
      createEl('input', { type: 'checkbox', id: cbId, 'data-dinner': opt.value }),
      ' ' + opt.label
    ]));

    var qtyWrap = createEl('div', { className: 'addon-qty-wrap hidden', id: 'addon-qty-' + opt.value });
    ['2', '4'].forEach(function(q) {
      var price = q === '2' ? '$76' : '$144';
      var qid = 'addon-qty-' + opt.value + '-' + q;
      qtyWrap.appendChild(createEl('label', { className: 'radio-item', htmlFor: qid }, [
        createEl('input', { type: 'radio', id: qid, name: 'addon-qty-' + opt.value, value: q }),
        createEl('span', {}, [' +' + q + ' portions ', createEl('span', { className: 'price' }, [price])])
      ]));
    });

    row.appendChild(qtyWrap);
    list.appendChild(row);

    var cb = document.getElementById(cbId);
    cb.addEventListener('change', function() {
      if (cb.checked) show(qtyWrap);
      else {
        hide(qtyWrap);
        qsa('[name="addon-qty-' + opt.value + '"]').forEach(function(r) { r.checked = false; });
      }
    });
  });

  var addOnProtein = document.getElementById('field-addon-protein');
  if (addOnProtein) {
    while (addOnProtein.options.length > 1) addOnProtein.remove(1);
    (_menuOptions.proteins || []).forEach(function(opt) {
      addOnProtein.appendChild(createEl('option', { value: opt.value }, [opt.label]));
    });
  }
}

function setSectionComplete(sectionId, complete) {
  var section = document.getElementById(sectionId);
  if (!section) return;
  if (complete) section.classList.add('section-complete');
  else section.classList.remove('section-complete');
}

function updateCompletionStates() {
  var form = document.getElementById('order-form');
  if (!form) return;

  var identityComplete = !!(qs('#field-name') && qs('#field-name').value && qs('#field-email') && qs('#field-email').value);
  setSectionComplete('section-identity', identityComplete);

  var dinnerCompleteCount = 0;
  qsa('#section-dinners .dinner-block').forEach(function(block, idx) {
    var i = idx + 1;
    var dinnerSel = qs('[name="dinner' + i + '"]');
    var prepSel = qs('[name="dinner' + i + 'Prep"]:checked');
    var complete = !!(dinnerSel && dinnerSel.value && prepSel);
    if (complete) dinnerCompleteCount++;
    if (complete) block.classList.add('section-complete');
    else block.classList.remove('section-complete');
  });
  setSectionComplete('section-dinners', dinnerCompleteCount === _planConfig.dinnerCount);

  if (_planConfig.showLunch) {
    var lunchKit = qs('[name="lunchKit"]:checked');
    var lunchProteinWrap = document.getElementById('plan-protein-wrap');
    var needsProtein = lunchProteinWrap && !lunchProteinWrap.classList.contains('hidden');
    var lunchProtein = qs('#field-lunch-protein');
    var lunchComplete = !!lunchKit && (!needsProtein || (lunchProtein && lunchProtein.value));
    setSectionComplete('section-lunch', lunchComplete);
  }

  var wantsAddOns = qs('[name="wantsAddOns"]:checked');
  setSectionComplete('section-addon-trigger', !!wantsAddOns);

  var addOnsSection = document.getElementById('section-addons');
  if (addOnsSection && !addOnsSection.classList.contains('hidden')) {
    var validAddOns = true;
    qsa('#addon-dinner-list input[type="checkbox"]:checked').forEach(function(cb) {
      var v = cb.getAttribute('data-dinner');
      if (!qs('[name="addon-qty-' + v + '"]:checked')) validAddOns = false;
    });
    var addOnLunch = qs('[name="addOnLunchKit"]:checked');
    var addOnProteinWrap = document.getElementById('addon-protein-wrap');
    if (addOnProteinWrap && !addOnProteinWrap.classList.contains('hidden')) {
      var addOnProtein = qs('#field-addon-protein');
      if (!addOnProtein || !addOnProtein.value) validAddOns = false;
    }
    setSectionComplete('section-addons', validAddOns && (!!addOnLunch || qsa('#addon-dinner-list input[type="checkbox"]:checked').length > 0 || (wantsAddOns && wantsAddOns.value === 'no')));
  } else {
    setSectionComplete('section-addons', false);
  }
}

function updateSuccessCopy(updated) {
  var main = document.getElementById('success-message-main');
  var delivery = document.getElementById('success-message-delivery');
  var weekStart = _prefillData && _prefillData.weekStart ? _prefillData.weekStart : '';
  var deliveryDate = formatDeliveryDateLong(weekStart);

  if (main) {
    main.textContent =
      (updated ? 'Thank you for updating your weekly menu selections! ' : 'Thank you for submitting your weekly menu selections! ') +
      'You will receive an email with a copy of your selections. If you need to make any changes, please resubmit before Wednesday at 11am.';
  }
  if (delivery) {
    delivery.textContent = 'Food deliveries will be made on ' + deliveryDate + ' between the hours of 2-7pm.';
  }
}

function updateResubmissionBanner(existingSubmission) {
  var banner = document.getElementById('resubmission-banner');
  var text = document.getElementById('resubmission-text');
  if (!banner || !text) return;

  if (existingSubmission && existingSubmission.submissionId) {
    text.textContent =
      'We already received a submission for this week (Confirmation ID: ' + existingSubmission.submissionId + '). ' +
      'Submitting this form again will update your existing submission.';
    show(banner);
  } else {
    hide(banner);
  }
}

function parsePrice(str) {
  return parseInt((str || '').replace(/[^0-9]/g, ''), 10) || 0;
}

function updateTotal() {
  var section = document.getElementById('section-order-total');
  var lines = document.getElementById('order-total-lines');
  var amountEl = document.getElementById('order-total-amount');
  if (!section || !lines || !amountEl) return;

  var wantsAddOns = qs('[name="wantsAddOns"]:checked');
  if (!wantsAddOns || wantsAddOns.value !== 'yes') { hide(section); return; }

  var items = [];
  var total = 0;

  qsa('#addon-dinner-list input[type="checkbox"]:checked').forEach(function(cb) {
    var v = cb.getAttribute('data-dinner');
    var qtyRadio = qs('[name="addon-qty-' + v + '"]:checked');
    if (!qtyRadio) return;
    var pricing = (_formConfig.addonDinnerPricing || []).filter(function(p) { return p.value === qtyRadio.value; })[0];
    var price = pricing ? parsePrice(pricing.price) : 0;
    var dinner = (_menuOptions.dinners || []).filter(function(d) { return d.value === v; })[0];
    items.push({ label: (dinner ? dinner.label : v) + ' ×' + qtyRadio.value + ' portions', price: price });
    total += price;
  });

  var lunchRadio = qs('[name="addOnLunchKit"]:checked');
  if (lunchRadio && lunchRadio.value) {
    var lunchOpt = (_formConfig.addonLunchKitOptions || []).filter(function(o) { return o.value === lunchRadio.value; })[0];
    if (lunchOpt) {
      var lunchPrice = parsePrice(lunchOpt.price);
      items.push({ label: lunchOpt.label, price: lunchPrice });
      total += lunchPrice;
    }
  }

  if (items.length === 0) { hide(section); return; }

  lines.innerHTML = '';
  items.forEach(function(item) {
    var li = document.createElement('li');
    li.innerHTML = '<span>' + item.label + '</span><span>$' + item.price + '</span>';
    lines.appendChild(li);
  });
  amountEl.innerHTML = '<span>Total extras</span><span>$' + total + '</span>';
  show(section);
}

function attachUIHandlers() {
  qsa('[name="wantsAddOns"]').forEach(function(r) {
    r.addEventListener('change', function() {
      if (r.checked && r.value === 'yes') show(document.getElementById('section-addons'));
      if (r.checked && r.value === 'no') {
        hide(document.getElementById('section-addons'));
        qsa('#addon-dinner-list input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });
        qsa('#addon-dinner-list input[type="radio"]').forEach(function(rb) { rb.checked = false; });
        qsa('[name="addOnLunchKit"]').forEach(function(rb) { rb.checked = false; });

        var wrap = document.getElementById('addon-protein-wrap');
        var sel = document.getElementById('field-addon-protein');
        if (wrap) hide(wrap);
        if (sel) {
          sel.removeAttribute('required');
          sel.value = '';
        }
      }
      updateTotal();
      updateCompletionStates();
    });
  });

  qsa('[name="addOnLunchKit"]').forEach(function(r) {
    r.addEventListener('change', function() {
      var wrap = document.getElementById('addon-protein-wrap');
      var sel = document.getElementById('field-addon-protein');
      if (r.checked && (r.value === 'half_4' || r.value === 'salad_2' || r.value === 'salad_4')) {
        show(wrap);
        sel.setAttribute('required', 'required');
      } else if (r.checked) {
        hide(wrap);
        sel.removeAttribute('required');
        sel.value = '';
      }
      updateCompletionStates();
    });
  });

  var addonsSection = document.getElementById('section-addons');
  if (addonsSection) {
    addonsSection.addEventListener('change', function() {
      updateTotal();
      updateCompletionStates();
    });
  }

  var notes = document.getElementById('field-notes');
  var count = document.getElementById('notes-count');
  if (notes && count) {
    notes.addEventListener('input', function() { count.textContent = String(notes.value.length); });
  }

  var form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('change', updateCompletionStates);
    form.addEventListener('input', updateCompletionStates);
  }
}

function collectData() {
  var fd = new FormData(document.getElementById('order-form'));
  var data = {
    fullName: (fd.get('fullName') || '').trim(),
    email: (fd.get('email') || '').trim(),
    wantsAddOns: fd.get('wantsAddOns') || 'no',
    notes: (fd.get('notes') || '').trim()
  };

  for (var i = 1; i <= _planConfig.dinnerCount; i++) {
    data['dinner' + i] = fd.get('dinner' + i) || '';
    data['dinner' + i + 'Prep'] = fd.get('dinner' + i + 'Prep') || '';
  }

  if (_planConfig.showLunch) {
    data.lunchKit = fd.get('lunchKit') || '';
    data.lunchProtein = fd.get('lunchProtein') || '';
  }

  if (data.wantsAddOns === 'yes') {
    var addOnDinners = [];
    qsa('#addon-dinner-list input[type="checkbox"]:checked').forEach(function(cb) {
      var v = cb.getAttribute('data-dinner');
      var qty = qs('[name="addon-qty-' + v + '"]:checked');
      if (!qty) return;
      var item = (_menuOptions.dinners || []).find(function(d) { return d.value === v; });
      addOnDinners.push({ item: item ? item.label : v, portions: parseInt(qty.value, 10) });
    });
    data.addOnDinners = addOnDinners;
    data.addOnLunchKit = fd.get('addOnLunchKit') || '';
    data.addOnLunchProtein = fd.get('addOnLunchProtein') || '';
  } else {
    data.addOnDinners = [];
    data.addOnLunchKit = '';
    data.addOnLunchProtein = '';
  }

  return data;
}

function validateBeforeSubmit() {
  var form = document.getElementById('order-form');
  if (!form) return false;

  qsa('#addon-dinner-list input[type="checkbox"]').forEach(function(cb) {
    cb.setCustomValidity('');
  });

  qsa('#addon-dinner-list input[type="checkbox"]:checked').forEach(function(cb) {
    var v = cb.getAttribute('data-dinner');
    var qty = qs('[name="addon-qty-' + v + '"]:checked');
    if (!qty) {
      cb.setCustomValidity('Please choose +2 or +4 portions for this add-on dinner.');
    }
  });

  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  return true;
}

function submitHandler(e) {
  e.preventDefault();
  if (!validateBeforeSubmit()) return;

  var err = document.getElementById('submit-error');
  hide(err);

  var btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  fetch(_apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: _token, data: collectData() })
  })
    .then(function(r) {
      return r
        .json()
        .catch(function() { return { success: false, error: 'Invalid server response' }; })
        .then(function(body) { return { ok: r.ok, body: body }; });
    })
    .then(function(resp) {
      var body = resp.body || {};
      if (!resp.ok || !body.success) {
        var detail = Array.isArray(body.details) ? ': ' + body.details.join('; ') : '';
        throw new Error((body.error || 'Submission failed') + detail);
      }
      document.getElementById('success-submission-id').textContent = body.submissionId || '';
      updateSuccessCopy(!!body.updated);
      switchScreen('screen-success');
    })
    .catch(function(ex) {
      err.textContent = ex.message || 'Network error';
      show(err);
      btn.disabled = false;
      btn.textContent = 'Submit order';
    });
}

document.addEventListener('DOMContentLoaded', function() {
  switchScreen('screen-loading');

  _apiUrl = resolveApiUrl();

  if (!_apiUrl) {
    showFatal('FORM_API_URL is not configured.');
    return;
  }

  _token = getParam('token');
  if (!_token) {
    showFatal('Missing token in URL.');
    return;
  }

  fetch(_apiUrl + '?token=' + encodeURIComponent(_token))
    .then(function(r) { return r.json(); })
    .then(function(body) {
      if (!body.success) throw new Error(body.error || 'Could not load form.');

      _planConfig = body.planConfig;
      _menuOptions = body.menuOptions || { dinners: [], proteins: [] };
      _formConfig = body.formConfig || {};
      _prefillData = body.prefillData || {};

      document.getElementById('field-email').value = body.prefillData.email || '';
      document.getElementById('field-name').value =
        body.prefillData.fullName || nameFromEmail(body.prefillData.email || '');
      document.getElementById('plan-subtitle').textContent =
        body.planConfig.displayName + ' - Week of ' + body.prefillData.weekStart;

      renderDinners();
      renderLunch();
      renderAddOns();
      attachUIHandlers();
      updateTotal();
      updateCompletionStates();
      updateResubmissionBanner(body.prefillData && body.prefillData.existingSubmission);
      updateSuccessCopy(false);

      document.getElementById('order-form').addEventListener('submit', submitHandler);
      switchScreen('screen-form');
    })
    .catch(function(ex) {
      showFatal(ex.message || 'Unable to load form data.');
    });
});
