<template>
  <label id="yuemu-theme-toggle-button">
    <input type="checkbox" id="yuemu-toggle" :checked="themeStore.isDarkTheme" @change="themeStore.toggleTheme">
    <svg viewBox="0 0 69.667 44" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(3.5 3.5)" data-name="Component 15 – 1" id="yuemu-Component_15_1">
        <g filter="url(#yuemu-container-filter)" transform="matrix(1, 0, 0, 1, -3.5, -3.5)">
          <rect fill="#83cbd8" transform="translate(3.5 3.5)" rx="17.5" height="35" width="60.667" data-name="container" id="yuemu-container"></rect>
        </g>

        <g transform="translate(2.333 2.333)" id="yuemu-button">
          <g data-name="sun" id="yuemu-sun">
            <g filter="url(#yuemu-sun-outer-filter)" transform="matrix(1, 0, 0, 1, -5.83, -5.83)">
              <circle fill="#f8e664" transform="translate(5.83 5.83)" r="15.167" cy="15.167" cx="15.167" data-name="sun-outer" id="yuemu-sun-outer-2"></circle>
            </g>
            <g filter="url(#yuemu-sun-filter)" transform="matrix(1, 0, 0, 1, -5.83, -5.83)">
              <path fill="rgba(246,254,247,0.29)" transform="translate(9.33 9.33)" d="M11.667,0A11.667,11.667,0,1,1,0,11.667,11.667,11.667,0,0,1,11.667,0Z" data-name="sun" id="yuemu-sun-3"></path>
            </g>
            <circle fill="#fcf4b9" transform="translate(8.167 8.167)" r="7" cy="7" cx="7" id="yuemu-sun-inner"></circle>
          </g>

          <g data-name="moon" id="yuemu-moon">
            <g filter="url(#yuemu-moon-filter)" transform="matrix(1, 0, 0, 1, -31.5, -5.83)">
              <circle fill="#cce6ee" transform="translate(31.5 5.83)" r="15.167" cy="15.167" cx="15.167" data-name="moon" id="yuemu-moon-3"></circle>
            </g>
            <g fill="#a6cad0" transform="translate(-24.415 -1.009)" id="yuemu-patches">
              <circle transform="translate(43.009 4.496)" r="2" cy="2" cx="2"></circle>
              <circle transform="translate(39.366 17.952)" r="2" cy="2" cx="2" data-name="patch"></circle>
              <circle transform="translate(33.016 8.044)" r="1" cy="1" cx="1" data-name="patch"></circle>
              <circle transform="translate(51.081 18.888)" r="1" cy="1" cx="1" data-name="patch"></circle>
              <circle transform="translate(33.016 22.503)" r="1" cy="1" cx="1" data-name="patch"></circle>
              <circle transform="translate(50.081 10.53)" r="1.5" cy="1.5" cx="1.5" data-name="patch"></circle>
            </g>
          </g>
        </g>

        <g filter="url(#yuemu-cloud-filter)" transform="matrix(1, 0, 0, 1, -3.5, -3.5)">
          <path fill="#fff" transform="translate(-3466.47 -160.94)" d="M3512.81,173.815a4.463,4.463,0,0,1,2.243.62.95.95,0,0,1,.72-1.281,4.852,4.852,0,0,1,2.623.519c.034.02-.5-1.968.281-2.716a2.117,2.117,0,0,1,2.829-.274,1.821,1.821,0,0,1,.854,1.858c.063.037,2.594-.049,3.285,1.273s-.865,2.544-.807,2.626a12.192,12.192,0,0,1,2.278.892c.553.448,1.106,1.992-1.62,2.927a7.742,7.742,0,0,1-3.762-.3c-1.28-.49-1.181-2.65-1.137-2.624s-1.417,2.2-2.623,2.2a4.172,4.172,0,0,1-2.394-1.206,3.825,3.825,0,0,1-2.771.774c-3.429-.46-2.333-3.267-2.2-3.55A3.721,3.721,0,0,1,3512.81,173.815Z" data-name="cloud" id="yuemu-cloud"></path>
        </g>

        <g fill="#def8ff" transform="translate(3.585 1.325)" id="yuemu-stars">
          <path transform="matrix(-1, 0.017, -0.017, -1, 24.231, 3.055)" d="M.774,0,.566.559,0,.539.458.933.25,1.492l.485-.361.458.394L1.024.953,1.509.592.943.572Z"></path>
          <path transform="matrix(-0.777, 0.629, -0.629, -0.777, 23.185, 12.358)" d="M1.341.529.836.472.736,0,.505.46,0,.4.4.729l-.231.46L.605.932l.4.326L.9.786Z" data-name="star"></path>
          <path transform="matrix(0.438, 0.899, -0.899, 0.438, 23.177, 29.735)" d="M.015,1.065.475.9l.285.365L.766.772l.46-.164L.745.494.751,0,.481.407,0,.293.285.658Z" data-name="star"></path>
          <path transform="translate(12.677 0.388) rotate(104)" d="M1.161,1.6,1.059,1,1.574.722.962.607.86,0,.613.572,0,.457.446.881.2,1.454l.516-.274Z" data-name="star"></path>
          <path transform="matrix(-0.07, 0.998, -0.998, -0.07, 11.066, 15.457)" d="M.873,1.648l.114-.62L1.579.945,1.03.62,1.144,0,.706.464.157.139.438.7,0,1.167l.592-.083Z" data-name="star"></path>
          <path transform="translate(8.326 28.061) rotate(11)" d="M.593,0,.638.724,0,.982l.7.211.045.724.36-.64.7.211L1.342.935,1.7.294,1.063.552Z" data-name="star"></path>
          <path transform="translate(5.012 5.962) rotate(172)" d="M.816,0,.5.455,0,.311.323.767l-.312.455.516-.215.323.456L.827.911,1.343.7.839.552Z" data-name="star"></path>
          <path transform="translate(2.218 14.616) rotate(169)" d="M1.261,0,.774.571.114.3.487.967,0,1.538.728,1.32l.372.662.047-.749.728-.218L1.215.749Z" data-name="star"></path>
        </g>
      </g>
    </svg>
  </label>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { useThemeStore } from '@/stores/useThemeStore'

const themeStore = useThemeStore()
</script>

<style scoped>
#yuemu-theme-toggle-button {
  font-size: 12px;
  position: relative;
  display: inline-block;
  width: 4em;
  cursor: pointer;
}

#yuemu-toggle {
  opacity: 0;
  width: 0;
  height: 0;
}

#yuemu-container,
#yuemu-patches,
#yuemu-stars,
#yuemu-button,
#yuemu-sun,
#yuemu-moon,
#yuemu-cloud {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 0.25s;
}

#yuemu-toggle:checked + svg #yuemu-container {
  fill: #2b4360;
}

#yuemu-toggle:checked + svg #yuemu-button {
  transform: translate(28px, 2.333px);
}

#yuemu-sun {
  opacity: 1;
}

#yuemu-toggle:checked + svg #yuemu-sun {
  opacity: 0;
}

#yuemu-moon {
  opacity: 0;
}

#yuemu-toggle:checked + svg #yuemu-moon {
  opacity: 1;
}

#yuemu-cloud {
  opacity: 1;
}

#yuemu-toggle:checked + svg #yuemu-cloud {
  opacity: 0;
}

#yuemu-stars {
  opacity: 0;
}

#yuemu-toggle:checked + svg #yuemu-stars {
  opacity: 1;
}

@media screen and (max-width: 768px) {
  #yuemu-theme-toggle-button {
    display: none;
  }
}

:deep(svg) {
  width: 100%;
  height: auto;
}
</style>
