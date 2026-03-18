/**
 * AgentBeacon — AIM Protocol Visual Component
 * https://aimprotocol.org
 * 
 * MIT License
 * Copyright (c) 2025 AIM Protocol Contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * 
 * PRIVACY: This script runs entirely in the browser. It does NOT transmit any
 * data to any server, third party, or external service. All DOM introspection
 * and manifest generation happens locally. The beacon is purely visual.
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════
  // CONFIGURATION (read from script tag data attributes)
  // ═══════════════════════════════════════════
  
  const scriptTag = document.currentScript || document.querySelector('script[data-colors]');
  
  const CONFIG = {
    colors: (scriptTag?.getAttribute('data-colors') || '#6366f1,#ec4899,#06b6d4').split(',').map(c => c.trim()),
    style: scriptTag?.getAttribute('data-style') || 'shimmer',
    position: scriptTag?.getAttribute('data-position') || 'BR',
    size: scriptTag?.getAttribute('data-size') || 'md',
    label: scriptTag?.getAttribute('data-label') || 'AIM enabled',
    visibility: scriptTag?.getAttribute('data-visibility') || 'peek',
  };

  const SIZES = { sm: 28, md: 40, lg: 56 };
  const canvasSize = SIZES[CONFIG.size] || 40;
  const gridSize = Math.max(6, Math.floor(canvasSize / 5));

  // ═══════════════════════════════════════════
  // COLOR UTILITIES
  // ═══════════════════════════════════════════

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }

  function lerp(a, b, t) {
    return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)];
  }

  function bHash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  var rgbColors = CONFIG.colors.map(hexToRgb);
  // Ensure we always have 3 colors
  while (rgbColors.length < 3) rgbColors.push(rgbColors[rgbColors.length - 1] || [99,102,241]);

  // ═══════════════════════════════════════════
  // DOM INTROSPECTION — Level 1 Translation
  // ═══════════════════════════════════════════

  function introspectPage() {
    var elements = [];
    
    // Find all interactive elements
    var selectors = [
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'button',
      '[role="button"]',
      'a[href]',
      '[contenteditable="true"]',
      'details',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="slider"]',
      '[role="switch"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="tab"]',
    ];

    var nodes = document.querySelectorAll(selectors.join(','));

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      
      // Skip hidden elements
      if (node.offsetParent === null && node.type !== 'hidden') continue;
      // Skip elements inside our beacon
      if (node.closest('#aim-beacon-container')) continue;
      
      var el = extractElement(node, i);
      if (el) elements.push(el);
    }

    return {
      aim_version: '0.1',
      page: {
        url: window.location.href,
        title: document.title || '',
        description: getPageDescription(),
      },
      generated_at: new Date().toISOString(),
      element_count: elements.length,
      elements: elements,
    };
  }

  function extractElement(node, index) {
    var tag = node.tagName.toLowerCase();
    var type = node.type || '';
    var role = node.getAttribute('role') || '';

    // Determine element type
    var aimType = 'unknown';
    if (tag === 'input') {
      var inputMap = {
        text: 'text_input', email: 'text_input', password: 'text_input',
        search: 'text_input', tel: 'text_input', url: 'text_input',
        number: 'number_input', range: 'range',
        checkbox: 'checkbox', radio: 'radio',
        date: 'date_input', time: 'time_input',
        'datetime-local': 'datetime_input',
        file: 'file_input', color: 'color_input',
        submit: 'button', reset: 'button', button: 'button',
      };
      aimType = inputMap[type] || 'text_input';
    } else if (tag === 'select') {
      aimType = 'select';
    } else if (tag === 'textarea') {
      aimType = 'textarea';
    } else if (tag === 'button' || role === 'button') {
      aimType = 'button';
    } else if (tag === 'a') {
      aimType = 'link';
    } else if (role === 'checkbox' || role === 'switch') {
      aimType = 'checkbox';
    } else if (role === 'radio') {
      aimType = 'radio';
    } else if (role === 'slider') {
      aimType = 'range';
    } else if (role === 'combobox' || role === 'listbox') {
      aimType = 'select';
    } else if (role === 'tab') {
      aimType = 'tab';
    } else if (tag === 'details') {
      aimType = 'disclosure';
    } else if (node.getAttribute('contenteditable') === 'true') {
      aimType = 'rich_text';
    }

    // Extract label
    var label = getLabel(node);
    if (!label) return null; // Skip unlabeled elements

    // Build element object
    var el = {
      id: node.id || ('aim-el-' + index),
      type: aimType,
      label: label,
    };

    // Check for data-aim-* overrides (Level 3 annotations)
    var aimLabel = node.getAttribute('data-aim-label');
    if (aimLabel) el.label = aimLabel;
    
    var aimDesc = node.getAttribute('data-aim-description');
    if (aimDesc) el.description = aimDesc;

    var aimGroup = node.getAttribute('data-aim-group');
    if (aimGroup) el.group = aimGroup;

    if (node.hasAttribute('data-aim-ignore')) return null;

    var aimAction = node.getAttribute('data-aim-action');
    if (aimAction) el.action_description = aimAction;

    if (node.hasAttribute('data-aim-confirm')) el.requires_confirmation = true;

    // Add contextual properties
    if (node.required) el.required = true;
    if (node.disabled) el.disabled = true;
    if (node.readOnly) el.readonly = true;
    if (node.placeholder) el.placeholder = node.placeholder;
    if (node.pattern) el.pattern = node.pattern;
    if (node.min !== undefined && node.min !== '') el.min = node.min;
    if (node.max !== undefined && node.max !== '') el.max = node.max;
    if (node.step) el.step = node.step;

    // Current value
    if (aimType === 'checkbox' || aimType === 'radio') {
      el.current_value = node.checked;
    } else if (aimType === 'select') {
      el.current_value = node.value;
      el.options = [];
      var opts = node.querySelectorAll('option');
      for (var j = 0; j < opts.length; j++) {
        el.options.push({ value: opts[j].value, label: opts[j].textContent.trim() });
      }
    } else if (aimType === 'link') {
      el.href = node.href;
    } else if (node.value !== undefined) {
      el.current_value = node.value;
    }

    // Validation
    if (type === 'email') el.validation = 'email';
    if (type === 'url') el.validation = 'url';
    if (type === 'tel') el.validation = 'tel';
    if (node.minLength > 0) el.min_length = node.minLength;
    if (node.maxLength > 0 && node.maxLength < 524288) el.max_length = node.maxLength;

    return el;
  }

  function getLabel(node) {
    // 1. Check aria-label
    var ariaLabel = node.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // 2. Check associated <label> element
    if (node.id) {
      var label = document.querySelector('label[for="' + node.id + '"]');
      if (label) return label.textContent.trim();
    }

    // 3. Check parent label
    var parentLabel = node.closest('label');
    if (parentLabel) {
      var text = '';
      for (var i = 0; i < parentLabel.childNodes.length; i++) {
        if (parentLabel.childNodes[i].nodeType === 3) {
          text += parentLabel.childNodes[i].textContent;
        }
      }
      text = text.trim();
      if (text) return text;
    }

    // 4. Check aria-labelledby
    var labelledBy = node.getAttribute('aria-labelledby');
    if (labelledBy) {
      var refEl = document.getElementById(labelledBy);
      if (refEl) return refEl.textContent.trim();
    }

    // 5. Check title attribute
    if (node.title) return node.title;

    // 6. Check placeholder
    if (node.placeholder) return node.placeholder;

    // 7. Button/link text content
    var tag = node.tagName.toLowerCase();
    if (tag === 'button' || tag === 'a' || node.getAttribute('role') === 'button') {
      var innerText = node.textContent.trim();
      if (innerText && innerText.length < 100) return innerText;
    }

    // 8. Input value for submit buttons
    if (node.type === 'submit' && node.value) return node.value;

    // 9. Name attribute as last resort
    if (node.name) return node.name.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

    return null;
  }

  function getPageDescription() {
    var meta = document.querySelector('meta[name="description"]');
    if (meta && meta.content) return meta.content;
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.content) return ogDesc.content;
    return '';
  }

  // ═══════════════════════════════════════════
  // BEACON VISUALIZATION PAINTERS
  // ═══════════════════════════════════════════

  var painters = {
    shimmer: function(ctx, grid, cell, t, colors) {
      var data = 'aim-protocol-v01';
      for (var i = 0; i < grid * grid; i++) {
        var ci = i % data.length;
        var cc = data.charCodeAt(ci);
        var s = bHash(cc + '-' + i + '-' + Math.floor(t / 4));
        var w = Math.sin(t * 0.12 + i * 0.25) * 0.15;
        var b1 = (Math.sin(t * 0.04 + i * 0.08) + 1) / 2;
        var b2 = (Math.cos(t * 0.03 + i * 0.12) + 1) / 2;
        var base = lerp(lerp(colors[0], colors[1], b1), colors[2], b2);
        var noise = ((cc * 7 + s * 3) % 60 - 30);
        var r = Math.max(0, Math.min(255, base[0] * (0.4 + w) + noise));
        var g = Math.max(0, Math.min(255, base[1] * (0.35 + w) + noise * 0.7));
        var b = Math.max(0, Math.min(255, base[2] * (0.5 + w) + noise * 0.5));
        ctx.fillStyle = 'rgb(' + (r|0) + ',' + (g|0) + ',' + (b|0) + ')';
        ctx.fillRect((i % grid) * cell, Math.floor(i / grid) * cell, cell, cell);
      }
    },
    geometric: function(ctx, grid, cell, t, colors) {
      for (var i = 0; i < grid * grid; i++) {
        var x = i % grid, y = Math.floor(i / grid);
        var bx = Math.floor(x / 4), by = Math.floor(y / 4);
        var bid = bx * 7 + by * 13;
        var phase = Math.sin(t * 0.05 + bid * 0.8);
        var inner = Math.sin(t * 0.15 + (x + y) * 0.5);
        var pick = ((bid + Math.floor(t / 20)) % 3);
        var base = colors[pick];
        var bright = 0.3 + phase * 0.15 + inner * 0.1;
        var edge = (x % 4 === 0 || y % 4 === 0) ? 0.6 : 1;
        ctx.fillStyle = 'rgb(' + (base[0]*bright*edge|0) + ',' + (base[1]*bright*edge|0) + ',' + (base[2]*bright*edge|0) + ')';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    },
    wave: function(ctx, grid, cell, t, colors) {
      for (var i = 0; i < grid * grid; i++) {
        var x = i % grid, y = Math.floor(i / grid);
        var w1 = Math.sin(x * 0.3 + t * 0.06) * 0.5 + 0.5;
        var w2 = Math.cos(y * 0.25 + t * 0.05) * 0.5 + 0.5;
        var w3 = Math.sin((x + y) * 0.2 + t * 0.04) * 0.5 + 0.5;
        var mixed = lerp(lerp(colors[0], colors[1], w1), colors[2], w2);
        var bright = 0.3 + w3 * 0.35;
        ctx.fillStyle = 'rgb(' + (mixed[0]*bright|0) + ',' + (mixed[1]*bright|0) + ',' + (mixed[2]*bright|0) + ')';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    },
    pulse: function(ctx, grid, cell, t, colors) {
      var cx = grid / 2, cy = grid / 2;
      for (var i = 0; i < grid * grid; i++) {
        var x = i % grid, y = Math.floor(i / grid);
        var dist = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
        var ring = Math.sin(dist * 0.8 - t * 0.1) * 0.5 + 0.5;
        var ring2 = Math.cos(dist * 0.5 - t * 0.07) * 0.5 + 0.5;
        var pick = ring > 0.6 ? colors[0] : ring2 > 0.5 ? colors[1] : colors[2];
        var bright = 0.25 + ring * 0.25 + ring2 * 0.15;
        var noise = Math.sin(t * 0.2 + i * 0.1) * 10;
        ctx.fillStyle = 'rgb(' + Math.max(0,Math.min(255,(pick[0]*bright+noise)|0)) + ',' + Math.max(0,Math.min(255,(pick[1]*bright+noise*0.6)|0)) + ',' + Math.max(0,Math.min(255,(pick[2]*bright+noise*0.3)|0)) + ')';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  };

  // ═══════════════════════════════════════════
  // RENDER BEACON UI
  // ═══════════════════════════════════════════

  function createBeaconUI() {
    // Container
    var container = document.createElement('div');
    container.id = 'aim-beacon-container';
    container.setAttribute('role', 'button');
    container.setAttribute('aria-label', 'AIM Protocol beacon — click to view page manifest');
    container.setAttribute('tabindex', '0');

    // Position styles
    var posStyles = {
      'BR': 'position:fixed;bottom:16px;right:16px;z-index:99999;',
      'BL': 'position:fixed;bottom:16px;left:16px;z-index:99999;',
      'TR': 'position:fixed;top:12px;right:16px;z-index:99999;',
    };

    container.setAttribute('style',
      (posStyles[CONFIG.position] || posStyles['BR']) +
      'display:inline-flex;align-items:center;gap:8px;' +
      'padding:6px 14px 6px 6px;' +
      'background:rgba(10,10,15,0.88);' +
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
      'border:1px solid rgba(99,102,241,0.2);' +
      'border-radius:' + (canvasSize < 40 ? '8px' : '12px') + ';' +
      'box-shadow:0 4px 24px rgba(0,0,0,0.3),0 0 20px ' + CONFIG.colors[0] + '22;' +
      'cursor:pointer;transition:all 0.3s;' +
      'font-family:-apple-system,system-ui,sans-serif;'
    );

    // Canvas
    var canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('style',
      'border-radius:' + (canvasSize < 40 ? '4px' : '6px') + ';' +
      'image-rendering:pixelated;flex-shrink:0;'
    );

    // Label
    var labelEl = document.createElement('div');
    labelEl.setAttribute('style', 'display:flex;flex-direction:column;gap:1px;');
    
    var topLabel = document.createElement('div');
    topLabel.textContent = CONFIG.label;
    topLabel.setAttribute('style', 'font-size:10px;font-weight:600;color:#e0e2ea;letter-spacing:0.02em;');
    
    var bottomLabel = document.createElement('div');
    bottomLabel.setAttribute('style', 'font-size:9px;color:#8e90a0;font-family:monospace;');
    
    labelEl.appendChild(topLabel);
    labelEl.appendChild(bottomLabel);

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
    closeBtn.setAttribute('aria-label', 'Close beacon');
    closeBtn.setAttribute('style',
      'font-size:8px;color:#8e90a0;cursor:pointer;' +
      'background:none;border:none;padding:0 0 0 4px;' +
      'line-height:1;opacity:0.6;transition:opacity 0.2s;' +
      'align-self:flex-start;flex-shrink:0;margin-top:2px;'
    );
    closeBtn.addEventListener('mouseenter', function() { closeBtn.style.opacity = '1'; });
    closeBtn.addEventListener('mouseleave', function() { closeBtn.style.opacity = '0.6'; });
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dismissBeacon();
    });

    container.appendChild(canvas);
    container.appendChild(labelEl);
    container.appendChild(closeBtn);

    // Dismiss helper
    function dismissBeacon() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      container.style.transition = 'opacity 0.3s, transform 0.3s';
      container.style.opacity = '0';
      container.style.transform = 'translateY(8px)';
      setTimeout(function() {
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 300);
    }

    // Hover effect
    container.addEventListener('mouseenter', function() {
      container.style.borderColor = 'rgba(99,102,241,0.4)';
      container.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3),0 0 30px ' + CONFIG.colors[0] + '33';
    });
    container.addEventListener('mouseleave', function() {
      container.style.borderColor = 'rgba(99,102,241,0.2)';
      container.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3),0 0 20px ' + CONFIG.colors[0] + '22';
    });

    // Click to show manifest
    var expanded = false;
    var manifestPanel = null;

    container.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!expanded) {
        manifestPanel = createManifestPanel();
        document.body.appendChild(manifestPanel);
        expanded = true;
      } else {
        if (manifestPanel && manifestPanel.parentNode) {
          manifestPanel.parentNode.removeChild(manifestPanel);
        }
        expanded = false;
      }
    });

    document.body.appendChild(container);

    return { canvas: canvas, bottomLabel: bottomLabel, container: container };
  }

  function createManifestPanel() {
    var panel = document.createElement('div');
    var isBottom = CONFIG.position.indexOf('B') === 0;
    var isRight = CONFIG.position.indexOf('R') > -1;
    
    panel.setAttribute('style',
      'position:fixed;' +
      (isBottom ? 'bottom:' + (canvasSize + 52) + 'px;' : 'top:' + (canvasSize + 52) + 'px;') +
      (isRight ? 'right:16px;' : 'left:16px;') +
      'z-index:99998;' +
      'width:340px;max-height:400px;overflow:auto;' +
      'background:rgba(10,10,18,0.95);' +
      'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);' +
      'border:1px solid rgba(99,102,241,0.25);' +
      'border-radius:12px;' +
      'box-shadow:0 8px 40px rgba(0,0,0,0.4);' +
      'padding:16px;' +
      'font-family:monospace;font-size:11px;color:#a5b4fc;' +
      'white-space:pre-wrap;word-break:break-all;line-height:1.5;'
    );

    // Header
    var header = document.createElement('div');
    header.setAttribute('style', 'font-family:-apple-system,system-ui,sans-serif;font-size:12px;font-weight:700;color:#e0e2ea;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;');

    var headerTitle = document.createElement('span');
    headerTitle.textContent = 'AIM Manifest';
    header.appendChild(headerTitle);

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
    closeBtn.setAttribute('aria-label', 'Close manifest panel');
    closeBtn.setAttribute('style', 'font-size:10px;color:#555;cursor:pointer;background:none;border:none;padding:4px;');
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    });
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Manifest content
    var content = document.createElement('pre');
    content.setAttribute('style', 'margin:0;font-size:10px;line-height:1.5;');
    content.textContent = JSON.stringify(currentManifest, null, 2);
    panel.appendChild(content);

    return panel;
  }


  // ═══════════════════════════════════════════
  // INJECT STYLES
  // ═══════════════════════════════════════════

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = '';
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════
  // INJECT META TAG
  // ═══════════════════════════════════════════

  function injectMetaTag() {
    // Don't duplicate
    if (document.querySelector('meta[name="aim"]')) return;
    var meta = document.createElement('meta');
    meta.name = 'aim';
    meta.content = 'generated';
    meta.setAttribute('data-aim-version', '0.1');
    document.head.appendChild(meta);
  }

  // ═══════════════════════════════════════════
  // MAIN INITIALIZATION
  // ═══════════════════════════════════════════

  var currentManifest = null;
  var beaconUI = null;
  var animationFrame = null;
  var tick = 0;

  function updateManifest() {
    currentManifest = introspectPage();
    
    // Expose manifest globally for agents
    window.__AIM_MANIFEST__ = currentManifest;
    
    // Also expose as a custom event for agents listening
    var event = new CustomEvent('aim:manifest-updated', { detail: currentManifest });
    document.dispatchEvent(event);

    // Update label
    if (beaconUI && beaconUI.bottomLabel) {
      beaconUI.bottomLabel.textContent = currentManifest.element_count + ' elements · v0.1';
    }
  }

  function startAnimation() {
    if (!beaconUI || !beaconUI.canvas) return;
    var ctx = beaconUI.canvas.getContext('2d');
    var cell = canvasSize / gridSize;
    var painter = painters[CONFIG.style] || painters.shimmer;

    function paint() {
      tick++;
      painter(ctx, gridSize, cell, tick, rgbColors);
      animationFrame = requestAnimationFrame(paint);
    }
    paint();
  }

  function init() {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    injectStyles();
    injectMetaTag();

    // Initial introspection
    updateManifest();

    // Create beacon UI (unless hidden)
    if (CONFIG.visibility !== 'hidden') {
      beaconUI = createBeaconUI();
      startAnimation();

      // Peek mode: auto-dismiss after 3 seconds
      if (CONFIG.visibility === 'peek') {
        setTimeout(function() {
          if (beaconUI && beaconUI.container && beaconUI.container.parentNode) {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            beaconUI.container.style.transition = 'opacity 0.3s, transform 0.3s';
            beaconUI.container.style.opacity = '0';
            beaconUI.container.style.transform = 'translateY(8px)';
            setTimeout(function() {
              if (beaconUI.container.parentNode) beaconUI.container.parentNode.removeChild(beaconUI.container);
            }, 300);
          }
        }, 3000);
      }
    }


    // Watch for DOM changes (SPA support)
    var debounceTimer = null;
    var observer = new MutationObserver(function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateManifest, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value', 'checked', 'disabled', 'hidden', 'aria-label', 'data-aim-label'],
    });

    // Also update on URL changes (for SPAs using pushState)
    var lastUrl = location.href;
    setInterval(function() {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(updateManifest, 300);
      }
    }, 500);

    // Log init
    console.log(
      '%c◈ AIM Protocol%c AgentBeacon active — ' + currentManifest.element_count + ' elements detected',
      'color:#a5b4fc;font-weight:bold;',
      'color:#8e90a0;'
    );
    console.log(
      '%c  Access manifest: %cwindow.__AIM_MANIFEST__',
      'color:#555;',
      'color:#a5b4fc;'
    );
  }

  init();

})();
