<script setup>
import {ref} from 'vue'

const count = ref(0)

</script>

<template>
  <div class="chat">
    <div class="chatBody">
      <div class="messageBox" ref="messageBox">
        <div class="header">
          <span>ChatGPT-3.5-Turbo</span>
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
  </div>
</template>
<script>
import {marked} from "marked";
import {fetchEventSource} from "@microsoft/fetch-event-source";

export default {
  data() {
    return {
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
  mounted() {
    this.handleScroll()
  },
  methods: {
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
      let body = {
        model: "gpt-3.5-turbo",
        messages: [...this.initMessage, ...this.messages].reverse().slice(0,10).reverse(),
        stream: true
      }
      this.allowedSend = false
      const abortController = new AbortController()
      const that = this
      fetchEventSource("https://chatapi.greenlemon.icu/proxy/api.openai.com/v1/chat/completions", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
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
          console.log(msg)
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
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .messageBox {
      overflow-y: scroll;
      padding: 0 0 10px 0;

      .header {
        border-bottom: 1px solid #cccccc;
        padding: 10px 0 10px 10px;
        font-size: 1.2rem;
        font-weight: bold;
        position: sticky;
        top: 0;
        background-color: #fff;
        z-index: 999;
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
