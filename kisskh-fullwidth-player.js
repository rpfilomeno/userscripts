// ==UserScript==
// @name         KissKH Full Width Player
// @namespace    kisskh-fullwidth-player
// @version      1.0
// @description  Make the video player span the full content width (below the toolbar) and keep the episode list stacked underneath it.
// @author       you
// @match        https://kisskh.ovh/*
// @match        https://*.kisskh.ovh/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const STYLE_ID = 'kkh-fullwidth-player-style';

  const css = `
    /* The row that holds [player column] + [episode list column] */
    app-drama > div.row.d-flex.justify-content-center {
      flex-direction: column !important;
    }

    /* Player column: force it to take the full row width */
    app-drama .col-12.col-xl-7 {
      flex: 0 0 100% !important;
      max-width: 100% !important;
      width: 100% !important;
    }

    /* Episode list / info column: also full width, sits below because it's second in the DOM */
    app-drama .col-12.col-xl.px-md-0 {
      flex: 0 0 100% !important;
      max-width: 100% !important;
      width: 100% !important;
      max-height: none !important;
    }

    /* mat-video is a custom element (defaults to inline) - make it a block so
       explicit pixel width/height set by JS below actually take effect */
    app-watch mat-video {
      display: block !important;
      margin: 0 auto !important;
    }
  `;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  const GAP_BELOW = 12; // small breathing room so the player isn't flush to the viewport edge

  function sizePlayer() {
    const player = document.querySelector('app-watch mat-video');
    const column = document.querySelector('app-drama .col-12.col-xl-7');
    if (!player || !column) return;

    // Reset so we can measure the column's natural (unconstrained) width
    player.style.width = '';
    player.style.height = '';

    const availableWidth = column.clientWidth;
    const topOffset = player.getBoundingClientRect().top;
    const availableHeight = window.innerHeight - topOffset - GAP_BELOW;

    const naturalHeight = availableWidth * (9 / 16);

    let finalWidth, finalHeight;
    if (naturalHeight > availableHeight && availableHeight > 0) {
      // Too tall for the viewport at full width: shrink both dimensions
      // proportionally so the whole player fits without scrolling.
      finalHeight = availableHeight;
      finalWidth = finalHeight * (16 / 9);
    } else {
      finalWidth = availableWidth;
      finalHeight = naturalHeight;
    }

    player.style.width = finalWidth + 'px';
    player.style.height = finalHeight + 'px';
  }

  function nudgeResize() {
    // Some player internals also recompute their own sizing on window resize.
    window.dispatchEvent(new Event('resize'));
  }

  function applyAll() {
    injectStyle();
    sizePlayer();
    nudgeResize();
  }

  applyAll();
  window.addEventListener('resize', sizePlayer);
  window.addEventListener('orientationchange', () => setTimeout(sizePlayer, 100));

  // kisskh is an Angular SPA — content gets re-rendered on navigation between
  // episodes, so keep watching the DOM and re-apply as needed. Debounce so
  // the observer's own DOM writes don't cause an infinite loop.
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      applyAll();
      pending = false;
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
