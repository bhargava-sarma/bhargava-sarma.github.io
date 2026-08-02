/* Portfolio dashboard.
 *
 * Schema-driven editor for content.json. The SCHEMA below is the single place
 * the form structure is described; every section, field and list control is
 * generated from it, so adding a field to the site means adding one line here
 * rather than hand-writing another form.
 *
 * One page, two ways of running:
 *
 *   local   served by scripts/dashboard.py on 127.0.0.1. Reads and writes the
 *           file directly and reruns the build; no token, nothing leaves the
 *           machine.
 *   remote  served from the live site. Commits content.json through the GitHub
 *           API using a token held only in this tab's sessionStorage; a GitHub
 *           Action then reruns the build and republishes.
 *
 * Only the BACKENDS differ -- the editor above them is identical, so there is
 * no second copy of the form logic to keep in sync.
 *
 * The DOM is built with createElement/textContent throughout -- never innerHTML
 * -- so portfolio copy containing < or & can never be interpreted as markup,
 * and the page satisfies require-trusted-types-for 'script'.
 */
(function () {
  'use strict';

  var REPO = { owner: 'bhargava-sarma', repo: 'bhargava-sarma.github.io', branch: 'main' };
  var TOKEN_KEY = 'gh_token';

  var IS_LOCAL = location.hostname === '127.0.0.1' ||
                 location.hostname === 'localhost' ||
                 location.protocol === 'file:';

  var SCHEMA = [
    {
      key: 'meta', title: 'Page metadata', kind: 'object',
      hint: 'Browser tab title and the description search engines show.',
      fields: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Meta description', multiline: true }
      ]
    },
    {
      key: 'hero', title: 'Hero', kind: 'object',
      hint: 'The opening screen. Each title line is a set of words animated in separately.',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow (small line above the name)' },
        { key: 'titleLines', label: 'Title lines', kind: 'lines' },
        { key: 'description', label: 'Intro paragraph', multiline: true },
        { key: 'resumeFile', label: 'Resume filename' }
      ]
    },
    {
      key: 'marquee', title: 'Marquee', kind: 'strings',
      hint: 'Scrolling tech keywords under the hero.',
      placeholder: 'e.g. Python'
    },
    {
      key: 'work', title: 'Work experience', kind: 'list',
      titleFrom: ['role', 'org'], addLabel: 'Add role',
      fields: [
        { key: 'date', label: 'Dates' },
        { key: 'role', label: 'Role' },
        { key: 'org', label: 'Organisation' },
        { key: 'bullets', label: 'Bullets', kind: 'strings', multiline: true,
          placeholder: 'One achievement per entry' }
      ]
    },
    {
      key: 'projects', title: 'Projects', kind: 'list',
      titleFrom: ['title'], addLabel: 'Add project',
      hint: 'Numbering (01, 02, …) follows this order and is generated automatically.',
      fields: [
        { key: 'title', label: 'Name' },
        { key: 'description', label: 'Description', multiline: true },
        { key: 'stack', label: 'Stack (separate with ·)' },
        { key: 'url', label: 'Repository URL' }
      ]
    },
    {
      key: 'skills', title: 'Skills', kind: 'list',
      titleFrom: ['label'], addLabel: 'Add row',
      fields: [
        { key: 'label', label: 'Category' },
        { key: 'items', label: 'Items (comma separated)', multiline: true }
      ]
    },
    {
      key: 'extra', title: 'Extracurriculars', kind: 'list',
      titleFrom: ['date'], addLabel: 'Add entry',
      fields: [
        { key: 'date', label: 'Dates' },
        { key: 'text', label: 'Description', multiline: true }
      ]
    },
    {
      key: 'education', title: 'Education', kind: 'list',
      titleFrom: ['school'], addLabel: 'Add school',
      fields: [
        { key: 'school', label: 'Institution' },
        { key: 'degree', label: 'Qualification' },
        { key: 'date', label: 'Dates' }
      ]
    },
    {
      key: 'contact', title: 'Contact', kind: 'object',
      hint: 'The address is split in two so it is never published as a scrapeable mailto: link.',
      fields: [
        { key: 'emailUser', label: 'Email — part before @' },
        { key: 'emailDomain', label: 'Email — domain' },
        { key: 'links', label: 'Links', kind: 'list', titleFrom: ['label'],
          addLabel: 'Add link',
          fields: [
            { key: 'label', label: 'Label' },
            { key: 'url', label: 'URL' }
          ] }
      ]
    }
  ];

  var content = null;
  var dirty = false;

  var $status = document.getElementById('status');
  var $form = document.getElementById('form');
  var $nav = document.getElementById('nav');
  var $save = document.getElementById('saveBtn');

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setStatus(msg, kind) {
    $status.textContent = msg;
    $status.className = kind || '';
  }

  function markDirty() {
    if (dirty) return;
    dirty = true;
    $save.disabled = false;
    setStatus('unsaved changes');
  }

  // -- field builders --------------------------------------------------------

  function textField(label, value, onChange, multiline, placeholder) {
    var wrap = el('div', 'field');
    if (label) wrap.appendChild(el('label', null, label));
    var input = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) input.type = 'text';
    if (placeholder) input.placeholder = placeholder;
    input.value = value == null ? '' : String(value);
    input.addEventListener('input', function () {
      onChange(input.value);
      markDirty();
    });
    wrap.appendChild(input);
    return wrap;
  }

  /* A reorderable list of plain strings. */
  function stringsField(label, arr, opts, onTitleChange) {
    var wrap = el('div', 'field');
    if (label) wrap.appendChild(el('label', null, label));
    var host = el('div');

    function redraw() {
      host.replaceChildren();
      if (!arr.length) host.appendChild(el('div', 'empty', 'None yet.'));
      arr.forEach(function (value, i) {
        var row = el('div', 'item__bar');
        var field = textField(null, value, function (v) {
          arr[i] = v;
          if (onTitleChange) onTitleChange();
        }, opts.multiline, opts.placeholder);
        field.style.flex = '1';
        field.style.marginBottom = '0';
        row.appendChild(field);
        row.appendChild(iconBtn('↑', i === 0, function () { move(arr, i, -1); redraw(); markDirty(); }));
        row.appendChild(iconBtn('↓', i === arr.length - 1, function () { move(arr, i, 1); redraw(); markDirty(); }));
        row.appendChild(iconBtn('✕', false, function () { arr.splice(i, 1); redraw(); markDirty(); }, true));
        host.appendChild(row);
      });
      var add = el('button', null, '+ Add');
      add.type = 'button';
      add.addEventListener('click', function () { arr.push(''); redraw(); markDirty(); });
      host.appendChild(add);
    }

    redraw();
    wrap.appendChild(host);
    return wrap;
  }

  function iconBtn(glyph, disabled, onClick, danger) {
    var b = el('button', 'icon' + (danger ? ' danger' : ''), glyph);
    b.type = 'button';
    b.disabled = !!disabled;
    if (disabled) b.style.opacity = '0.3';
    b.addEventListener('click', onClick);
    return b;
  }

  function move(arr, from, delta) {
    var to = from + delta;
    if (to < 0 || to >= arr.length) return;
    var tmp = arr[from];
    arr[from] = arr[to];
    arr[to] = tmp;
  }

  /* Renders one field of an object, dispatching on its declared kind. */
  function renderField(spec, obj, onTitleChange) {
    if (spec.kind === 'strings') {
      if (!Array.isArray(obj[spec.key])) obj[spec.key] = [];
      return stringsField(spec.label, obj[spec.key], spec, onTitleChange);
    }
    if (spec.kind === 'lines') {
      // Array of arrays of words -- edited as one space-separated line each.
      var wrap = el('div', 'field');
      wrap.appendChild(el('label', null, spec.label));
      var lines = obj[spec.key].map(function (words) { return words.join(' '); });
      var host = el('div');
      lines.forEach(function (line, i) {
        host.appendChild(textField(null, line, function (v) {
          obj[spec.key][i] = v.split(/\s+/).filter(Boolean);
        }));
      });
      wrap.appendChild(host);
      return wrap;
    }
    if (spec.kind === 'list') {
      return listField(spec, obj);
    }
    return textField(spec.label, obj[spec.key], function (v) {
      obj[spec.key] = v;
      if (onTitleChange) onTitleChange();
    }, spec.multiline, spec.placeholder);
  }

  /* A reorderable list of objects. */
  function listField(spec, parent) {
    if (!Array.isArray(parent[spec.key])) parent[spec.key] = [];
    var arr = parent[spec.key];
    var wrap = el('div', 'field');
    if (spec.label) wrap.appendChild(el('label', null, spec.label));
    var host = el('div');

    function redraw() {
      host.replaceChildren();
      if (!arr.length) host.appendChild(el('div', 'empty', 'None yet.'));
      arr.forEach(function (item, i) {
        host.appendChild(renderItem(spec, arr, item, i, redraw));
      });
      var add = el('button', null, spec.addLabel || '+ Add');
      add.type = 'button';
      add.addEventListener('click', function () {
        var blank = {};
        spec.fields.forEach(function (f) {
          blank[f.key] = (f.kind === 'strings' || f.kind === 'list') ? [] : '';
        });
        arr.push(blank);
        redraw();
        markDirty();
      });
      host.appendChild(add);
    }

    redraw();
    wrap.appendChild(host);
    return wrap;
  }

  function renderItem(spec, arr, item, i, redraw) {
    var box = el('div', 'item');
    var bar = el('div', 'item__bar');

    var titleEl = el('span', 'item__title');
    function refreshTitle() {
      var parts = (spec.titleFrom || []).map(function (k) { return item[k]; }).filter(Boolean);
      titleEl.textContent = (i + 1) + '. ' + (parts.join(' — ') || 'Untitled');
    }
    refreshTitle();

    bar.appendChild(titleEl);
    bar.appendChild(iconBtn('↑', i === 0, function () { move(arr, i, -1); redraw(); markDirty(); }));
    bar.appendChild(iconBtn('↓', i === arr.length - 1, function () { move(arr, i, 1); redraw(); markDirty(); }));
    bar.appendChild(iconBtn('✕', false, function () {
      if (!confirm('Delete "' + titleEl.textContent + '"?')) return;
      arr.splice(i, 1);
      redraw();
      markDirty();
    }, true));
    box.appendChild(bar);

    var body = el('div');
    spec.fields.forEach(function (f) {
      var node = renderField(f, item, refreshTitle);
      if (f.kind === 'list') node.classList.add('sub');
      body.appendChild(node);
    });
    box.appendChild(body);
    return box;
  }

  // -- page ------------------------------------------------------------------

  function render() {
    $form.replaceChildren();
    $nav.replaceChildren();

    SCHEMA.forEach(function (section) {
      var link = el('a', null, section.title);
      link.href = '#sec-' + section.key;
      $nav.appendChild(link);

      var card = el('section', 'card');
      card.id = 'sec-' + section.key;
      card.appendChild(el('h2', null, section.title));
      if (section.hint) card.appendChild(el('p', 'hint', section.hint));

      if (section.kind === 'strings') {
        card.appendChild(stringsField(null, content[section.key], section));
      } else if (section.kind === 'list') {
        card.appendChild(listField(section, content));
      } else {
        // Short single-line inputs share a flex row; anything taller (textareas,
        // nested lists) gets its own full-width block underneath.
        var row = el('div', 'row');
        var wide = [];
        section.fields.forEach(function (f) {
          var node = renderField(f, content[section.key]);
          if (f.multiline || f.kind) {
            wide.push(node);
          } else {
            row.appendChild(node);
          }
        });
        if (row.children.length) card.appendChild(row);
        wide.forEach(function (node) { card.appendChild(node); });
      }
      $form.appendChild(card);
    });
  }

  // -- backends --------------------------------------------------------------

  function b64encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  function b64decode(b64) {
    var bin = atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* Talks to the local editor server. */
  var LocalBackend = {
    savedMessage: 'saved — index.html rebuilt',
    load: function () {
      return fetch('/api/content').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    },
    save: function (data) {
      return fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2)
      }).then(function (r) {
        return r.json().then(function (body) {
          if (!r.ok) throw new Error(body.error || ('HTTP ' + r.status));
          return body;
        });
      });
    }
  };

  /* Commits content.json through the GitHub contents API. */
  var GitHubBackend = {
    token: null,
    sha: null,
    savedMessage: 'committed — the site rebuilds in about a minute',

    url: function (path) {
      return 'https://api.github.com/repos/' + REPO.owner + '/' + REPO.repo + path;
    },

    headers: function () {
      return {
        'Authorization': 'Bearer ' + this.token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
    },

    /* Confirms the token actually grants write access before showing the editor,
       so a read-only or wrong-repo token fails at the gate and not at save time. */
    verify: function (token) {
      var self = this;
      return fetch(self.url(''), {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }).then(function (r) {
        if (r.status === 401) throw new Error('token rejected — expired or mistyped');
        if (r.status === 404) throw new Error('token cannot see this repository');
        if (!r.ok) throw new Error('GitHub returned HTTP ' + r.status);
        return r.json();
      }).then(function (repo) {
        if (!repo.permissions || !repo.permissions.push) {
          throw new Error('token is read-only — it needs Contents: Read and write');
        }
        self.token = token;
        return true;
      });
    },

    load: function () {
      var self = this;
      return fetch(self.url('/contents/content.json?ref=' + REPO.branch),
                   { headers: self.headers(), cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('could not read content.json (HTTP ' + r.status + ')');
          return r.json();
        })
        .then(function (file) {
          self.sha = file.sha;   // needed to commit without clobbering
          return JSON.parse(b64decode(file.content));
        });
    },

    save: function (data) {
      var self = this;
      return fetch(self.url('/contents/content.json'), {
        method: 'PUT',
        headers: self.headers(),
        body: JSON.stringify({
          message: 'Update portfolio content via dashboard',
          content: b64encode(JSON.stringify(data, null, 2) + '\n'),
          sha: self.sha,
          branch: REPO.branch
        })
      }).then(function (r) {
        if (r.status === 409 || r.status === 422) {
          throw new Error('content.json changed elsewhere — reload before saving');
        }
        return r.json().then(function (body) {
          if (!r.ok) throw new Error((body && body.message) || ('HTTP ' + r.status));
          self.sha = body.content.sha;   // keep in step for the next save
          return body;
        });
      });
    }
  };

  var backend = IS_LOCAL ? LocalBackend : GitHubBackend;

  // -- load / save -----------------------------------------------------------

  function load() {
    setStatus('loading…', 'busy');
    backend.load()
      .then(function (data) {
        content = data;
        dirty = false;
        $save.disabled = true;
        render();
        setStatus('loaded');
      })
      .catch(function (e) { setStatus('load failed: ' + e.message, 'err'); });
  }

  function save() {
    setStatus('saving…', 'busy');
    $save.disabled = true;
    backend.save(content)
      .then(function () {
        dirty = false;
        setStatus(backend.savedMessage, 'ok');
      })
      .catch(function (e) {
        setStatus('save failed: ' + e.message, 'err');
        $save.disabled = false;
      });
  }

  // -- startup ---------------------------------------------------------------

  var $gate = document.getElementById('gate');
  var $app = document.getElementById('app');
  var $gateMsg = document.getElementById('gateMsg');
  var $tokenInput = document.getElementById('token');
  var $lock = document.getElementById('lockBtn');

  function showEditor() {
    $gate.hidden = true;
    $app.hidden = false;
    load();
  }

  function unlock(token, fromStorage) {
    token = (token || '').trim();
    if (!token) {
      $gateMsg.textContent = 'Paste a token first.';
      $gateMsg.className = 'err';
      return;
    }
    $gateMsg.textContent = 'checking token…';
    $gateMsg.className = 'busy';
    GitHubBackend.verify(token)
      .then(function () {
        // Only persisted for this tab, and only once GitHub has confirmed it works.
        try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}
        $tokenInput.value = '';
        $gateMsg.textContent = '';
        $gateMsg.className = '';
        showEditor();
      })
      .catch(function (e) {
        if (fromStorage) { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e2) {} }
        $gateMsg.textContent = e.message;
        $gateMsg.className = 'err';
      });
  }

  function lock() {
    if (dirty && !confirm('Discard unsaved changes and lock?')) return;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    GitHubBackend.token = null;
    GitHubBackend.sha = null;
    content = null;
    dirty = false;
    $app.hidden = true;
    $gate.hidden = false;
  }

  $save.addEventListener('click', save);

  document.getElementById('previewBtn').addEventListener('click', function () {
    window.open(IS_LOCAL ? '/preview/index.html' : '/', '_blank', 'noopener');
  });

  document.getElementById('reloadBtn').addEventListener('click', function () {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    load();
  });

  $lock.addEventListener('click', lock);

  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (dirty) save();
    }
  });

  if (IS_LOCAL) {
    // No token needed: the local server already has file access.
    showEditor();
  } else {
    $lock.hidden = false;
    document.getElementById('unlockBtn').addEventListener('click', function () {
      unlock($tokenInput.value, false);
    });
    $tokenInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') unlock($tokenInput.value, false);
    });

    var stored = null;
    try { stored = sessionStorage.getItem(TOKEN_KEY); } catch (e) {}
    if (stored) {
      $gate.hidden = false;
      unlock(stored, true);
    } else {
      $gate.hidden = false;
    }
  }
})();
