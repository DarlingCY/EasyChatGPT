<script setup>
import Chat from './components/Chat.vue'
import Message from "./components/Message.vue";
</script>

<template>
  <Chat/>
  <n-message-provider>
    <Message/>
  </n-message-provider>
</template>

<style scoped>
</style>
