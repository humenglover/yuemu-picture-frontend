<template>
  <div class="yuemu-solar">
    <i class="yuemu-mercury"></i>
    <i class="yuemu-venus"></i>
    <i class="yuemu-earth"></i>
    <i class="yuemu-mars"></i>
    <i class="yuemu-belt"></i>
    <i class="yuemu-jupiter"></i>
    <i class="yuemu-saturn"></i>
    <i class="yuemu-uranus"></i>
    <i class="yuemu-neptune"></i>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.yuemu-solar {
  margin: 0 auto;
  height: 40px;
  width: 40px;
  background: orange;
  border-radius: 20px;
  position: relative;
  animation: yuemu-glow 1.5s linear infinite;
  transform: scale(0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media screen and (max-width: 768px) {
  .yuemu-solar {
    transform: scale(0.45);
  }
}

.yuemu-solar i {
  border-radius: 250px;
  display: block;
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-sizing: border-box;
  transform-origin: 50% 50%;
}

.yuemu-solar i:before {
  content: "";
  border-radius: 25px;
  background: black;
  display: block;
  position: absolute;
  top: -5px;
  right: 45%;
}

.yuemu-solar i.yuemu-mercury {
  width: 80px;
  height: 80px;
  margin-left: -40px;
  left: 50%;
  top: 50%;
  margin-top: -40px;
  animation: yuemu-orbit 0.5s linear infinite;
}

.yuemu-solar i.yuemu-mercury:before {
  background: #6f5f5f;
  height: 7px;
  width: 7px;
}

.yuemu-solar i.yuemu-venus {
  width: 120px;
  height: 120px;
  margin-left: -60px;
  left: 50%;
  top: 50%;
  margin-top: -60px;
  animation: yuemu-orbit 1s linear infinite;
}

.yuemu-solar i.yuemu-venus:before {
  background: #e7a71f;
  height: 10px;
  width: 10px;
}

.yuemu-solar i.yuemu-earth {
  width: 160px;
  height: 160px;
  margin-left: -80px;
  left: 50%;
  top: 50%;
  margin-top: -80px;
  animation: yuemu-orbit 1.5s linear infinite;
}

.yuemu-solar i.yuemu-earth:before {
  background: #63bee2;
  height: 10px;
  width: 10px;
}

.yuemu-solar i.yuemu-mars {
  width: 200px;
  height: 200px;
  margin-left: -100px;
  left: 50%;
  top: 50%;
  margin-top: -100px;
  animation: yuemu-orbit 2s linear infinite;
}

.yuemu-solar i.yuemu-mars:before {
  background: red;
  height: 10px;
  width: 10px;
}

.yuemu-solar i.yuemu-belt {
  box-sizing: border-box;
  border-width: 20px;
  width: 240px;
  height: 240px;
  margin-left: -120px;
  border-color: rgba(36, 35, 35, 0.21);
  left: 50%;
  top: 50%;
  margin-top: -120px;
}

.yuemu-solar i.yuemu-jupiter {
  width: 280px;
  height: 280px;
  margin-left: -140px;
  left: 50%;
  top: 50%;
  margin-top: -140px;
  animation: yuemu-orbit 2.5s linear infinite;
}

.yuemu-solar i.yuemu-jupiter:before {
  background: #cf9b2b;
  top: -15px;
  height: 30px;
  width: 30px;
}

.yuemu-solar i.yuemu-saturn {
  width: 320px;
  height: 320px;
  margin-left: -160px;
  left: 50%;
  top: 50%;
  margin-top: -160px;
  animation: yuemu-orbit 3s linear infinite;
}

.yuemu-solar i.yuemu-saturn:before {
  background: #cf7a2b;
  top: -10px;
  height: 20px;
  width: 20px;
}

.yuemu-solar i.yuemu-saturn:after {
  background: #fff;
  width: 30px;
  height: 1px;
  content: "";
  position: absolute;
  display: block;
  right: 43.5%;
  transform: rotate(20deg);
}

.yuemu-solar i.yuemu-uranus {
  width: 360px;
  height: 360px;
  margin-left: -180px;
  left: 50%;
  top: 50%;
  margin-top: -180px;
  animation: yuemu-orbit 3.5s linear infinite;
}

.yuemu-solar i.yuemu-uranus:before {
  background: #10c593;
  top: -8px;
  height: 15px;
  width: 15px;
}

.yuemu-solar i.yuemu-neptune {
  width: 400px;
  height: 400px;
  margin-left: -200px;
  left: 50%;
  top: 50%;
  margin-top: -200px;
  animation: yuemu-orbit 4s linear infinite;
}

.yuemu-solar i.yuemu-neptune:before {
  background: #1470e4;
  top: -8px;
  height: 15px;
  width: 15px;
}

@keyframes yuemu-orbit {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(-180deg); }
  100% { transform: rotate(-360deg); }
}

@keyframes yuemu-glow {
  0% { box-shadow: none; }
  50% { background: #ffeb00; box-shadow: 0 0 20px orange; }
  100% { box-shadow: none; }
}
</style>
