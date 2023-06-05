import {createApp} from 'vue'
// import './style.css'
import './fonts/css/fonts.css'
import App from './App.vue'
import highlight from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css' //样式
import axios from "axios";

const app = createApp(App)

//创建v-highlight全局指令
app.directive('highlight', function (el) {
    let blocks = el.querySelectorAll('pre code');
    blocks.forEach((block) => {
        highlight.highlightBlock(block)
    })
})
app.config.globalProperties.$axios = axios
app.mount('#app')
