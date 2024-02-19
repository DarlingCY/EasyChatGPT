<script setup>
import {ref} from 'vue'

const count = ref(0)
</script>

<template>
  <div class="chat">
    <div class="chatBody">
      <div class="messageBox" ref="messageBox">
        <div class="header">
          <span>EasyChatGPT</span>
          <n-button @click.stop="showModal=true" size="medium">替换ApiKey</n-button>
        </div>
        <div class="message" :class="'user'===item['role']?'messageRight':'messageLeft'" v-for="(item,index) in messages" :key="index">
          <n-avatar round :size="36" :src="'user'===item['role']?'https://avatars.githubusercontent.com/u/41161187?s=40&v=4':'https://i-1.rar8.net/2023/2/24/e7a2033b-c04e-418c-a1a8-0c3a109557d1.png'"/>
          <div v-highlight v-html="marked.parse(item.content)" class="content"></div>
        </div>
      </div>
      <div class="inputArea">
        <n-input v-model:value="inputText" type="text" @keydown.enter.stop="sendMessage" placeholder="在此输入您的问题" size="large"/>
        <n-button type="info" @click.stop="sendMessage" size="large" :disabled="!allowedSend">发送</n-button>
      </div>
    </div>
    <n-modal
        v-model:show="showModal"
        preset="dialog"
        positive-text="保存"
        negative-text="取消"
        :maskClosable="false"
        type="info"
        title="ApiKey"
        :show-icon="false"
        @close="showModal=false;inputApiKey=''">
      <template #default>
        <n-input v-model:value="inputApiKey" placeholder="填写您的ApiKey"/>
      </template>
      <template #action>
        <n-button type="primary" @click="replaceApiKey">保存</n-button>
        <n-button type="info" @click.stop="inputApiKey=''">清空</n-button>
        <n-button @click.stop="showModal=false;inputApiKey=''">取消</n-button>
      </template>
    </n-modal>
  </div>
</template>
<script>
import {marked} from "marked";
import {fetchEventSource} from "@microsoft/fetch-event-source";

export default {
  data() {
    return {
      inputApiKey: "",
      apiKey: "",
      showModal: false,
      allowedSend: true,
      inputText: "",
      initMessage: [
        {
          role: "system",
          content: "You are an AI assistant called ‘青柠’ in Chinese that based on the language model gpt-3.5-turbo, you are helpful, creative, clever, friendly and honest. You must reply to me in Simplified Chinese."
        }
      ],
      messages: [
        {
          role: "assistant",
          content: "你好，我是ChatGPT！"
        }
      ],
    }
  },
  created() {
    this.init()
  },
  mounted() {
    this.handleScroll()
    this.safariHacks()
  },
  methods: {
    safariHacks() {
      let windowsVH = window.innerHeight / 100;
      document.querySelector('.chatBody').style.setProperty('--vh', windowsVH + 'px');
      window.addEventListener('resize', function () {
        document.querySelector('.chatBody').style.setProperty('--vh', windowsVH + 'px');
      });
    },
    init() {
      let apiKey = localStorage.getItem("ApiKey")
      this.apiKey = apiKey ? "" : apiKey
      this.inputApiKey = this.apiKey
    },
    replaceApiKey() {
      this.showModal = false
      this.apiKey = this.inputApiKey
      localStorage.setItem("ApiKey", this.apiKey)
    },
    handleScroll() {
      this.$nextTick(() => {
        let scrollElem = this.$refs.messageBox;
        scrollElem.scrollTo({top: scrollElem.scrollHeight, behavior: 'smooth'});
      });
    },
    sendMessage() {
      if (this.inputText.trim().length === 0) {
        return
      }
      let message = {
        role: "user",
        content: this.inputText
      }
      this.inputText = ""
      this.messages.push(message)
      this.handleScroll()
      let messages = [...this.messages]
      let body = {
        model: "gpt-3.5-turbo",
        messages: [...this.initMessage, ...(messages.reverse().slice(0, 10).reverse())],
        stream: true
      }
      this.allowedSend = false
      const abortController = new AbortController()
      const that = this
      let headers = {
        "Content-Type": "application/json",
        "Authorization": "sp-SW52wThdgXk5ocGi1783389566E44f1a84B4946202Cd4958"
      }
      fetchEventSource("https://perkai.pushplus.plus/v1/chat/completions", {
        method: "POST",
        body: JSON.stringify(body),
        headers: headers,
        signal: abortController.signal,
        async onopen(response) {
          if (response.ok) {
          } else {
            let resText = [await response.clone().json()]
            console.log(resText[0]["error"]["message"])
            if (response.status === 429) {
              //达到OpenAi限制
              window.$message.error("发送频繁，请在20秒后重试")
            } else if (response.status === 400) {
              window.$message.error("超出最大对话长度，请刷新页面后重试")
            }
          }
        },
        onmessage(msg) {
          if (msg.event === 'FatalError') {
            that.allowedSend = true
            throw new Error(msg.data);
          }
          if (msg.data === '[DONE]') {
            //通知结束
            that.allowedSend = true
          } else {
            const data = JSON.parse(msg.data);
            let messageSize = that.messages.length
            let content = data["choices"][0]["delta"]["content"]
            content = content ? content : ""
            if (that.messages[messageSize - 1].role !== "user") {
              //非用户信息
              let endMessage = that.messages[messageSize - 1]
              endMessage.content += content
              that.messages[messageSize - 1] = endMessage
            } else {
              //用户信息
              let endMessage = {
                role: "assistant",
                content: content
              }
              that.messages.push(endMessage)
            }
            that.handleScroll()
          }
        },
        onclose() {
          that.allowedSend = true
        },
        onerror(err) {
          console.log("err", err)
          that.allowedSend = true
          throw new Error(err)
        }
      })
    }
  }
}
</script>
<style lang="less" scoped>
@media only screen and (max-width: 768px) {
  .chatBody {
    width: 100%;
  }
}

@media only screen and (min-width: 768px) {
  .chatBody {
    width: 50%;
  }
}

/* 整个滚动条 */
::-webkit-scrollbar {
  /* 对应纵向滚动条的宽度 */
  width: 5px;
  /* 对应横向滚动条的宽度 */
  height: 5px;
}

/* 滚动条上的滚动滑块 */
::-webkit-scrollbar-thumb {
  background-color: #cccccc;
  border-radius: 32px;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
  background-color: transparent;
  border-radius: 32px;
}

.chat {
  display: flex;
  justify-content: center;

  .chatBody {
    border: 1px solid #ccc;
    height: calc(var(--vh, 1vh) * 100);
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .messageBox {
      overflow-y: scroll;
      padding: 0 0 10px 0;

      .header {
        border-bottom: 1px solid #cccccc;
        padding: 10px;
        font-size: 1.2rem;
        font-weight: bold;
        position: sticky;
        top: 0;
        background-color: #fff;
        z-index: 999;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .message {
        width: 100%;
        height: auto;
        display: flex;
        padding: 10px;

        .content {
          background-color: rgb(244, 246, 248);
          padding: 10px;
          max-width: 80%;
          width: auto;
          border-radius: 5px;
        }
      }

      .messageLeft {
        display: flex;
        gap: 10px;
      }

      .messageRight {
        display: flex;
        flex-direction: row-reverse;
        gap: 10px;
      }
    }

    .inputArea {
      display: flex;
      gap: 10px;
      padding: 10px;
    }
  }
}
</style>
