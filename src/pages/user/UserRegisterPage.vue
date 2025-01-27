<template>
  <div id="userRegisterPage">
    <div class="register-container">
      <div class="register-header">
        <h2 class="title">悦木图库</h2>
        <p class="subtitle">创建新账号</p>
      </div>

      <a-form
        :model="formState"
        name="basic"
        autocomplete="off"
        @finish="handleSubmit"
        class="register-form"
      >
        <!-- 账号输入 -->
        <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input
            v-model:value="formState.userAccount"
            placeholder="请输入账号"
            size="large"
            :prefix="h(UserOutlined)"
            class="custom-input"
          />
        </a-form-item>

        <!-- 密码输入 -->
        <a-form-item
          name="userPassword"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码长度不能小于 8 位' },
          ]"
        >
          <a-input-password
            v-model:value="formState.userPassword"
            placeholder="请输入密码"
            size="large"
            :prefix="h(LockOutlined)"
            class="custom-input"
          />
        </a-form-item>

        <!-- 确认密码 -->
        <a-form-item
          name="checkPassword"
          :rules="[{ required: true, message: '请确认密码' }, { validator: validatePassword }]"
        >
          <a-input-password
            v-model:value="formState.checkPassword"
            placeholder="请确认密码"
            size="large"
            :prefix="h(CheckOutlined)"
            class="custom-input"
          />
        </a-form-item>

        <!-- 登录链接 -->
        <div class="login-link">
          已有账号？
          <RouterLink to="/user/login" class="link-text">立即登录</RouterLink>
        </div>

        <!-- 注册按钮 -->
        <a-form-item>
          <a-button type="primary" html-type="submit" class="submit-button" size="large">
            注册
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, h } from 'vue'
import { userRegisterUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import router from '@/router'
import { UserOutlined, LockOutlined, CheckOutlined } from '@ant-design/icons-vue'

// 表单数据
const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

// 验证两次密码是否一致
const validatePassword = async (_rule: any, value: string) => {
  if (value !== formState.userPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

// 提交表单
const handleSubmit = async (values: any) => {
  const res = await userRegisterUsingPost(values)
  if (res.data.code === 0 && res.data.data) {
    message.success('注册成功')
    await router.push('/user/login')
  } else {
    message.error('注册失败，' + res.data.message)
  }
}
</script>

<style scoped>
#userRegisterPage {
  max-width: 360px;
  margin: 0 auto;
  padding-top: 40px;
}

.register-container {
  padding: 0 16px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
}

.register-form {
  :deep(.ant-form-item) {
    margin-bottom: 24px;
  }
}

.custom-input {
  :deep(.ant-input) {
    height: 44px;
    border-radius: 12px;
    border-color: #e2e8f0;
    padding: 0 16px 0 44px;
    transition: all 0.3s ease;
    font-size: 15px;

    &:hover {
      border-color: #ff8e53;
    }

    &:focus {
      border-color: #ff8e53;
      box-shadow: 0 0 0 2px rgba(255, 142, 83, 0.1);
    }
  }

  :deep(.ant-input-prefix) {
    margin-right: 12px;
    color: #94a3b8;
    font-size: 18px;
  }
}

.verify-code-container {
  display: flex;
  gap: 12px;
  align-items: center;

  .verify-input {
    flex: 1;
  }

  .code-image {
    width: 120px;
    height: 44px;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(1px);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 2px;
    }
  }
}

.login-link {
  text-align: center;
  margin-bottom: 24px;
  color: #64748b;
  font-size: 14px;

  .link-text {
    color: #ff8e53;
    font-weight: 500;
    margin-left: 4px;
    transition: color 0.3s ease;

    &:hover {
      color: #ff7a3d;
    }
  }
}

.submit-button {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%);
  border: none;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  #userRegisterPage {
    padding-top: 32px;
  }

  .register-container {
    padding: 32px 24px;
    border-radius: 20px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 15px;
  }

  .custom-input {
    :deep(.ant-input) {
      height: 42px;
      font-size: 14px;
    }
  }

  .verify-code-container {
    .code-image {
      width: 110px;
      height: 42px;
    }
  }

  .submit-button {
    height: 42px;
    font-size: 15px;
  }
}
</style>
