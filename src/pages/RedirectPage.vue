<template>
  <div></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const targetPath = route.query.to as string || '/'
  // 立即跳转到目标路由
  router.replace(targetPath)
})
</script>
